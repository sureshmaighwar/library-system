"use client";

import { Component, type ReactNode } from "react";

import { EmptyState } from "@/components/features/EmptyState";

type BoundaryState = { error: Error | null };

/** Catches a render error in the children and offers another attempt. */
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <EmptyState variant="error" onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}
