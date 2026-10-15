import fs from 'fs';
import path from 'path';
import {
  User,
  Project,
  Deployment,
  DomainRecord,
  EnvironmentVariable,
  AuditLog,
  SystemConfig,
} from '@/lib/types';

interface DatabaseSchema {
  users: User[];
  projects: Project[];
  deployments: Deployment[];
  domains: DomainRecord[];
  environmentVariables: EnvironmentVariable[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'cmnty_db.json');

// Default initial system configuration
const defaultSystemConfig: SystemConfig = {
  vercelToken: process.env.VERCEL_TOKEN || '',
  vercelTeamId: process.env.VERCEL_TEAM_ID || '',
  baseDomain: process.env.BASE_DOMAIN || 'cmnty.biz.id',
  availableDomains: ['cmnty.biz.id'],
  allowPublicRegistration: true,
  maxProjectsPerUser: 3,
  maxDeploymentsPerDay: 50,
};

// Seed initial database state
function createInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();

  return {
    users: [],
    projects: [],
    deployments: [],
    domains: [],
    environmentVariables: [],
    auditLogs: [
      {
        id: 'log_init',
        userId: 'system',
        userEmail: 'system@cmnty.local',
        action: 'SYSTEM_BOOT',
        metadata: { version: '1.0.0', platform: 'CMNTY Deploy' },
        createdAt: now,
      },
    ],
    systemConfig: defaultSystemConfig,
  };
}

// Sync admin user configured via .env (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
function syncEnvAdmin(data: DatabaseSchema): void {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  const envName = process.env.ADMIN_NAME || 'System Admin';

  if (!envEmail || !envPassword) return;

  const existingIdx = data.users.findIndex((u) => u.email.toLowerCase() === envEmail);
  if (existingIdx !== -1) {
    if (data.users[existingIdx].role !== 'admin') {
      data.users[existingIdx].role = 'admin';
    }
  } else {
    data.users.push({
      id: 'usr_env_admin',
      email: envEmail,
      name: envName,
      passwordHash: 'pbkdf2_env_managed',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
  }
}

// In-memory cache + resilient atomic file persistence
let cachedDb: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDb(): DatabaseSchema {
  if (cachedDb) {
    syncEnvAdmin(cachedDb);
    return cachedDb;
  }

  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      cachedDb = JSON.parse(content);
      if (!cachedDb?.systemConfig) {
        cachedDb!.systemConfig = defaultSystemConfig;
      }
      syncEnvAdmin(cachedDb!);
      return cachedDb!;
    } catch {
      cachedDb = createInitialDatabase();
      syncEnvAdmin(cachedDb);
      saveDb(cachedDb);
      return cachedDb;
    }
  }

  cachedDb = createInitialDatabase();
  syncEnvAdmin(cachedDb);
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(data: DatabaseSchema): void {
  cachedDb = data;
  ensureDataDir();
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write db file atomically', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (writeErr) {
      console.error('Fallback write error', writeErr);
    }
  }
}

