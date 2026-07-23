import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeBoot } from '@/components/ui/ThemeBoot';

export const metadata: Metadata = {
  title: { default: 'RitmoLínea', template: '%s · RitmoLínea' },
  description: 'El party game musical donde cada canción encuentra su lugar en el tiempo.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#090a13' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body><ThemeBoot />{children}</body></html>;
}
