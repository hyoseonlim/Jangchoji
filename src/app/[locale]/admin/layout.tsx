import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 · 건전한 레저",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: "#0b0d10", minHeight: "100vh", color: "#e6e8ec" }}>
      {children}
    </div>
  );
}
