'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, Terminal, Copy, Check } from 'lucide-react';

interface EnvVarItem {
  id: string;
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  visible?: boolean;
}

interface EnvVarEditorProps {
  envVars: EnvVarItem[];
  setEnvVars: React.Dispatch<React.SetStateAction<EnvVarItem[]>>;
  onBulkImport: () => void;
}

export default function EnvVarEditor({ envVars, setEnvVars, onBulkImport }: EnvVarEditorProps) {
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [newEnvTargets, setNewEnvTargets] = useState<('production' | 'preview' | 'development')[]>([
    'production',
    'preview',
    'development',
  ]);

  const addEnvVar = () => {
    if (!newEnvKey.trim()) return;
    const id = `env_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setEnvVars([
      ...envVars,
      {
        id,
        key: newEnvKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
        value: newEnvValue.trim(),
        target: newEnvTargets,
        visible: false,
      },
    ]);
    setNewEnvKey('');
    setNewEnvValue('');
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(envVars.filter((v) => v.id !== id));
  };

  const toggleEnvVisibility = (id: string) => {
    setEnvVars(
      envVars.map((v) => (v.id === id ? { ...v, visible: !v.visible } : v))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-neutral-950 flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          Environment Variables
        </h3>
        <button
          type="button"
          onClick={onBulkImport}
          className="text-[11px] font-bold text-neutral-500 hover:text-neutral-950 flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition"
        >
          <Copy className="w-3 h-3" />
          Bulk Import (.env)
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-4">
          <input
            type="text"
            placeholder="VARIABLE_NAME"
            value={newEnvKey}
            onChange={(e) => setNewEnvKey(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950 transition"
          />
        </div>
        <div className="sm:col-span-6">
          <input
            type="text"
            placeholder="variable_value"
            value={newEnvValue}
            onChange={(e) => setNewEnvValue(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:border-neutral-950 transition"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={addEnvVar}
            disabled={!newEnvKey.trim()}
            className="w-full h-full flex items-center justify-center gap-1.5 py-2 sm:py-0 bg-neutral-950 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {envVars.length > 0 && (
        <div className="border border-neutral-200 rounded-xl overflow-hidden bg-neutral-50/30">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-neutral-100 text-neutral-500 font-bold border-b border-neutral-200">
              <tr>
                <th className="px-4 py-2.5">Key</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Targets</th>
                <th className="px-4 py-2.5 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {envVars.map((v) => (
                <tr key={v.id} className="hover:bg-neutral-100/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-neutral-950 truncate max-w-[120px]">
                    {v.key}
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600 truncate max-w-[150px]">
                    <div className="flex items-center gap-2">
                      <span className="truncate flex-1">
                        {v.visible ? v.value : '••••••••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleEnvVisibility(v.id)}
                        className="text-neutral-400 hover:text-neutral-950 transition"
                      >
                        {v.visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.target.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 bg-neutral-200 text-[9px] font-bold rounded text-neutral-600 uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeEnvVar(v.id)}
                      className="text-neutral-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
