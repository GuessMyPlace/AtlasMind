import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.toString() + "\n" + (error.stack || "") };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#333", color: "white", fontFamily: "monospace" }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: "pre-wrap", color: "red" }}>{this.state.errorStr}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
