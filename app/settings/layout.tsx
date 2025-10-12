import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '設定 | Journee',
  description: 'Journeeの設定を管理します。AI、効果音、アカウント設定など。',
  openGraph: {
    title: '設定 | Journee',
    description: 'Journeeの設定を管理',
    type: 'website',
    images: ['/api/og/default'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '設定 | Journee',
    description: 'Journeeの設定を管理',
    images: ['/api/og/default'],
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
