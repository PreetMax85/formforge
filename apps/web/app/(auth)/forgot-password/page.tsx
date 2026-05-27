"use client";

import Link from "next/link";
import AuthShell from "../_components/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="recovery"
      footer={
        <>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "13px",
              color:      "#4b5563",
            }}
          >
            Remembered it?
          </span>
          <Link
            href="/login"
            style={{
              fontFamily:     "var(--font-mono)",
              fontSize:       "13px",
              fontWeight:     600,
              color:          "#569cd6",
              textDecoration: "none",
              letterSpacing:  "0.05em",
            }}
          >
            login →
          </Link>
        </>
      }
    >
      {/* Title */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "22px",
            fontWeight:    700,
            color:         "#d4d4d4",
            margin:        0,
            letterSpacing: "-0.02em",
          }}
        >
          Account recovery
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "13px",
            color:      "#6b7280",
            margin:     "6px 0 0",
          }}
        >
          Password reset is not yet available.
        </p>
      </div>

      <div
        style={{
          padding:       "16px",
          background:    "#1e1e1e",
          border:        "1px solid #3c3c3c",
          fontFamily:    "var(--font-mono)",
          fontSize:      "12px",
          color:         "#9ca3af",
          lineHeight:    1.6,
        }}
      >
        If you’ve lost access to your account, please contact the project maintainer for assistance.
      </div>
    </AuthShell>
  );
}