// Relational Operations
export const db = {
  // Users
  getUserByEmail(email: string): User | undefined {
    const data = getDb();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  getUserById(id: string): User | undefined {
    const data = getDb();
    return data.users.find((u) => u.id === id);
  },

  getAllUsers(): User[] {
    return getDb().users;
  },

  getUserByIp(ip: string): User | undefined {
    const data = getDb();
    if (!ip || ip === 'unknown') return undefined;
    return data.users.find((u) => u.registeredIp && u.registeredIp.trim() === ip.trim());
  },

  getUserByUserAgent(ua: string): User | undefined {
    const data = getDb();
    if (!ua || ua === 'unknown') return undefined;
    return data.users.find((u) => u.registeredUserAgent && u.registeredUserAgent.trim() === ua.trim());
  },

  getUserByDeviceId(deviceId: string): User | undefined {
    const data = getDb();
    if (!deviceId) return undefined;
    return data.users.find((u) => u.registeredDeviceId && u.registeredDeviceId === deviceId);
  },

  createUser(user: User): User {
    const data = getDb();
    data.users.push(user);
    saveDb(data);
    return user;
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const data = getDb();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    saveDb(data);
    return data.users[idx];
  },

  // Projects
  getProjectsByUserId(userId: string): Project[] {
    const data = getDb();
    return data.projects.filter((p) => p.userId === userId);
  },

  getAllProjects(): Project[] {
    return getDb().projects;
  },

  getProjectById(id: string): Project | undefined {
    const data = getDb();
    const cleanId = (id || '').toLowerCase().trim();
    return data.projects.find(
      (p) =>
        p.id === id ||
        p.slug?.toLowerCase() === cleanId ||
        p.vercelProjectId === id ||
        p.subdomain?.toLowerCase() === cleanId
    );
  },

  getProjectBySlug(slug: string): Project | undefined {
    const data = getDb();
    const cleanSlug = (slug || '').toLowerCase().trim();
    return data.projects.find((p) => p.slug.toLowerCase() === cleanSlug);
  },

  createProject(project: Project): Project {
    const data = getDb();
    data.projects.unshift(project);
    saveDb(data);
    return project;
  },

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const data = getDb();
    const cleanId = (id || '').toLowerCase().trim();
    const idx = data.projects.findIndex(
      (p) =>
        p.id === id ||
        p.slug?.toLowerCase() === cleanId ||
        p.vercelProjectId === id ||
        p.subdomain?.toLowerCase() === cleanId
    );
    if (idx === -1) return null;
    data.projects[idx] = { ...data.projects[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDb(data);
    return data.projects[idx];
  },

  deleteProject(id: string): boolean {
    const data = getDb();
    const cleanId = (id || '').toLowerCase().trim();
    const target = data.projects.find(
      (p) =>
        p.id === id ||
        p.slug?.toLowerCase() === cleanId ||
        p.vercelProjectId === id ||
        p.subdomain?.toLowerCase() === cleanId
    );
    if (!target) return false;
    const targetId = target.id;

    // Update Local Cache
    data.projects = data.projects.filter(
      (p) =>
        p.id !== targetId &&
        p.id !== id &&
        p.slug?.toLowerCase() !== cleanId &&
        p.vercelProjectId !== id
    );

    // Cascade delete locally
    data.deployments = data.deployments.filter((d) => d.projectId !== targetId && d.projectId !== id);
    data.domains = data.domains.filter((d) => d.projectId !== targetId && d.projectId !== id);
    data.environmentVariables = data.environmentVariables.filter((e) => e.projectId !== targetId && e.projectId !== id);
    saveDb(data);
    return true;
  },

  // Deployments
  getDeploymentsByProjectId(projectId: string): Deployment[] {
    return getDb()
      .deployments.filter((d) => d.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAllDeployments(): Deployment[] {
    return getDb().deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getDeploymentById(id: string): Deployment | undefined {
    return getDb().deployments.find((d) => d.id === id);
  },

  createDeployment(deployment: Deployment): Deployment {
    const data = getDb();
    data.deployments.unshift(deployment);
    // Update project current deployment
    const pIdx = data.projects.findIndex((p) => p.id === deployment.projectId);
    if (pIdx !== -1) {
      data.projects[pIdx].currentDeploymentId = deployment.id;
      data.projects[pIdx].updatedAt = new Date().toISOString();
    }
    saveDb(data);
    return deployment;
  },

  updateDeployment(id: string, updates: Partial<Deployment>): Deployment | null {
    const data = getDb();
    const idx = data.deployments.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    data.deployments[idx] = { ...data.deployments[idx], ...updates };
    saveDb(data);
    return data.deployments[idx];
  },

  appendDeploymentLog(id: string, logLine: string): void {
    const data = getDb();
    const idx = data.deployments.findIndex((d) => d.id === id);
    if (idx !== -1) {
      if (!data.deployments[idx].logs) data.deployments[idx].logs = [];
      data.deployments[idx].logs.push(logLine);
      saveDb(data);
    }
  },

  // Domains
  getDomainsByProjectId(projectId: string): DomainRecord[] {
    return getDb().domains.filter((d) => d.projectId === projectId);
  },

  getDomainsByUserId(userId: string): DomainRecord[] {
    return getDb().domains.filter((d) => d.userId === userId);
  },

  getAllDomains(): DomainRecord[] {
    return getDb().domains;
  },

  getDomainByName(domain: string): DomainRecord | undefined {
    return getDb().domains.find((d) => d.domain.toLowerCase() === domain.toLowerCase());
  },

  createDomain(domainRecord: DomainRecord): DomainRecord {
    const data = getDb();
    data.domains.push(domainRecord);
    saveDb(data);
    return domainRecord;
  },

  updateDomain(id: string, updates: Partial<DomainRecord>): DomainRecord | null {
    const data = getDb();
    const idx = data.domains.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    data.domains[idx] = { ...data.domains[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDb(data);
    return data.domains[idx];
  },

  deleteDomain(id: string): boolean {
    const data = getDb();
    const initLen = data.domains.length;
    data.domains = data.domains.filter((d) => d.id !== id);
    saveDb(data);
    return data.domains.length < initLen;
  },

  // Environment Variables
  getEnvVarsByProjectId(projectId: string): EnvironmentVariable[] {
    return getDb().environmentVariables.filter((e) => e.projectId === projectId);
  },

  setEnvVar(envVar: EnvironmentVariable): EnvironmentVariable {
    const data = getDb();
    const existingIdx = data.environmentVariables.findIndex(
      (e) => e.projectId === envVar.projectId && e.key === envVar.key
    );
    if (existingIdx !== -1) {
      data.environmentVariables[existingIdx] = envVar;
    } else {
      data.environmentVariables.push(envVar);
    }
    saveDb(data);
    return envVar;
  },

  deleteEnvVar(projectId: string, key: string): boolean {
    const data = getDb();
    const initLen = data.environmentVariables.length;
    data.environmentVariables = data.environmentVariables.filter(
      (e) => !(e.projectId === projectId && e.key === key)
    );
    saveDb(data);
    return data.environmentVariables.length < initLen;
  },

  // Audit Logs
  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const data = getDb();
    const newLog: AuditLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    data.auditLogs.unshift(newLog);
    if (data.auditLogs.length > 500) {
      data.auditLogs = data.auditLogs.slice(0, 500);
    }
    saveDb(data);
    return newLog;
  },

  getAuditLogs(limit = 50): AuditLog[] {
    return getDb().auditLogs.slice(0, limit);
  },

  // System Configuration
  getSystemConfig(): SystemConfig {
    const data = getDb();
    const activeBaseDomain = process.env.BASE_DOMAIN || data.systemConfig.baseDomain || 'cmnty.biz.id';
    const domains = Array.isArray(data.systemConfig.availableDomains) && data.systemConfig.availableDomains.length > 0
      ? data.systemConfig.availableDomains
      : [activeBaseDomain];

    if (!domains.includes(activeBaseDomain)) {
      domains.unshift(activeBaseDomain);
    }

    return {
      vercelToken: process.env.VERCEL_TOKEN || data.systemConfig.vercelToken || '',
      vercelTeamId: process.env.VERCEL_TEAM_ID || data.systemConfig.vercelTeamId || '',
      baseDomain: activeBaseDomain,
      availableDomains: domains,
      allowPublicRegistration: data.systemConfig.allowPublicRegistration ?? true,
      maxProjectsPerUser: data.systemConfig.maxProjectsPerUser ?? 3,
      maxDeploymentsPerDay: data.systemConfig.maxDeploymentsPerDay ?? 50,
    };
  },

  updateSystemConfig(updates: Partial<SystemConfig>): SystemConfig {
    const data = getDb();
    data.systemConfig = { ...data.systemConfig, ...updates };
    saveDb(data);
    return data.systemConfig;
  },

  async resetDatabaseAndSync(preservedUsers: User[], resetLog: AuditLog) {
    const data = getDb();
    data.projects = [];
    data.deployments = [];
    data.domains = [];
    data.environmentVariables = [];
    data.users = preservedUsers;
    data.auditLogs = [resetLog];
    saveDb(data);
  },

  clearDatabase(): void {
    cachedDb = createInitialDatabase();
    saveDb(cachedDb);
  }
};
