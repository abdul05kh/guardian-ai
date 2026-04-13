import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';

export const metadata = {
  title: 'Guardian AI — Digital Asset Protection & Crisis Response',
  description: 'Industry-first unified platform fusing real-time Digital Asset Protection with AI-powered Crisis Response. Protect digital assets, coordinate emergency response, and maintain cryptographic audit trails.',
  keywords: 'digital asset protection, crisis response, AI, DMCA, piracy detection, emergency management, Guardian AI',
  openGraph: {
    title: 'Guardian AI — Real-Time Digital Asset Protection & Crisis Response',
    description: 'Protect your digital assets and coordinate emergency responses with AI precision.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#050810" />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
