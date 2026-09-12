"use client";
import { validators } from "../lib/validation";

export default function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const result = validators.password(password);
  const label = validators.passwordLabel(result.score);
  const pct = Math.min(100, (result.score / 6) * 100);

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "11px", color: "#64748b" }}>Password strength</span>
        <span style={{ fontSize: "11px", color: label.color, fontWeight: 600 }}>
          {label.label}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "#e2e8f0",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: label.color,
            transition: "all 0.3s",
            borderRadius: "3px",
          }}
        />
      </div>
      {!result.valid && result.error && (
        <p style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px" }}>
          {result.error}
        </p>
      )}
    </div>
  );
}