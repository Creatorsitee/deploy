import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/store';
import { extractZipSafely, detectFramework, executeDeployment } from '@/lib/deployment-service';
import { getVercelConfig } from '@/lib/vercel/client';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const project = db.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (project.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This project has been suspended by administration. Contact support.' },
        { status: 403 }
      );
    }

    const vercelConfig = getVercelConfig();
    if (!vercelConfig.isConfigured) {
      return NextResponse.json(
        { error: 'Token Vercel belum dimasukkan di Admin Panel / Admin Settings. Silakan masukkan Token Vercel Anda di menu Admin terlebih dahulu sebelum melakukan Deploy.' },
        { status: 400 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let filesToDeploy: { file: string; data: string; encoding?: 'utf-8' | 'base64' }[] = [];
    let sourceType: 'zip' | 'template' | 'git' = 'zip';
    let sourceName = 'Manual Upload';
    let commitMsg = 'Deploy project updates';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const isSingleHtml = formData.get('isSingleHtml') === 'true';
      commitMsg = (formData.get('commitMessage') as string) || 'Upload source';

      if (!file) {
        return NextResponse.json({ error: 'No file provided in upload' }, { status: 400 });
      }

      if (isSingleHtml) {
        if (!file.name.endsWith('.html')) {
          return NextResponse.json({ error: 'Expected an .html file' }, { status: 400 });
        }
        const text = await file.text();
        filesToDeploy = [{
          file: 'index.html',
          data: text,
          encoding: 'utf-8',
        }];
        sourceType = 'zip'; // Treating it as a set of files
        sourceName = file.name;
        
        // Ensure static framework for single HTML
        db.updateProject(project.id, {
          framework: 'static',
          buildCommand: '',
          installCommand: '',
          outputDirectory: './',
        });
      } else {
        if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
          return NextResponse.json({ error: 'Only .zip archives are supported' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const extracted = await extractZipSafely(arrayBuffer);

        filesToDeploy = extracted.map((f) => ({
          file: f.file,
          data: f.data,
          encoding: f.encoding,
        }));

        sourceType = 'zip';
        sourceName = file.name;

        // Update framework detection if default
        const detected = detectFramework(filesToDeploy);
        if (detected.framework && detected.framework !== project.framework) {
          db.updateProject(project.id, {
            framework: detected.framework,
            buildCommand: detected.buildCommand || project.buildCommand,
            installCommand: detected.installCommand || project.installCommand,
            outputDirectory: detected.outputDirectory || project.outputDirectory,
          });
        }
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();

      if (body.gitUrl) {
        const rawUrl = (body.gitUrl as string).trim();
        const match = rawUrl.match(/github\.com\/([^\/]+)\/([^\/\#\?]+)/i);
        sourceType = 'git';

        if (match) {
          const owner = match[1];
          const repo = match[2].replace(/\.git$/i, '');
          sourceName = `GitHub (${owner}/${repo})`;
          commitMsg = `Deploy GitHub repo ${owner}/${repo}`;

          // Attempt to fetch main or master branch zip archive
          const branchUrls = [
            `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/main`,
            `https://codeload.github.com/${owner}/${repo}/zip/refs/heads/master`,
          ];

          let downloaded = false;
          for (const zipUrl of branchUrls) {
            try {
              const res = await fetch(zipUrl, {
                headers: { 'User-Agent': 'CMNTY-Deployer/1.0' },
              });
              if (res.ok) {
                const arrayBuffer = await res.arrayBuffer();
                const extracted = await extractZipSafely(arrayBuffer);
                if (extracted.length > 0) {
                  filesToDeploy = extracted;
                  downloaded = true;
                  break;
                }
              }
            } catch (fetchErr) {
              console.warn(`Could not load ${zipUrl}:`, fetchErr);
            }
          }

          if (!downloaded || filesToDeploy.length === 0) {
            // Default empty deployment if repo not found or private
            filesToDeploy = [{ file: 'index.html', data: '<h1>Project Deployed via Git</h1>', encoding: 'utf-8' }];
          }
        } else {
          filesToDeploy = [{ file: 'index.html', data: '<h1>Project Deployed via Git</h1>', encoding: 'utf-8' }];
          sourceName = `Git (${rawUrl})`;
          commitMsg = `Deploy from ${rawUrl}`;
        }

        // Auto detect framework
        const detected = detectFramework(filesToDeploy);
        if (detected.framework) {
          db.updateProject(project.id, {
            framework: detected.framework,
            buildCommand: detected.buildCommand || project.buildCommand,
            installCommand: detected.installCommand || project.installCommand,
            outputDirectory: detected.outputDirectory || project.outputDirectory,
          });
        }
      } else if (body.redeploy) {
        // Find latest successful deployment
        const prev = db.getDeploymentsByProjectId(project.id);
        if (prev.length > 0) {
           // This is a simplified redeploy - in reality you might fetch the actual files from previous build
           filesToDeploy = [{ file: 'index.html', data: '<h1>Redeployed Project</h1>', encoding: 'utf-8' }];
           sourceName = prev[0].sourceName || 'Redeploy';
        } else {
           filesToDeploy = [{ file: 'index.html', data: '<h1>New Project</h1>', encoding: 'utf-8' }];
           sourceName = 'Initial Deploy';
        }
        sourceType = 'zip';
        commitMsg = 'Manual trigger redeploy';
      } else if (Array.isArray(body.files)) {
        filesToDeploy = body.files;
        sourceType = 'zip';
        sourceName = 'Web Editor';
        commitMsg = body.commitMessage || 'Deploy files from web editor';
      } else {
        return NextResponse.json({ error: 'Invalid deployment payload' }, { status: 400 });
      }
    }

    if (filesToDeploy.length === 0) {
      return NextResponse.json({ error: 'No files provided to deploy' }, { status: 400 });
    }

    // Refresh project in case framework was updated
    const freshProject = db.getProjectById(project.id)!;

    // Execute deployment
    const deployment = await executeDeployment({
      project: freshProject,
      userId: user.id,
      sourceType,
      sourceName,
      files: filesToDeploy,
      commitMessage: commitMsg,
    });

    return NextResponse.json({ deployment });
  } catch (err: any) {
    console.error('Deployment error', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred during deployment' },
      { status: 500 }
    );
  }
}
