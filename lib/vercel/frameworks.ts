export interface FrameworkMeta {
  name: string;
  vercelId: string | null;
  defaultBuild: string;
  defaultOutput: string;
  defaultInstall: string;
  tag: string;
  color: string;
  badgeBg: string;
}

export interface PlatformFramework {
  name: string;
  slug: string | null;
  demo: string;
  logo: string;
  tagline: string;
  description: string;
  website: string;
  envVars?: string[];
  useRuntime?: string;
  ignore?: string[];
  detectors?: {
    every?: Array<{
      path: string;
      matchContent?: string;
      exists?: boolean;
    }>;
    some?: Array<{
      path: string;
      matchContent?: string;
      exists?: boolean;
    }>;
  };
  settings: {
    installCommand: {
      placeholder: string;
      value: string | null;
    };
    buildCommand: {
      placeholder: string;
      value: string | null;
    };
    devCommand: {
      placeholder: string;
      value: string | null;
    };
    outputDirectory: {
      placeholder: string;
      value: string | null;
    };
  };
}

export const PLATFORM_PRESETS: Record<string, FrameworkMeta> = {
  nextjs: {
    name: 'Next.js',
    vercelId: 'nextjs',
    defaultBuild: 'next build',
    defaultOutput: '.next',
    defaultInstall: 'npm install',
    tag: 'Next.js',
    color: 'text-black font-extrabold',
    badgeBg: 'bg-black text-white',
  },
  vite: {
    name: 'Vite',
    vercelId: 'vite',
    defaultBuild: 'vite build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'Vite',
    color: 'text-purple-600 font-bold',
    badgeBg: 'bg-purple-100 text-purple-900 border border-purple-200',
  },
  react: {
    name: 'Create React App',
    vercelId: 'create-react-app',
    defaultBuild: 'react-scripts build',
    defaultOutput: 'build',
    defaultInstall: 'npm install',
    tag: 'React',
    color: 'text-cyan-600 font-bold',
    badgeBg: 'bg-cyan-100 text-cyan-900 border border-cyan-200',
  },
  vue: {
    name: 'Vue.js',
    vercelId: 'vue',
    defaultBuild: 'vue-cli-service build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'Vue.js',
    color: 'text-emerald-600 font-bold',
    badgeBg: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
  },
  nuxt: {
    name: 'Nuxt.js',
    vercelId: 'nuxtjs',
    defaultBuild: 'nuxt build',
    defaultOutput: '.output',
    defaultInstall: 'npm install',
    tag: 'Nuxt.js',
    color: 'text-emerald-500 font-bold',
    badgeBg: 'bg-emerald-900 text-white',
  },
  astro: {
    name: 'Astro',
    vercelId: 'astro',
    defaultBuild: 'astro build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'Astro',
    color: 'text-orange-600 font-bold',
    badgeBg: 'bg-orange-100 text-orange-900 border border-orange-200',
  },
  svelte: {
    name: 'SvelteKit',
    vercelId: 'sveltekit',
    defaultBuild: 'vite build',
    defaultOutput: '.svelte-kit',
    defaultInstall: 'npm install',
    tag: 'SvelteKit',
    color: 'text-orange-700 font-bold',
    badgeBg: 'bg-orange-500 text-white',
  },
  remix: {
    name: 'Remix',
    vercelId: 'remix',
    defaultBuild: 'remix build',
    defaultOutput: 'build',
    defaultInstall: 'npm install',
    tag: 'Remix',
    color: 'text-blue-600 font-bold',
    badgeBg: 'bg-blue-100 text-blue-900 border border-blue-200',
  },
  gatsby: {
    name: 'Gatsby',
    vercelId: 'gatsby',
    defaultBuild: 'gatsby build',
    defaultOutput: 'public',
    defaultInstall: 'npm install',
    tag: 'Gatsby',
    color: 'text-purple-700 font-bold',
    badgeBg: 'bg-purple-800 text-white',
  },
  angular: {
    name: 'Angular',
    vercelId: 'angular',
    defaultBuild: 'ng build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'Angular',
    color: 'text-red-600 font-bold',
    badgeBg: 'bg-red-100 text-red-900 border border-red-200',
  },
  ember: {
    name: 'Ember.js',
    vercelId: 'ember',
    defaultBuild: 'ember build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'Ember.js',
    color: 'text-amber-700 font-bold',
    badgeBg: 'bg-amber-100 text-amber-900 border border-amber-200',
  },
  hugo: {
    name: 'Hugo',
    vercelId: 'hugo',
    defaultBuild: 'hugo',
    defaultOutput: 'public',
    defaultInstall: 'echo "No install step needed"',
    tag: 'Hugo',
    color: 'text-pink-600 font-bold',
    badgeBg: 'bg-pink-100 text-pink-900 border border-pink-200',
  },
  jekyll: {
    name: 'Jekyll',
    vercelId: 'jekyll',
    defaultBuild: 'jekyll build',
    defaultOutput: '_site',
    defaultInstall: 'bundle install',
    tag: 'Jekyll',
    color: 'text-red-700 font-bold',
    badgeBg: 'bg-red-200 text-red-950',
  },
  eleventy: {
    name: '11ty (Eleventy)',
    vercelId: 'eleventy',
    defaultBuild: 'npx @11ty/eleventy',
    defaultOutput: '_site',
    defaultInstall: 'npm install',
    tag: '11ty',
    color: 'text-neutral-800 font-bold',
    badgeBg: 'bg-neutral-200 text-neutral-900',
  },
  docusaurus: {
    name: 'Docusaurus',
    vercelId: 'docusaurus-2',
    defaultBuild: 'docusaurus build',
    defaultOutput: 'build',
    defaultInstall: 'npm install',
    tag: 'Docusaurus',
    color: 'text-emerald-700 font-bold',
    badgeBg: 'bg-emerald-800 text-white',
  },
  solid: {
    name: 'SolidStart',
    vercelId: 'solidstart',
    defaultBuild: 'solid-start build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'SolidStart',
    color: 'text-blue-700 font-bold',
    badgeBg: 'bg-blue-600 text-white',
  },
  qwik: {
    name: 'QwikCity',
    vercelId: 'qwik',
    defaultBuild: 'qwik build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'QwikCity',
    color: 'text-sky-600 font-bold',
    badgeBg: 'bg-sky-100 text-sky-900 border border-sky-200',
  },
  redwood: {
    name: 'RedwoodJS',
    vercelId: 'redwoodjs',
    defaultBuild: 'yarn rw build',
    defaultOutput: 'web/dist',
    defaultInstall: 'yarn install',
    tag: 'RedwoodJS',
    color: 'text-rose-700 font-bold',
    badgeBg: 'bg-rose-100 text-rose-900 border border-rose-200',
  },
  static: {
    name: 'Static HTML / Plain JS',
    vercelId: null,
    defaultBuild: '',
    defaultOutput: './',
    defaultInstall: '',
    tag: 'Static HTML',
    color: 'text-neutral-600 font-medium',
    badgeBg: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
  },
  other: {
    name: 'Custom Framework',
    vercelId: null,
    defaultBuild: 'npm run build',
    defaultOutput: 'dist',
    defaultInstall: 'npm install',
    tag: 'Custom',
    color: 'text-neutral-700 font-medium',
    badgeBg: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
  },
};

