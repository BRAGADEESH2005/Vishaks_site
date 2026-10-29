"use client";

import { Component, type ReactNode } from "react";

type Props = { fallback: ReactNode; onError?: () => void; children: ReactNode };

/** Keeps a failure in an optional enhancement (such as WebGL) from taking the page down. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV === "development") console.warn("Optional component failed and was skipped:", error);
    this.props.onError?.();
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
