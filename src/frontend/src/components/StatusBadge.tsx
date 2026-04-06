import { cn } from "@/lib/utils";

type StatusType =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Paid"
  | "Active"
  | "Inactive";

const statusStyles: Record<StatusType, string> = {
  Pending: "bg-amber-100 text-amber-800 border border-amber-200",
  Approved: "bg-green-100 text-green-800 border border-green-200",
  Rejected: "bg-red-100 text-red-800 border border-red-200",
  Paid: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Active: "bg-blue-100 text-blue-800 border border-blue-200",
  Inactive: "bg-gray-100 text-gray-600 border border-gray-200",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const style =
    statusStyles[status as StatusType] ??
    "bg-gray-100 text-gray-700 border border-gray-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        style,
        className,
      )}
    >
      {status}
    </span>
  );
}

export function CourseTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Basic: "bg-blue-100 text-blue-800 border border-blue-200",
    Standard: "bg-purple-100 text-purple-800 border border-purple-200",
    Premium: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  };
  const style = styles[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
        style,
      )}
    >
      {type}
    </span>
  );
}
