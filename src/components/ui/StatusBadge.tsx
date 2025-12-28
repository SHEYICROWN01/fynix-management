import { cn } from "@/lib/utils";

type StatusType = "active" | "suspended" | "trial" | "pending" | "paid" | "failed" | "overdue";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "status-active",
  },
  suspended: {
    label: "Suspended",
    className: "status-suspended",
  },
  trial: {
    label: "Trial",
    className: "status-trial",
  },
  pending: {
    label: "Pending",
    className: "status-pending",
  },
  paid: {
    label: "Paid",
    className: "status-active",
  },
  failed: {
    label: "Failed",
    className: "status-suspended",
  },
  overdue: {
    label: "Overdue",
    className: "status-trial",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("status-badge", config.className, className)}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
