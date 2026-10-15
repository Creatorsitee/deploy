export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  registeredIp?: string;
  registeredUserAgent?: string;
  registeredDeviceId?: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
  isSuspended?: boolean;
  failedLoginAttempts?: number;
  createdAt: string;
}

export type FrameworkType = 
  | 'static'
  | 'nextjs'
  | 'vite'
  | 'react'
  | 'vue'
  | 'nuxt'
  | 'astro'
  | 'svelte'
  | 'remix'
  | 'gatsby'
  | 'angular'
  | 'ember'
  | 'hugo'
  | 'jekyll'
  | 'eleventy'
  | 'docusaurus'
  | 'solid'
  | 'qwik'
  | 'redwood'
  | 'other';

export type ProjectStatus = 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE';

export interface Project {
  id: string;
  userId: string;
  name: string;
  slug: string;
  framework: FrameworkType;
  buildCommand: string;
  installCommand: string;
  outputDirectory: string;
  nodeVersion?: string;
  status: ProjectStatus;
  vercelProjectId?: string;
  currentDeploymentId?: string;
  subdomain: string; // e.g. project-slug.cmnty.biz.id
  customDomain?: string;
  selectedDomain?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeploymentStatus = 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';

export interface Deployment {
  id: string;
  projectId: string;
  userId: string;
  vercelDeploymentId?: string;
  status: DeploymentStatus;
  url: string; // Vercel deployment URL
  productionUrl: string; // Subdomain URL (https://{slug}.cmnty.biz.id)
  sourceType: 'zip' | 'template' | 'git';
  sourceName?: string;
  commitMessage?: string;
  durationMs?: number;
  errorMessage?: string;
  logs?: string[];
  createdAt: string;
  completedAt?: string;
}

export type SslStatus = 'ACTIVE' | 'PROVISIONING' | 'FAILED' | 'PENDING_DNS';

export interface DomainRecord {
  id: string;
  projectId: string;
  userId: string;
  domain: string;
  isSubdomain: boolean;
  verified: boolean;
  sslStatus: SslStatus;
  dnsRecords?: {
    type: 'CNAME' | 'A' | 'TXT';
    name: string;
    value: string;
    valid?: boolean;
  }[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariable {
  id: string;
  projectId: string;
  key: string;
  value: string; // masked in UI
  target: ('production' | 'preview' | 'development')[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SystemConfig {
  vercelToken: string;
  vercelTeamId: string;
  baseDomain: string;
  availableDomains: string[];
  allowPublicRegistration: boolean;
  maxProjectsPerUser: number;
  maxDeploymentsPerDay: number;
}
