<<<<<<< HEAD
import type { Metadata } from 'next';
import './globals.css';
=======
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'

const inter = Inter({ subsets: ['latin'] })
>>>>>>> 3cabe7b (feat: Implement authentication and basic layout)

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
<<<<<<< HEAD
      <body>{children}</body>
=======
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
>>>>>>> 3cabe7b (feat: Implement authentication and basic layout)
    </html>
  );
}
