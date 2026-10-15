import { SslStatus } from '@/lib/types';
import { Lock, ShieldAlert, Clock } from 'lucide-react';

export default function SslStatusBadge({ status }: { status: SslStatus }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          HTTPS Active
        </span>
      );
    case 'PROVISIONING':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          SSL Provisioning
        </span>
      );
    case 'PENDING_DNS':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-neutral-500" />
          Pending DNS
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          SSL Failed
        </span>
      );
    default:
      return <span className="text-xs text-neutral-500">{status}</span>;
  }
}
