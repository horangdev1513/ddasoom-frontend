import { Badge } from '@/shared/components/ui/badge';
import type { FosterStatus } from '@/features/foster/types';

const STATUS_CONFIG: Record<FosterStatus, { label: string; className: string }> = {
  PENDING: {
    label: '신청 대기',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  REJECTED: {
    label: '신청 거절',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
  },
  FOSTERING: {
    label: '임시보호 중',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  EXTENDED: {
    label: '임시보호 연장',
    className: 'border-sky-200 bg-sky-50 text-sky-700',
  },
  ENDED: {
    label: '임시보호 종료',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
  },
};

export function FosterStatusBadge({ status }: { status: FosterStatus }) {
  const { label, className } = STATUS_CONFIG[status];

  return (
    <Badge className={`border font-medium ${className}`}>
      {label}
    </Badge>
  );
}