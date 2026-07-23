"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "로그인 실패");
        return;
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-8"
        style={{
          backgroundColor: "#14171c",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "4px",
        }}
      >
        <p
          className="tracking-[0.2em] uppercase mb-2"
          style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}
        >
          ADMIN
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em", color: "#fff" }}>
          관리자 로그인
        </h1>

        <label className="block mt-6">
          <span style={labelStyle}>아이디</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            style={inputStyle}
          />
        </label>
        <label className="block mt-4">
          <span style={labelStyle}>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={inputStyle}
          />
        </label>

        {error && (
          <p className="mt-3" style={{ color: "#ff6b7a", fontSize: "12px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full py-2.5 transition-opacity"
          style={{
            backgroundColor: "#00C2D1",
            color: "#001518",
            fontSize: "14px",
            fontWeight: 800,
            borderRadius: "2px",
            opacity: submitting ? 0.5 : 1,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "rgba(255,255,255,0.6)",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  backgroundColor: "#0b0d10",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "2px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};
