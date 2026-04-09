/**
 * WorksheetErrorBoundary — inline error boundary for worksheet rendering.
 *
 * Unlike the full-page ErrorBoundary, this renders a contained error card
 * suitable for use inside dialogs and panels. It catches render errors thrown
 * by WorksheetRenderer (e.g. from malformed section data or unexpected AI output)
 * and presents a user-friendly recovery UI without crashing the whole page.
 *
 * Usage:
 *   <WorksheetErrorBoundary onReset={() => setSelectedWs(null)}>
 *     <WorksheetRenderer ... />
 *   </WorksheetErrorBoundary>
 */
import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Optional callback invoked when the user clicks "Try Again" — use to reset parent state */
  onReset?: () => void;
  /** Optional label shown on the reset button (default: "Try Again") */
  resetLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class WorksheetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("[WorksheetErrorBoundary] Render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "32px 24px",
            border: "1px dashed #fca5a5",
            borderRadius: "10px",
            background: "#fff7f7",
            textAlign: "center",
          }}
        >
          <AlertTriangle size={32} style={{ color: "#ef4444", flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: "14px", color: "#1f2937", marginBottom: "4px" }}>
              Could not render this worksheet
            </p>
            <p style={{ fontSize: "13px", color: "#6b7280", maxWidth: "380px" }}>
              The worksheet content may be in an unexpected format. Try regenerating it, or contact{" "}
              <a href="mailto:support@adaptly.co.uk" style={{ color: "#4f46e5", textDecoration: "underline" }}>
                support@adaptly.co.uk
              </a>{" "}
              if the problem persists.
            </p>
          </div>

          {/* Dev-only stack trace */}
          {isDev && this.state.error && (
            <pre
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                background: "#f3f4f6",
                borderRadius: "6px",
                padding: "10px 12px",
                maxWidth: "100%",
                overflowX: "auto",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {this.state.error.stack}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 16px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#374151",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} />
            {this.props.resetLabel ?? "Try Again"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WorksheetErrorBoundary;
