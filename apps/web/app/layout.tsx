import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora — Adversarial Intelligence System",
  description:
    "Adversarial deliberation for citable AI decisions. Multi-agent debate with explicit dissent and local citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="relative min-h-screen overflow-x-hidden">
        {/* Animated gradient orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          {/* Violet orb - top left */}
          <div
            className="absolute -left-32 -top-32 h-[600px] w-[600px] animate-orb-drift rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
              filter: "blur(120px)",
            }}
          />
          {/* Cyan orb - bottom right */}
          <div
            className="absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-orb-drift-reverse rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)",
              filter: "blur(120px)",
            }}
          />
          {/* Subtle violet accent - center */}
          <div
            className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-orb-drift rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
              filter: "blur(150px)",
              animationDelay: "-7s",
            }}
          />
        </div>
        {/* Content layer */}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
