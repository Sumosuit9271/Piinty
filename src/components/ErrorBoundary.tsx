import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="font-display text-2xl">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Sorry about that — the pints are safe. Give it another go.
          </p>
          <Button onClick={() => window.location.reload()}>Reload Piinty</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
