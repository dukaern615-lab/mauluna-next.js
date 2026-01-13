'use client';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  faqs: FAQItem[];
}

export default function FAQSchema({ faqs }: FAQSchemaProps) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

// Pre-defined FAQs for homepage
export const homepageFAQs: FAQItem[] = [
  {
    question: "MAULUNA IMMOBILIARE addebita commissioni?",
    answer: "No! MAULUNA IMMOBILIARE è una piattaforma 100% gratuita. Non addebitiamo alcuna commissione né ai proprietari né agli inquilini. Puoi pubblicare annunci e contattare direttamente i proprietari senza costi nascosti."
  },
  {
    question: "Come posso contattare un proprietario?",
    answer: "Ogni annuncio include i dettagli di contatto del proprietario. Puoi contattarlo direttamente tramite WhatsApp, telefono, email o tramite il nostro sistema di messaggistica interno. È completamente gratuito e senza intermediari."
  },
  {
    question: "Quanto tempo ci vuole per pubblicare un annuncio?",
    answer: "Pubblicare un annuncio su MAULUNA IMMOBILIARE richiede solo 5-10 minuti. Dopo aver creato il tuo account gratuito, compila il modulo con i dettagli dell'immobile, carica le foto e pubblica. Il tuo annuncio sarà visibile dopo una breve verifica da parte del nostro team."
  },
  {
    question: "Quali zone di Roma coprite?",
    answer: "MAULUNA IMMOBILIARE copre tutte le zone di Roma, inclusi i quartieri più richiesti come Parioli, Trastevere, Centro Storico, EUR, Prati, Testaccio, San Giovanni, Trieste, Flaminio e molti altri. Troverai immobili in vendita e affitto in tutta la città."
  },
  {
    question: "Come verificate gli annunci?",
    answer: "Ogni annuncio pubblicato su MAULUNA IMMOBILIARE viene verificato manualmente dal nostro team. Controlliamo l'autenticità delle informazioni, la qualità delle foto e la correttezza dei dati di contatto per garantire un'esperienza sicura e affidabile per tutti gli utenti."
  }
];
