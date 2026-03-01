import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/Button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-zinc-100 p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
