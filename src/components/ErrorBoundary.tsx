import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, Button } from './ui/Base';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 border-rose-500/20 bg-rose-500/5 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">System Error</h2>
            <p className="text-sm text-zinc-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred in the intelligence interface.'}
            </p>
            <Button 
              variant="primary" 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw size={16} />
              Reload Interface
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