export function getPlatformFrameworkId(frameworkKey?: string | null): string | null {
  if (!frameworkKey) return null;
  const match = PLATFORM_PRESETS[frameworkKey];
  if (match) return match.vercelId;
  if (frameworkKey === 'static' || frameworkKey === 'other') return null;
  return frameworkKey;
}

/**
 * Detects framework from a list of files using official platform detector rules
 */
export function detectFrameworkFromPlatformRules(
  frameworks: PlatformFramework[],
  files: Array<{ path: string; content?: string }>
): string | null {
  const filePaths = new Set(files.map((f) => f.path.replace(/\\/g, '/')));

  for (const fw of frameworks) {
    if (!fw.detectors) continue;

    const { every, some } = fw.detectors;

    if (every && every.length > 0) {
      const allMatch = every.every((d) => {
        const normalizedPath = d.path.replace(/\\/g, '/');
        const exists = filePaths.has(normalizedPath);
        if (d.exists === false) return !exists;
        if (!exists) return false;
        if (d.matchContent) {
          const file = files.find((f) => f.path.replace(/\\/g, '/') === normalizedPath);
          if (!file || !file.content) return false;
          return new RegExp(d.matchContent).test(file.content);
        }
        return true;
      });
      if (allMatch) return fw.slug;
    }

    if (some && some.length > 0) {
      const anyMatch = some.some((d) => {
        const normalizedPath = d.path.replace(/\\/g, '/');
        const exists = filePaths.has(normalizedPath);
        if (d.exists === false) return !exists;
        if (!exists) return false;
        if (d.matchContent) {
          const file = files.find((f) => f.path.replace(/\\/g, '/') === normalizedPath);
          if (!file || !file.content) return false;
          return new RegExp(d.matchContent).test(file.content);
        }
        return true;
      });
      if (anyMatch) return fw.slug;
    }
  }

  return null;
}

/**
 * Auto-detects framework based on package.json object or dependencies
 */
export function detectFramework(packageJsonObj?: any): string {
  if (!packageJsonObj) return 'static';

  const deps = {
    ...(packageJsonObj.dependencies || {}),
    ...(packageJsonObj.devDependencies || {}),
  };

  if (deps['next']) return 'nextjs';
  if (deps['nuxt'] || deps['nuxt3']) return 'nuxt';
  if (deps['@astrojs/telemetry'] || deps['astro']) return 'astro';
  if (deps['@sveltejs/kit'] || deps['svelte']) return 'svelte';
  if (deps['@remix-run/react']) return 'remix';
  if (deps['gatsby']) return 'gatsby';
  if (deps['@angular/core']) return 'angular';
  if (deps['ember-source']) return 'ember';
  if (deps['@docusaurus/core']) return 'docusaurus';
  if (deps['solid-start'] || deps['solid-js']) return 'solid';
  if (deps['@builder.io/qwik']) return 'qwik';
  if (deps['@redwoodjs/core']) return 'redwood';
  if (deps['vue']) return 'vue';
  if (deps['react-scripts']) return 'react';
  if (deps['vite']) return 'vite';

  if (packageJsonObj.scripts && packageJsonObj.scripts.build) {
    const buildCmd = String(packageJsonObj.scripts.build).toLowerCase();
    if (buildCmd.includes('next')) return 'nextjs';
    if (buildCmd.includes('vite')) return 'vite';
    if (buildCmd.includes('astro')) return 'astro';
    if (buildCmd.includes('nuxt')) return 'nuxt';
    return 'other';
  }

  return 'static';
}
