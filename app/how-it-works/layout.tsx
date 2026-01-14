import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Come Funziona - Mauluna | Pubblica e Trova Immobili Gratis a Roma',
  description: 'Scopri come pubblicare annunci immobiliari gratis su Mauluna. Registrati, pubblica il tuo immobile, ricevi contatti diretti. Semplice, veloce e 100% gratuito.',
  keywords: 'come funziona mauluna, pubblicare annunci gratis, vendere casa Roma gratis, affittare immobile senza commissioni',
  alternates: {
    canonical: 'https://mauluna.it/come-funziona',
  },
  openGraph: {
    title: 'Come Funziona - Mauluna',
    description: 'Pubblica annunci immobiliari gratis a Roma. Registrati, pubblica, ricevi contatti diretti.',
    url: 'https://mauluna.it/come-funziona',
    images: ['https://mauluna.it/og-image.jpg'],
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Come Funziona - Mauluna',
    description: 'Pubblica annunci immobiliari gratis a Roma.',
    images: ['https://mauluna.it/og-image.jpg'],
  },
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
