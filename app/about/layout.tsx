import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chi Siamo - Mauluna Immobiliare | Piattaforma Gratuita per Immobili a Roma',
  description: 'Scopri Mauluna: la prima piattaforma 100% gratuita che connette direttamente proprietari e acquirenti a Roma. Nessuna commissione, massima trasparenza.',
  keywords: 'mauluna immobiliare, chi siamo, piattaforma gratuita immobili, senza commissioni Roma',
  alternates: {
    canonical: 'https://mauluna.it/chi-siamo',
  },
  openGraph: {
    title: 'Chi Siamo - Mauluna Immobiliare',
    description: 'La prima piattaforma 100% gratuita per immobili a Roma. Nessuna commissione.',
    url: 'https://mauluna.it/chi-siamo',
    images: ['https://mauluna.it/og-image.jpg'],
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chi Siamo - Mauluna Immobiliare',
    description: 'La prima piattaforma 100% gratuita per immobili a Roma.',
    images: ['https://mauluna.it/og-image.jpg'],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
