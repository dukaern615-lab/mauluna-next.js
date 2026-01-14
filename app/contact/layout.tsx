import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contatti - Mauluna Immobiliare Roma | Email e WhatsApp',
  description: 'Contatta Mauluna per supporto, informazioni o partnership. Email: info@mauluna.it | WhatsApp: +39 350 881 8666. Siamo a Roma e pronti ad aiutarti.',
  keywords: 'contatti mauluna, supporto immobiliare Roma, email mauluna, whatsapp mauluna',
  alternates: {
    canonical: 'https://mauluna.it/contatti',
  },
  openGraph: {
    title: 'Contatti - Mauluna Immobiliare Roma',
    description: 'Contattaci per supporto o informazioni. Email: info@mauluna.it | WhatsApp: +39 350 881 8666',
    url: 'https://mauluna.it/contatti',
    images: ['https://mauluna.it/og-image.jpg'],
    type: 'website',
    locale: 'it_IT',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contatti - Mauluna Immobiliare',
    description: 'Contattaci per supporto o informazioni.',
    images: ['https://mauluna.it/og-image.jpg'],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
