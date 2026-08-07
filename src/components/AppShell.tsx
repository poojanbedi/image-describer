import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header>
        <h1>Image Describer</h1>
        <p>Upload an image and receive a detailed full-format description.</p>
      </header>
      <main>{children}</main>
    </div>
  );
}
