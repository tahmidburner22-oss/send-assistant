/**
 * DiagnosticStarterSheet — renders diagnostic starter questions in the exact
 * same professional style as WorksheetRenderer (purple header, borders, fonts).
 * Only shows the topic name and numbered starter questions — nothing else.
 */
import React, { forwardRef } from "react";
import { getSendFormatting } from "@/lib/send-data";

interface DiagnosticStarterSheetProps {
  topic: string;
  questions: string[];
  schoolName?: string;
  teacherName?: string;
  sendNeedId?: string;
  textSize?: number;
  overlayColor?: string;
}

const DiagnosticStarterSheet = forwardRef<HTMLDivElement, DiagnosticStarterSheetProps>(
  function DiagnosticStarterSheetInner(
    { topic, questions, schoolName, teacherName, sendNeedId, textSize, overlayColor },
    ref
  ) {
    const fmt = getSendFormatting(sendNeedId, textSize);

    return (
      <div
        ref={ref}
        className="worksheet-print-root"
        style={{
          backgroundColor: overlayColor || "white",
          fontFamily: fmt.fontFamily,
          fontSize: `${fmt.fontSize}px`,
          lineHeight: fmt.lineHeight,
          letterSpacing: fmt.letterSpacing,
          wordSpacing: fmt.wordSpacing,
          fontWeight: fmt.fontWeight,
        }}
      >
        {/* ── Professional Header — identical to WorksheetRenderer ── */}
        <div
          className="ws-header"
          style={{
            marginBottom: "10px",
            borderRadius: "4px",
            overflow: "hidden",
            border: "1.5px solid #5b21b6",
          }}
        >
          <div
            style={{
              background: "#5b21b6",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            {/* Left: Adaptly brand mark */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "14px",
                  color: "white",
                  fontFamily: fmt.fontFamily,
                }}
              >
                A
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: fmt.fontFamily,
                  lineHeight: "1.2",
                }}
              >
                <div style={{ fontWeight: 700 }}>{schoolName || "Adaptly"}</div>
                <div>SEND-Informed Learning Resource</div>
              </div>
            </div>

            {/* Centre: Title */}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: `${fmt.fontSize + 1}px`,
                  color: "white",
                  fontFamily: fmt.fontFamily,
                  letterSpacing: fmt.letterSpacing,
                  lineHeight: "1.3",
                }}
              >
                Diagnostic Starter — {topic}
              </div>
              <div
                style={{
                  fontSize: `${fmt.fontSize - 3}px`,
                  color: "rgba(255,255,255,0.8)",
                  marginTop: "1px",
                  fontFamily: fmt.fontFamily,
                }}
              >
                Answer the questions below to show what you already know
              </div>
            </div>

            {/* Right: Name / Date / Class fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flexShrink: 0 }}>
              {[
                { label: "Name", value: "" },
                { label: "Date", value: new Date().toLocaleDateString("en-GB") },
                { label: "Class", value: "" },
                ...(teacherName ? [{ label: "Teacher", value: teacherName }] : []),
              ].map((field, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                      fontFamily: fmt.fontFamily,
                      minWidth: "32px",
                    }}
                  >
                    {field.label}:
                  </span>
                  <div
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.6)",
                      minWidth: "70px",
                      height: "14px",
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "rgba(255,255,255,0.9)",
                        paddingBottom: "1px",
                        fontFamily: fmt.fontFamily,
                      }}
                    >
                      {field.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Questions section — same border/padding as worksheet sections ── */}
        <div
          style={{
            border: "1.5px solid #5b21b6",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          {/* Section header bar */}
          <div
            style={{
              background: "#f5f3ff",
              borderBottom: "1px solid #ddd6fe",
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#5b21b6",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: `${fmt.fontSize - 1}px`,
                color: "#3b0764",
                fontFamily: fmt.fontFamily,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Starter Questions
            </span>
          </div>

          {/* Questions list */}
          <div style={{ padding: "12px 16px", background: "white" }}>
            {questions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: idx < questions.length - 1 ? "16px" : "0",
                }}
              >
                {/* Question text */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    fontFamily: fmt.fontFamily,
                    fontSize: `${fmt.fontSize}px`,
                    lineHeight: fmt.lineHeight,
                    color: "#1a1a1a",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontWeight: 700, flexShrink: 0, color: "#5b21b6" }}>
                    {idx + 1}.
                  </span>
                  <span>{q}</span>
                </div>
                {/* Answer line */}
                <div
                  style={{
                    borderBottom: "1px solid #9ca3af",
                    marginLeft: "20px",
                    marginBottom: "4px",
                    height: "22px",
                  }}
                />
                <div
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    marginLeft: "20px",
                    height: "22px",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            fontSize: "9px",
            color: "#9ca3af",
            fontFamily: fmt.fontFamily,
            paddingTop: "4px",
          }}
        >
          Generated by Adaptly · adaptly.co.uk
        </div>
      </div>
    );
  }
);

DiagnosticStarterSheet.displayName = "DiagnosticStarterSheet";
export default DiagnosticStarterSheet;
