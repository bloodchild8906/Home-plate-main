import { CheckCircle2, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

type MauiExportStatus = "running" | "complete" | "error";

export function MauiExportProgressDialog({
  open,
  appName,
  progress,
  message,
  status,
  onOpenChange,
}: {
  open: boolean;
  appName: string;
  progress: number;
  message: string;
  status: MauiExportStatus;
  onOpenChange: (open: boolean) => void;
}) {
  const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(event) => {
          if (status === "running") {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (status === "running") {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === "running" ? (
              <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            )}
            {status === "running" ? "Building MAUI app" : "MAUI export complete"}
          </DialogTitle>
          <DialogDescription>
            {appName || "Selected app"} {status === "running" ? "is being exported." : "is ready."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Progress value={roundedProgress} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{message}</span>
            <span className="font-semibold">{roundedProgress}%</span>
          </div>
          {status === "running" ? (
            <p className="text-xs text-muted-foreground">
              Export is in progress. Inputs are temporarily locked.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
