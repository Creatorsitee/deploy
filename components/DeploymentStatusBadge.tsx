import { DeploymentStatus } from '@/lib/types';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

export default function DeploymentStatusBadge({ status }: { status: DeploymentStatus }) {
  switch (status) {
    case 'READY':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Ready
        </span>
      );
    case 'BUILDING':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          Building...
        </span>
      );
    case 'QUEUED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600">
          <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
          Queued
        </span>
      );
    case 'ERROR':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Failed
        </span>
      );
    case 'CANCELED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-neutral-300"></span>
          Canceled
        </span>
      );
    default:
      return <span className="text-xs text-neutral-500">{status}</span>;
  }
}
