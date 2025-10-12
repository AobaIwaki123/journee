import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "設定 | Journee",
  description: "Journeeの設定。アプリケーションの設定を管理します。",
  openGraph: {
    title: "設定 | Journee",
    description: "アプリケーションの設定",
    type: "website",
    images: ["/api/og/default"],
  },
  twitter: {
    card: "summary_large_image",
    title: "設定 | Journee",
    description: "アプリケーションの設定",
    images: ["/api/og/default"],
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
