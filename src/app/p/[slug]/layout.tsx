import type { ReactNode } from "react";

export default function PublicResumeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&family=Noto+Serif+SC:wght@500;600&family=Outfit:wght@400;500;600&family=Sora:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap"
      />
      {children}
    </div>
  );
}
