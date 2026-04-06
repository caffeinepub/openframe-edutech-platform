import { Loader2 } from "lucide-react";

export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[200px] gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {message && <span className="text-muted-foreground">{message}</span>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading OpenFrame...</p>
      </div>
    </div>
  );
}
