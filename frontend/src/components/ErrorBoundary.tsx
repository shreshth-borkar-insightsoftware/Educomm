import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console for debugging
    console.error("Error Boundary caught an error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Component Stack:", errorInfo.componentStack);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleGoHome = (): void => {
    // Reset error state and reload to home page
    // Using window.location for full page reload to ensure clean state recovery
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Navigate to home (dashboard is the home page)
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-black p-4">
          <Card className="w-full max-w-2xl border-2 border-black dark:border-white rounded-2xl bg-white/50 backdrop-blur-sm dark:bg-black/50">
            <CardHeader className="space-y-4 pb-6">
              <div className="flex justify-center">
                <AlertTriangle 
                  size={64} 
                  className="text-black dark:text-white"
                />
              </div>
              <CardTitle className="text-3xl font-black tracking-tighter uppercase text-center text-black dark:text-white">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm uppercase tracking-widest">
                We apologize for the inconvenience. An unexpected error has occurred.
              </p>

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  onClick={this.handleGoHome}
                  className="rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors uppercase tracking-wider"
                >
                  Go to Home
                </Button>
              </div>

              {/* Optional Error Details - Collapsible */}
              {this.state.error && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-black dark:text-white uppercase tracking-wide mb-2">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <p className="text-xs font-mono text-neutral-700 dark:text-neutral-300 mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400 overflow-auto max-h-48 whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
