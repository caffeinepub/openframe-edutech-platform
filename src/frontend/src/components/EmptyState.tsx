import { AlertCircle, FileX } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon: Icon = FileX,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-3 bg-muted rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
      <p className="text-sm text-red-700">
        {message ?? "Something went wrong"}
      </p>
    </div>
  );
}
