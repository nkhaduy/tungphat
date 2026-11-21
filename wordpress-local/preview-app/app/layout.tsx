import type { Metadata } from 'next';
import { LanguageProvider } from '@/lib/i18n-context';
import { montserratVariables } from '@/app/fonts';
import '@/app/globals.css';

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true }, title: 'Xem trước bài viết' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="vi" className={montserratVariables}><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
