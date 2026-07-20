import { Badge } from '@/shared/components/ui/badge';
import type { FosterStatus } from '@/features/foster/types';

const STATUS_CONFIG: Record<FosterStatus, { label: string; className: string }> = {
  PENDING: {
    label: '신청 대기',
    className: 'border-transparent bg-secondary text-ring',
  },
  REJECTED: {
    label: '신청 거절',
    className: 'border-transparent bg-destructive text-white',
  },
  FOSTERING: {
    label: '임시보호 중',
    className: 'border-transparent bg-primary text-primary-foreground',
  },
  EXTENDED: {
    label: '임시보호 연장',
    className: 'border-transparent bg-accent text-accent-foreground',
  },
  ENDED: {
    label: '임시보호 종료',
    className: 'border-transparent bg-muted text-muted-foreground',
  },
};

export function FosterStatusBadge({ status }: { status: FosterStatus }) {
  const { label, className } = STATUS_CONFIG[status];

  return <Badge className={className}>{label}</Badge>;
}