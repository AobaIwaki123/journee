import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { SoundProvider } from '@/components/sound/SoundProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Journee - AI旅のしおり作成アプリ',
  description: 'AIとともに旅のしおりを作成するアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <SoundProvider>
            {children}
          </SoundProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
