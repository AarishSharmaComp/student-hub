import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-semibold">
              Unable to open your workspace
            </h1>
            <p role="alert" className="text-sm text-muted-foreground">
              Please reload to try again. Your saved academic records are
              preserved.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload workspace
            </Button>
          </div>
        </div>
      );
    return this.props.children;
  }
}
