import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutti gli Immobili a Roma | 0% Commissioni - Mauluna',
  description: 'Scopri tutti gli immobili disponibili a Roma: appartamenti, case, ville in vendita e affitto. Contatto diretto con i proprietari, 0% commissioni su Mauluna.',
  keywords: 'immobili Roma, appartamenti Roma vendita, case affitto Roma, ville Roma, immobili senza commissioni Roma',
  alternates: {
    canonical: 'https://mauluna.it/immobili',
  },
  openGraph: {
    title: 'Tutti gli Immobili a Roma - Mauluna',
    description: 'Scopri tutti gli immobili disponibili a Roma. Contatto diretto, 0% commissioni.',
    url: 'https://mauluna.it/immobili',
    images: ['https://mauluna.it/og-image.jpg'],
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tutti gli Immobili a Roma - Mauluna',
    description: 'Scopri tutti gli immobili disponibili a Roma. 0% commissioni.',
    images: ['https://mauluna.it/og-image.jpg'],
  },
};

export default function PropertiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
