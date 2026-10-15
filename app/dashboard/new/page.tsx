'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { authFetch } from '@/lib/auth/client';
import { PLATFORM_PRESETS } from '@/lib/vercel/frameworks';
import FrameworkIcon from '@/components/FrameworkIcon';
import { useToast } from '@/lib/contexts/ToastContext';
import { safeJson } from '@/lib/fetch-utils';
import EnvVarEditor from '@/components/EnvVarEditor';
import {
  detectEnvFromZip,
  parseEnvString,
  detectRecommendedEnvForFramework,
  detectFrameworkFromGithub,
} from '@/lib/env-detector';
import { isSubdomainReserved } from '@/lib/validation';
import {
  UploadCloud,
  FileArchive,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Globe,
  Settings2,
  Layers,
  Terminal,
  Clock,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Laptop,
  Smartphone,
  RefreshCw,
  QrCode,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface EnvVarItem {
  id: string;
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  visible?: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Wizard step
  const [step, setStep] = useState<number>(1);

  // Step 1: Project Details & Domain
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [availableDomains, setAvailableDomains] = useState<string[]>(['cmnty.biz.id']);
  const [selectedDomain, setSelectedDomain] = useState<string>('cmnty.biz.id');
  const [isCloudEngineConfigured, setIsCloudEngineConfigured] = useState<boolean>(true);
  const [frameworksList, setFrameworksList] = useState<any[]>([]);

  // Step 2: Source Code
  const [sourceType, setSourceType] = useState<'upload' | 'git'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [gitUrl, setGitUrl] = useState('');

  // Step 3: Framework & Build Settings & Environment Variables
  const [framework, setFramework] = useState('static');
  const [buildCommand, setBuildCommand] = useState('');
  const [installCommand, setInstallCommand] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('./');

  // Environment variables state
  const [envVars, setEnvVars] = useState<EnvVarItem[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newEnvTargets, setNewEnvTargets] = useState<('production' | 'preview' | 'development')[]>(['production', 'preview', 'development']);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkEnvText, setBulkEnvText] = useState('');
  const [detectingEnv, setDetectingEnv] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  const handleAutoDetectEnv = async () => {
    setDetectingEnv(true);
    setDetectMessage(null);
    try {
      let foundVars: { key: string; value: string; target?: ('production' | 'preview' | 'development')[] }[] = [];
      let summaryText = '';

      if (sourceType === 'upload' && uploadedFile) {
        if (uploadedFile.name.endsWith('.zip')) {
          const detection = await detectEnvFromZip(uploadedFile, frameworksList);
          foundVars = detection.variables;
          summaryText = detection.summary;
          if (detection.detectedFramework) {
            setFramework(detection.detectedFramework);
          }
        } else {
          // HTML or other single file
          const fullDomain = `${projectSlug || 'my-project'}.${selectedDomain}`;
          foundVars = detectRecommendedEnvForFramework('static', projectName, fullDomain);
          summaryText = `Detected recommended variables for static site.`;
          setFramework('static');
        }
      } else {
        const fullDomain = `${projectSlug || 'my-project'}.${selectedDomain}`;
        foundVars = detectRecommendedEnvForFramework(framework, projectName, fullDomain);
        summaryText = `Detected recommended variables for ${framework.toUpperCase()} framework.`;
      }

      if (foundVars.length > 0) {
        let addedCount = 0;
        setEnvVars((prev) => {
          const existingKeys = new Set(prev.map((e) => e.key));
          const newItems = foundVars
            .filter((v) => !existingKeys.has(v.key))
            .map((v) => ({
              id: `env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              key: v.key,
              value: v.value,
              target: v.target || ['production', 'preview', 'development'],
              visible: false,
            }));
          addedCount = newItems.length;
          return [...prev, ...newItems];
        });

        const msg = addedCount > 0
          ? `Added ${addedCount} environment variable(s).`
          : 'Environment variables are already up to date.';
        setDetectMessage(`✨ ${summaryText} ${msg}`);
        toast.success(`${summaryText} ${msg}`);
      } else {
        toast.info('No new environment variables detected.');
      }
    } catch (err: any) {
      console.error('Error auto-detecting env:', err);
      const errMsg = err?.message || 'Failed to detect environment variables.';
      setDetectMessage(`❌ ${errMsg}`);
      toast.error(errMsg);
    } finally {
      setDetectingEnv(false);
      setTimeout(() => setDetectMessage(null), 6000);
    }
  };

  // Step 4: Deployment Execution
  const [deploying, setDeploying] = useState(false);
  const [deployStepIndex, setDeployStepIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [isSuccessfullyDeployed, setIsSuccessfullyDeployed] = useState(false);
  const [deploymentCountdown, setDeploymentCountdown] = useState<number>(30);
  const [deploymentStatusText, setDeploymentStatusText] = useState<string>('Initializing final verification...');

  // Success Celebration Popup Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedSuccessUrl, setCopiedSuccessUrl] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userProjectCount, setUserProjectCount] = useState<number>(0);
  const [maxProjectsAllowed, setMaxProjectsAllowed] = useState<number>(3);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Load configured base domains and project counts from system config
  useEffect(() => {
    async function loadConfig() {
      try {
        const [configRes, projectsRes] = await Promise.all([
          fetch('/api/config').catch(() => null),
          authFetch('/api/projects').catch(() => null),
        ]);

        if (configRes && configRes.ok) {
          const data = await safeJson(configRes);
          if (data) {
            if (data.isVercelConfigured !== undefined) {
              setIsCloudEngineConfigured(data.isVercelConfigured);
            }
            if (Array.isArray(data.availableDomains) && data.availableDomains.length > 0) {
              setAvailableDomains(data.availableDomains);
              setSelectedDomain(data.baseDomain || data.availableDomains[0]);
            } else if (data.baseDomain) {
              setAvailableDomains([data.baseDomain]);
              setSelectedDomain(data.baseDomain);
            }
          }
        } else {
          // Fallback if blocked
          setAvailableDomains(['cmnty.biz.id']);
          setSelectedDomain('cmnty.biz.id');
        }

        if (projectsRes && projectsRes.ok) {
          const pData = await safeJson(projectsRes);
          if (pData) {
            const count = Array.isArray(pData.projects) ? pData.projects.length : 0;
            setUserProjectCount(count);
            if (count >= 3) {
              setIsLimitReached(true);
            }
          }
        }
      } catch (e) {
        // Fallback default
      }
    }
    loadConfig();

    async function loadFrameworks() {
      try {
        const res = await authFetch('/api/frameworks');
        if (res.ok) {
          const data = await safeJson(res);
          if (data && Array.isArray(data.frameworks)) {
            setFrameworksList(data.frameworks);
          }
        }
      } catch (e) {
        console.error('Failed to load frameworks:', e);
      }
    }
    loadFrameworks();
  }, []);

  // Auto-slug generator
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProjectName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setProjectSlug(generated);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const isZip = file.name.toLowerCase().endsWith('.zip');
    const isHtml = file.name.toLowerCase().endsWith('.html');

    if (isZip || isHtml) {
      setUploadedFile(file);
      const autoName = file.name.replace(/\.(zip|html)$/i, '');
      if (!projectName) {
        setProjectName(autoName);
        setProjectSlug(autoName.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
      }

      if (isHtml) {
        setFramework('static');
        setBuildCommand('');
        setInstallCommand('');
        setOutputDirectory('./');
      } else {
        // Default framework for ZIP if not detected yet
        const lowName = file.name.toLowerCase();
        let autoFw = 'nextjs';
        if (lowName.includes('vite')) autoFw = 'vite';
        else if (lowName.includes('astro')) autoFw = 'astro';
        else if (lowName.includes('vue')) autoFw = 'vue';
        else if (lowName.includes('nuxt')) autoFw = 'nuxt';
        else if (lowName.includes('svelte')) autoFw = 'svelte';
        else if (lowName.includes('react')) autoFw = 'react';
        else if (lowName.includes('next')) autoFw = 'nextjs';

        setFramework(autoFw);
        const preset = PLATFORM_PRESETS[autoFw];
        if (preset) {
          setBuildCommand(preset.defaultBuild);
          setOutputDirectory(preset.defaultOutput);
          setInstallCommand(preset.defaultInstall);
        }
      }
    } else {
      setErrorMessage('Only .zip and .html files are allowed');
    }
  };

  // Add Single Environment Variable
  const handleAddEnvVar = () => {
    const cleanKey = newEnvKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanKey) return;

    // Replace if exists, or append
    setEnvVars((prev) => {
      const filtered = prev.filter((e) => e.key !== cleanKey);
      return [
        ...filtered,
        {
          id: `env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          key: cleanKey,
          value: newEnvValue,
          target: newEnvTargets.length > 0 ? newEnvTargets : ['production', 'preview', 'development'],
          visible: false,
        },
      ];
    });

    setNewEnvKey('');
    setNewEnvValue('');
  };

  // Bulk Import .env file text
  const handleBulkImportEnv = () => {
    if (!bulkEnvText.trim()) return;

    const parsed = parseEnvString(bulkEnvText);
    if (parsed.length === 0) {
      toast.warning('No valid KEY=VALUE pairs found in pasted text.');
      return;
    }

    const newItems: EnvVarItem[] = parsed.map((item) => ({
      id: `env_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key: item.key,
      value: item.value,
      target: item.target || ['production', 'preview', 'development'],
      visible: false,
    }));

    setEnvVars((prev) => {
      const existingKeys = new Set(newItems.map((n) => n.key));
      const filtered = prev.filter((e) => !existingKeys.has(e.key));
      return [...filtered, ...newItems];
    });

    toast.success(`Imported ${newItems.length} environment variable(s)!`);
    setBulkEnvText('');
    setShowBulkModal(false);
  };

  const handleRemoveEnvVar = (key: string) => {
    setEnvVars((prev) => prev.filter((e) => e.key !== key));
  };

  const toggleTarget = (target: 'production' | 'preview' | 'development') => {
    if (newEnvTargets.includes(target)) {
      if (newEnvTargets.length > 1) {
        setNewEnvTargets(newEnvTargets.filter((t) => t !== target));
      }
    } else {
      setNewEnvTargets([...newEnvTargets, target]);
    }
  };

  // Start Deployment Pipeline
  const startDeployment = async () => {
    setDeploying(true);
    setErrorMessage('');
    setDeployStepIndex(0);
    setDeploymentStatusText('Deployment Pipeline In Progress...');

    try {
      // 1. Validating Project & Environment Configuration
      setDeployStepIndex(1);
      setDeploymentStatusText('Validating Project & Environment Configuration');
      const projRes = await authFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          slug: projectSlug,
          selectedDomain: selectedDomain,
          framework,
          buildCommand,
          installCommand,
          outputDirectory,
          environmentVariables: envVars.map((e) => ({
            key: e.key,
            value: e.value,
            target: e.target,
          })),
        }),
      });

      const projData = await safeJson(projRes);
      if (!projRes.ok) {
        throw new Error(projData?.error || 'Failed to create project');
      }

      const project = projData.project;
      setCreatedProjectId(project.id);

      // 2. Transmitting Source Files to Cloud Engine
      setDeployStepIndex(2);
      setDeploymentStatusText('Transmitting Source Files to Cloud Engine');
      let deployRes: Response;

      if (sourceType === 'upload' && uploadedFile) {
        const isHtml = uploadedFile.name.toLowerCase().endsWith('.html');
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('commitMessage', `Initial upload (${uploadedFile.name})`);
        if (isHtml) {
          formData.append('isSingleHtml', 'true');
        }

        deployRes = await authFetch(`/api/projects/${project.id}/deploy`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Git repository deployment
        deployRes = await authFetch(`/api/projects/${project.id}/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gitUrl: gitUrl.trim(),
          }),
        });
      }

      const deployData = await safeJson(deployRes);
      if (!deployRes.ok) {
        throw new Error(deployData?.error || 'Deployment failed');
      }

      const deployment = deployData.deployment;
      if (deployment.status === 'ERROR') {
        throw new Error(deployment.errorMessage || 'Deployment encountered an error');
      }

      // 3. Binding Edge Subdomain & SSL Certificate
      setDeployStepIndex(3);
      setDeploymentStatusText(`Binding Edge Subdomain (*.${selectedDomain}) & SSL Certificate`);
      await new Promise(r => setTimeout(r, 3000));

      // 4. Finalizing Live Edge Routing
      setDeployStepIndex(4);
      setDeploymentStatusText('Finalizing Live Edge Routing');
      await new Promise(r => setTimeout(r, 2000));
      
      const productionUrl = deployment.productionUrl || `https://${projectSlug}.${selectedDomain}`;
      setFinalUrl(productionUrl);
      setIsSuccessfullyDeployed(true);

      // 5. Validating SSL certificate issuance (Countdown)
      setDeployStepIndex(5);
      const extendedMessages = [
        'Synchronizing Infrastructure State',
        'Analyzing Build Manifest & Dependencies',
        'Initializing Serverless Runtime Environment',
        'Provisioning Global Anycast IP Routing',
        'Propagating DNS across CDN POPs',
        'Validating SSL certificate issuance',
      ];

      for (let i = 20; i > 0; i--) {
        setDeploymentCountdown(i);
        
        if (i > 17) setDeploymentStatusText(extendedMessages[0]);
        else if (i > 14) setDeploymentStatusText(extendedMessages[1]);
        else if (i > 11) setDeploymentStatusText(extendedMessages[2]);
        else if (i > 8) setDeploymentStatusText(extendedMessages[3]);
        else if (i > 4) setDeploymentStatusText(extendedMessages[4]);
        else setDeploymentStatusText(extendedMessages[5]);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      
      setDeploymentCountdown(0);
      setDeploymentStatusText('Deployment verified! Opening dashboard...');
      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Deployment error occurred');
      setDeployStepIndex(-1);
    } finally {
      setDeploying(false);
    }
  };

  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedSuccessUrl(true);
    setTimeout(() => setCopiedSuccessUrl(false), 2000);
  };

  const fullSubdomainPreview = `https://${projectSlug || 'my-project'}.${selectedDomain}`;

  return (
    <DashboardLayout breadcrumbs={[{ label: 'New Project' }]}>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-12">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">Create New Project</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Deploy your web application to production with automated domain provisioning and high-performance edge infrastructure.
          </p>
        </div>

        {/* Multi-step progress indicator: 1 — 2 — 3 — 4 */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 border-b border-neutral-200/80 pb-6 pt-2 text-xs font-semibold">
          {[
            { num: 1, name: 'Name & Domain' },
            { num: 2, name: 'Source Code' },
            { num: 3, name: 'Build & Environment' },
            { num: 4, name: 'Review & Deploy' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  if (step > s.num) setStep(s.num);
                }}
                disabled={step <= s.num}
                className={`flex items-center gap-2 transition ${
                  step > s.num ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                }`}
                title={s.name}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-mono font-bold transition shrink-0 ${
                    (step > s.num || (s.num === 4 && isSuccessfullyDeployed))
                      ? 'bg-emerald-600 text-white'
                      : step === s.num
                      ? 'bg-neutral-950 text-white shadow-sm ring-2 ring-neutral-950 ring-offset-2'
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-300'
                  }`}
                >
                  {(step > s.num || (s.num === 4 && isSuccessfullyDeployed)) ? '✓' : s.num}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-semibold ${
                    step === s.num
                      ? 'text-neutral-950 font-bold'
                      : step > s.num
                      ? 'text-neutral-700'
                      : 'text-neutral-400'
                  }`}
                >
                  {s.name}
                </span>
              </button>

              {idx < 3 && (
                <div
                  className={`h-2 sm:h-3.5 w-8 sm:w-24 md:w-36 lg:w-48 rounded-full transition-all duration-300 shrink-0 ${
                    step > s.num ? 'bg-neutral-950' : 'bg-neutral-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <div className="font-semibold">Deployment Notice</div>
              <p className="break-words">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* STEP 1: Project Name & Multi-Domain Selection */}
        {step === 1 && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
            {isLimitReached && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <div className="font-bold">Project Limit Reached ({userProjectCount}/3 Projects)</div>
                  <p>You have reached the maximum allowed 3 hosted projects. Please delete an existing project before deploying a new one.</p>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-base font-bold text-neutral-950">Step 1: Project Details & Domain</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Choose a project name and select which domain you would like your subdomain assigned under.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  disabled={isLimitReached}
                  value={projectName}
                  onChange={handleNameChange}
                  placeholder="My Next.js App"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950 transition disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Choose Subdomain & Root Domain
                </label>
                <div className="flex flex-col sm:flex-row items-stretch border border-neutral-300 rounded-lg overflow-hidden focus-within:border-neutral-950 transition bg-neutral-50">
                  <div className="flex items-center flex-1 px-3 py-2 sm:py-2.5">
                    <span className="text-xs font-mono text-neutral-400 mr-1 select-none">https://</span>
                    <input
                      type="text"
                      required
                      disabled={isLimitReached}
                      value={projectSlug}
                      onChange={(e) =>
                        setProjectSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      placeholder="my-project"
                      className="w-full text-xs font-mono font-bold text-neutral-900 bg-transparent focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center bg-neutral-100 border-t sm:border-t-0 sm:border-l border-neutral-200 px-3 py-2">
                    <span className="text-xs font-mono text-neutral-500 mr-1.5 font-bold">.</span>
                    <select
                      value={selectedDomain}
                      disabled={isLimitReached}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="bg-transparent text-xs font-mono font-bold text-neutral-900 focus:outline-none cursor-pointer disabled:opacity-50"
                    >
                      {availableDomains.map((dom) => (
                        <option key={dom} value={dom}>
                          {dom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {projectSlug.length >= 3 && isSubdomainReserved(projectSlug) && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded text-[10px] text-rose-600 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>The subdomain &quot;{projectSlug}&quot; is reserved for system use and cannot be used.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                disabled={isLimitReached || !projectName.trim() || !projectSlug.trim() || projectSlug.length < 3 || isSubdomainReserved(projectSlug)}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition active:scale-98 disabled:opacity-40"
              >
                <span>Continue to Source</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Source Code */}
        {step === 2 && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-neutral-950">Step 2: Source Code</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Select how you want to provide your project files.
              </p>
            </div>

            {/* Source Selection Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setSourceType('upload')}
                className={`p-3.5 sm:p-4 border rounded-xl text-left transition flex sm:flex-col justify-between items-start gap-2 ${
                  sourceType === 'upload'
                    ? 'border-neutral-950 bg-neutral-50 shadow-2xs'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-neutral-950">Upload File</div>
                  <div className="text-[11px] text-neutral-500">ZIP archive or .html file</div>
                </div>
                <UploadCloud className="w-4 h-4 text-neutral-900 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setSourceType('git')}
                className={`p-3.5 sm:p-4 border rounded-xl text-left transition flex sm:flex-col justify-between items-start gap-2 ${
                  sourceType === 'git'
                    ? 'border-neutral-950 bg-neutral-50 shadow-2xs'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-neutral-950">Git Repository</div>
                  <div className="text-[11px] text-neutral-500">GitHub / GitLab URL</div>
                </div>
                <Globe className="w-4 h-4 text-neutral-900 shrink-0" />
              </button>
            </div>

            {/* File upload dropzone */}
            {sourceType === 'upload' && (
              <div className="space-y-3 pt-2">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-neutral-950 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-neutral-50 hover:bg-white"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".zip,.html"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-500 mb-3">
                    {uploadedFile?.name.endsWith('.html') ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <UploadCloud className="w-6 h-6" />
                    )}
                  </div>
                  {uploadedFile ? (
                    <div>
                      <div className="text-xs font-bold text-emerald-700">✓ {uploadedFile.name}</div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        {(uploadedFile.size / (uploadedFile.name.endsWith('.zip') ? 1024 * 1024 : 1024)).toFixed(2)} {uploadedFile.name.endsWith('.zip') ? 'MB' : 'KB'} · Click or drag another file to replace
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        Drag and drop your project ZIP or HTML file here
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1">
                        Up to 50MB uncompressed · Contains package.json or index.html
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Git url input */}
            {sourceType === 'git' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  Git Repository URL
                </label>
                <input
                  type="url"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-950 transition"
                />
                <p className="text-[11px] text-neutral-500">
                  Public repositories are deployed without requiring tokens.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={sourceType === 'upload' && !uploadedFile}
                onClick={async () => {
                  if (sourceType === 'git' && gitUrl.includes('github.com')) {
                    setDetectingEnv(true);
                    const fw = await detectFrameworkFromGithub(gitUrl, frameworksList);
                    if (fw) {
                      setFramework(fw);
                      
                      // Check vercel frameworks first for settings
                      const vFw = frameworksList.find(f => f.slug === fw);
                      if (vFw) {
                        setBuildCommand(vFw.settings.buildCommand.value || '');
                        setOutputDirectory(vFw.settings.outputDirectory.value || '');
                        setInstallCommand(vFw.settings.installCommand.value || '');
                      } else {
                        const preset = PLATFORM_PRESETS[fw];
                        if (preset) {
                          setBuildCommand(preset.defaultBuild);
                          setOutputDirectory(preset.defaultOutput);
                          setInstallCommand(preset.defaultInstall);
                        }
                      }
                      toast.info(`Auto-detected ${fw.toUpperCase()} framework from GitHub repository.`);
                    }
                    setDetectingEnv(false);
                  }
                  setStep(3);
                  handleAutoDetectEnv();
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition active:scale-98 disabled:opacity-40"
              >
                <span>{detectingEnv ? 'Detecting Framework...' : 'Continue to Build & Env'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Build Settings & Environment Variables */}
        {step === 3 && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 space-y-8 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-neutral-950">Step 3: Framework & Build Settings</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Configure your framework build settings and environment variables synchronized to Cloud Engine.
              </p>
            </div>

            {/* Build Settings Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Framework Preset
                  </label>
                  <div className="flex items-center gap-2 px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-lg focus-within:border-neutral-950 transition">
                    <div className="p-1 bg-white border border-neutral-200 rounded shrink-0 shadow-2xs">
                      <FrameworkIcon frameworkKey={framework} className="w-5 h-5" />
                    </div>
                    <select
                      value={framework}
                      onChange={(e) => {
                        const newFw = e.target.value;
                        setFramework(newFw);
                        
                        // Check platform frameworks first
                        const vFw = frameworksList.find(f => f.slug === newFw);
                        if (vFw) {
                          setBuildCommand(vFw.settings.buildCommand.value || '');
                          setOutputDirectory(vFw.settings.outputDirectory.value || '');
                          setInstallCommand(vFw.settings.installCommand.value || '');
                          return;
                        }
                        
                        const preset = PLATFORM_PRESETS[newFw];
                        if (preset) {
                          setBuildCommand(preset.defaultBuild);
                          setOutputDirectory(preset.defaultOutput);
                          setInstallCommand(preset.defaultInstall);
                        }
                      }}
                      className="w-full py-1.5 bg-transparent text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
                    >
                        <optgroup label="Core Frameworks">
                          {Object.entries(PLATFORM_PRESETS).map(([key, info]) => (
                            <option key={key} value={key}>
                              {info.name}
                            </option>
                          ))}
                        </optgroup>
                        {frameworksList.length > 0 && (
                          <optgroup label="Extended Platform Presets">
                            {frameworksList.map((f) => (
                              <option key={f.slug} value={f.slug || 'other'}>
                                {f.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Output Directory
                  </label>
                  <input
                    type="text"
                    value={outputDirectory}
                    onChange={(e) => setOutputDirectory(e.target.value)}
                    placeholder=".next, dist, build, or ./"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Build Command
                  </label>
                  <input
                    type="text"
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                    placeholder="next build, vite build, etc."
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Install Command
                  </label>
                  <input
                    type="text"
                    value={installCommand}
                    onChange={(e) => setInstallCommand(e.target.value)}
                    placeholder="npm install"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                  />
                </div>
              </div>
            </div>

            {/* ENVIRONMENT VARIABLES SECTION */}
            <div className="border-t border-neutral-200/80 pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-neutral-900" />
                    <h3 className="text-sm font-bold text-neutral-950">Environment Variables</h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Encrypted variables injected into build and runtime environments.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste .env</span>
                  </button>
                </div>
              </div>

              {/* Add Variable Input Box */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Key</label>
                    <input
                      type="text"
                      value={newEnvKey}
                      onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                      placeholder="NEXT_PUBLIC_API_URL"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Value</label>
                    <input
                      type="text"
                      value={newEnvValue}
                      onChange={(e) => setNewEnvValue(e.target.value)}
                      placeholder="https://api.example.com"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="text-[11px] font-semibold text-neutral-500 shrink-0">Target Environments:</span>
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                      {(['production', 'preview', 'development'] as const).map((t) => (
                        <label key={t} className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer capitalize whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={newEnvTargets.includes(t)}
                            onChange={() => toggleTarget(t)}
                            className="rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950"
                          />
                          <span>{t}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEnvVar}
                    disabled={!newEnvKey.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variable</span>
                  </button>
                </div>
              </div>

              {/* Active List of Variables */}
              {envVars.length > 0 && (
                <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100 text-xs">
                  {envVars.map((env) => (
                    <div key={env.id} className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white hover:bg-neutral-50/50 min-w-0">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-mono flex-wrap break-all">
                          <span className="font-bold text-neutral-950">{env.key}</span>
                          <span className="text-neutral-400">=</span>
                          <span className="text-neutral-700 break-all">
                            {env.visible ? env.value : '••••••••••••••••'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {env.target.map((t) => (
                            <span key={t} className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() =>
                            setEnvVars((prev) =>
                              prev.map((item) => (item.id === env.id ? { ...item, visible: !item.visible } : item))
                            )
                          }
                          className="p-1 text-neutral-400 hover:text-neutral-700 transition"
                          title={env.visible ? 'Hide Value' : 'Show Value'}
                        >
                          {env.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnvVar(env.key)}
                          className="p-1 text-neutral-400 hover:text-rose-600 transition"
                          title="Remove Variable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition active:scale-98"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Trigger Deployment */}
        {step === 4 && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-neutral-950">Step 4: Review & Deploy</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Verify your configuration before triggering the deployment engine.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
              <div>
                <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                  Project Name
                </span>
                <div className="font-bold text-neutral-950 mt-0.5">{projectName}</div>
              </div>
              <div>
                <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                  Target Subdomain URL
                </span>
                <div className="font-mono font-bold text-neutral-950 mt-0.5 break-all">
                  https://{projectSlug}.{selectedDomain}
                </div>
              </div>
              <div>
                <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                  Source Type
                </span>
                <div className="capitalize font-medium text-neutral-800 mt-0.5">
                  {sourceType === 'upload'
                    ? `File Upload (${uploadedFile?.name})`
                    : `Git (${gitUrl})`}
                </div>
              </div>
              <div>
                <span className="text-neutral-400 uppercase tracking-wider font-semibold text-[10px]">
                  Framework & Env Vars
                </span>
                <div className="font-medium text-neutral-800 mt-0.5 flex items-center gap-2">
                  <span className="uppercase font-mono font-bold">{framework}</span>
                  <span>·</span>
                  <span>{envVars.length} Environment Variable{envVars.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>

            {/* Animated Pipeline Stage Checklist Overlay */}
            {deploying && (
              <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="max-w-md w-full space-y-12">
                  <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <div className="absolute inset-0 border-[3px] border-neutral-100 rounded-full"></div>
                      <div className="absolute inset-0 border-[3px] border-neutral-950 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <h2 className="text-xl font-bold text-neutral-950 tracking-tight">Deployment Pipeline In Progress...</h2>
                    <div className="h-5">
                      <p className="text-xs text-neutral-500 font-medium animate-pulse">
                        {deploymentStatusText}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar Minimalist */}
                  <div className="space-y-3">
                    <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neutral-950 transition-all duration-700 ease-out"
                        style={{ width: `${(Math.max(1, deployStepIndex) / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400 tabular-nums">
                      <span>Pipeline Stage {Math.max(1, deployStepIndex)} / 5</span>
                      {deploymentCountdown > 0 && deployStepIndex === 5 && (
                        <span>Final Verification: {deploymentCountdown}s</span>
                      )}
                    </div>
                  </div>

                  {/* Minimalist Step Checklist */}
                  <div className="pt-4 grid grid-cols-1 gap-4">
                    {[
                      { id: 1, text: "Validating Project & Environment Configuration" },
                      { id: 2, text: "Transmitting Source Files to Cloud Engine" },
                      { id: 3, text: `Binding Edge Subdomain (*.${selectedDomain}) & SSL Certificate` },
                      { id: 4, text: "Finalizing Live Edge Routing" },
                      { id: 5, text: "Validating SSL certificate issuance" }
                    ].map((step, i) => {
                      const isDone = deployStepIndex > step.id;
                      const isActive = deployStepIndex === step.id;
                      
                      return (
                        <div key={step.id} className="flex items-center gap-4 transition-opacity duration-300">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-500 ${
                            isDone 
                              ? 'bg-neutral-950 border-neutral-950 text-white scale-100' 
                              : isActive 
                              ? 'border-neutral-900 bg-white ring-4 ring-neutral-50 scale-110' 
                              : 'border-neutral-200 bg-neutral-50 scale-90'
                          }`}>
                            {isDone ? (
                              <Check className="w-3 h-3" />
                            ) : isActive ? (
                              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full animate-pulse"></div>
                            ) : null}
                          </div>
                          <span className={`text-xs font-medium transition-colors duration-300 ${
                            isDone ? 'text-neutral-400' : isActive ? 'text-neutral-900 font-bold' : 'text-neutral-300'
                          }`}>
                            {step.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-8 text-center">
                    <p className="text-[10px] text-neutral-400 font-medium">
                      Powered by Cmnty Edge · Do not close this window
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 flex justify-between">
              {!isSuccessfullyDeployed && (
                <button
                  type="button"
                  disabled={deploying}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {!finalUrl ? (
                <button
                  type="button"
                  disabled={deploying || isLimitReached}
                  onClick={startDeployment}
                  className="inline-flex items-center px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  <span>{deploying ? 'Deploying...' : 'Deploy Project'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (createdProjectId) {
                      router.push(`/dashboard/projects/${createdProjectId}`);
                    } else {
                      router.push('/dashboard');
                    }
                  }}
                  className="inline-flex items-center px-6 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition active:scale-95 shadow-sm"
                >
                  <span>Go to Project Management</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BULK IMPORT .ENV MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-bold text-sm text-neutral-950">Bulk Import Environment Variables</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-neutral-400 hover:text-neutral-900 text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Paste the raw contents of your <code className="text-neutral-900">.env</code> file below. Each line formatted as <code className="text-neutral-900">KEY=VALUE</code> will be parsed.
            </p>
            <textarea
              rows={8}
              value={bulkEnvText}
              onChange={(e) => setBulkEnvText(e.target.value)}
              placeholder={`NEXT_PUBLIC_API_URL=https://api.example.com\nDATABASE_URL=postgres://...\nJWT_SECRET=super-secret-string`}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono focus:outline-none focus:border-neutral-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImportEnv}
                disabled={!bulkEnvText.trim()}
                className="px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 disabled:opacity-40"
              >
                Import Variables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMPLIFIED SUCCESS CELEBRATION POPUP MODAL */}
      {showSuccessModal && finalUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                  🎉
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-neutral-950">Deployment Successful!</h3>
                  <p className="text-[11px] text-neutral-500">
                    Your site is live on. Wait 1-5 minutes for the project and domain to be active.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-sm font-semibold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Screenshot Thumbnail & URL Display */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Thumbnail Container using requested ssweb API */}
              <div className="rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-950 shadow-sm relative min-h-[220px] flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={iframeKey}
                  src={`https://image.thum.io/get/${finalUrl}`}
                  alt={`Screenshot of ${finalUrl}`}
                  className="w-full h-auto max-h-[360px] object-cover object-top"
                  loading="eager"
                />
              </div>

              {/* URL & Action Controls */}
              <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-0.5">
                      Live Project URL
                    </div>
                    <a
                      href={finalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs sm:text-sm font-bold text-neutral-900 hover:underline truncate block"
                    >
                      {finalUrl}
                    </a>
                  </div>

                  {/* Buttons Copy URL and Visit Site removed as requested */}
                </div>

                <div className="pt-2 border-t border-neutral-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessModal(false);
                      if (createdProjectId) {
                        router.push(`/dashboard/projects/${createdProjectId}`);
                      } else {
                        router.push('/dashboard');
                      }
                    }}
                    className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition text-center shadow-xs"
                  >
                    Go to Project Management
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
