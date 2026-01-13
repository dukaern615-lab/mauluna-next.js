'use client';


import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Aggiungi la Tua Proprietà',
      description: 'Inserisci la tua proprietà con foto, dettagli e informazioni di contatto. Il nostro modulo semplice richiede solo 5 minuti.',
      icon: 'ri-add-circle-line',
      color: 'bg-gradient-to-br from-[#D97860] to-[#C9A876]'
    },
    {
      number: '02', 
      title: 'Ottieni l\'Approvazione',
      description: 'Rivediamo il tuo annuncio in poco tempo per garantire qualità e autenticità per i nostri utenti.',
      icon: 'ri-shield-check-line',
      color: 'bg-gradient-to-br from-[#C9A876] to-[#B8956A]'
    },
    {
      number: '03',
      title: 'Connettiti Direttamente',
      description: 'Gli acquirenti interessati ti contattano direttamente via telefono, WhatsApp o email. Nessun intermediario, nessuna commissione.',
      icon: 'ri-user-heart-line',
      color: 'bg-gradient-to-br from-[#5C4B42] to-[#3D2817]'
    }
  ];

  const benefits = [
    {
      title: '0% Commissioni',
      description: 'Mantieni il 100% del prezzo di vendita. Nessuna commissione nascosta, nessuna sorpresa.',
      icon: 'ri-money-euro-circle-line',
      color: 'from-[#D97860] to-[#C9A876]'
    },
    {
      title: 'Contatto Diretto',
      description: 'Gli acquirenti ti contattano direttamente. Costruisci fiducia e negozia liberamente.',
      icon: 'ri-phone-line',
      color: 'from-[#C9A876] to-[#B8956A]'
    },
    {
      title: 'Focus su Roma',
      description: 'Ci specializziamo nelle proprietà di Roma, garantendo competenza locale.',
      icon: 'ri-map-pin-line',
      color: 'from-[#5C4B42] to-[#3D2817]'
    },
    {
      title: 'Annunci di Qualità',
      description: 'Facciamo del nostro meglio per verificare tutte le proprietà, anche se non le controlliamo di persona.',
      icon: 'ri-star-line',
      color: 'from-[#D97860] to-[#E89580]'
    },
    {
      title: 'Approvazione Rapida',
      description: 'Il tuo annuncio va online rapidamente dopo la presentazione.',
      icon: 'ri-time-line',
      color: 'from-[#C9A876] to-[#D97860]'
    },
    {
      title: 'Diretto dal Proprietario',
      description: 'Connettiti con i proprietari, non con agenti o intermediari.',
      icon: 'ri-user-line',
      color: 'from-[#5C4B42] to-[#C9A876]'
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Come Funziona - MAULUNA IMMOBILIARE",
            "description": "Scopri come funziona MAULUNA IMMOBILIARE: 0% commissioni, contatto diretto proprietario, piattaforma immobiliare focalizzata su Roma. Aggiungi, approva e connetti in 3 semplici passaggi.",
            "url": "https://mauluna.it/how-it-works",
            "mainEntity": {
              "@type": "HowTo",
              "name": "Come Utilizzare MAULUNA IMMOBILIARE",
              "description": "Guida passo-passo per comprare, vendere o affittare proprietà a Roma con 0% commissioni",
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "Aggiungi la Tua Proprietà",
                  "text": "Inserisci la tua proprietà con foto, dettagli e informazioni di contatto utilizzando il nostro modulo semplice di 5 minuti"
                },
                {
                  "@type": "HowToStep", 
                  "name": "Ottieni l'Approvazione",
                  "text": "Rivediamo il tuo annuncio entro 24 ore per garantire qualità e autenticità"
                },
                {
                  "@type": "HowToStep",
                  "name": "Connettiti Direttamente",
                  "text": "Gli acquirenti interessati ti contattano direttamente via WhatsApp o email senza commissioni"
                }
              ]
            }
          })
        }}
      />

      <div className="min-h-screen bg-white">
        <Header />
        
        <main>
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-[#C9A876] via-[#D97860] to-[#B8956A] text-white pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 lg:pb-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
                Come Funziona MAULUNA
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold mb-6 text-white/95">
                0% Commissioni · Proprietari Diretti · Solo Roma
              </p>
              <p className="text-base sm:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
                Connetti direttamente proprietari con acquirenti e affittuari a Roma. 
                Nessun agente, nessuna commissione, nessuna complicazione.
              </p>
            </div>
          </section>

          {/* Steps Section */}
          <section className="py-16 sm:py-20 lg:py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2817] mb-4">Semplice Processo in 3 Passaggi</h2>
                <p className="text-lg sm:text-xl text-[#5C4B42]">Dall'inserimento alla connessione in soli 3 semplici passaggi</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                {steps.map((step, index) => (
                  <div key={step.number} className="text-center">
                    <div className="relative mb-8">
                      <div className={`w-24 h-24 lg:w-28 lg:h-28 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg hover:scale-110 transition-transform duration-300`}>
                        <i className={`${step.icon} text-3xl lg:text-4xl text-white`}></i>
                      </div>
                      <div className="absolute -top-3 -right-3 w-12 h-12 bg-white border-2 border-[#E8E4E0] rounded-full flex items-center justify-center text-lg font-bold text-[#3D2817] shadow-md">
                        {step.number}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden md:block absolute top-14 left-full w-full h-0.5 bg-gradient-to-r from-[#E8E4E0] to-transparent transform -translate-y-1/2"></div>
                      )}
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-[#3D2817] mb-4">{step.title}</h3>
                    <p className="text-[#5C4B42] leading-relaxed text-base lg:text-lg">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 sm:py-20 lg:py-24 bg-[#FAF7F2]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2817] mb-4">Perché Scegliere MAULUNA?</h2>
                <p className="text-lg sm:text-xl text-[#5C4B42]">I vantaggi che ci rendono diversi</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-white rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#E8E4E0]">
                    <div className={`w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${benefit.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}>
                      <i className={`${benefit.icon} text-white text-2xl lg:text-3xl`}></i>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-[#3D2817] mb-3">{benefit.title}</h3>
                    <p className="text-[#5C4B42] leading-relaxed text-base">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-16 sm:py-20 lg:py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2817] mb-4">Domande Frequenti</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-[#E8E4E0] p-8 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl lg:text-2xl font-bold text-[#3D2817] mb-4">
                    Come è diverso MAULUNA dalle altre piattaforme immobiliari?
                  </h3>
                  <p className="text-[#5C4B42] leading-relaxed text-base lg:text-lg">
                    Applichiamo <strong>0% di commissioni</strong> e mettiamo in contatto diretto acquirenti con proprietari. 
                    Nessun agente, nessun intermediario, nessuna commissione nascosta. Mantieni il 100% del prezzo di vendita.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E4E0] p-8 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl lg:text-2xl font-bold text-[#3D2817] mb-4">
                    Quanto tempo ci vuole perché il mio annuncio vada online?
                  </h3>
                  <p className="text-[#5C4B42] leading-relaxed text-base lg:text-lg">
                    Rivediamo tutti gli annunci <strong>in poco tempo</strong> per garantire qualità e autenticità. 
                    Una volta approvato, la tua proprietà è immediatamente visibile ai potenziali acquirenti.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E4E0] p-8 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl lg:text-2xl font-bold text-[#3D2817] mb-4">
                    Coprite solo Roma?
                  </h3>
                  <p className="text-[#5C4B42] leading-relaxed text-base lg:text-lg">
                    Sì, ci concentriamo esclusivamente sulle <strong>proprietà di Roma</strong>. Questo ci permette di fornire 
                    conoscenze locali specializzate e un servizio migliore sia per acquirenti che venditori nel mercato romano.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E4E0] p-8 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl lg:text-2xl font-bold text-[#3D2817] mb-4">
                    Come mi contattano gli acquirenti?
                  </h3>
                  <p className="text-[#5C4B42] leading-relaxed text-base lg:text-lg">
                    Gli acquirenti interessati possono contattarti direttamente via <strong>telefono, WhatsApp o email</strong> utilizzando 
                    le informazioni di contatto che fornisci nel tuo annuncio. Nessun intermediario coinvolto.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#E8E4E0] p-8 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl lg:text-2xl font-bold text-[#3D2817] mb-4">
                    È davvero gratuito?
                  </h3>
                  <p className="text-[#5C4B42] leading-relaxed text-base lg:text-lg">
                    Assolutamente sì! Non ci sono <strong>commissioni nascoste, costi di inserimento o abbonamenti</strong>. 
                    Il nostro servizio è completamente gratuito sia per proprietari che per acquirenti.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-[#C9A876] via-[#D97860] to-[#B8956A] text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Pronto a Iniziare?
              </h2>
              <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-3xl mx-auto">
                Unisciti a centinaia di proprietari che hanno già scelto MAULUNA per vendere e affittare senza commissioni
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <a 
                  href="/pubblica-annuncio" 
                  className="bg-white text-[#C9A876] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors shadow-lg whitespace-nowrap cursor-pointer"
                >
                  Aggiungi Proprietà
                </a>
                <a 
                  href="/risultati-ricerca" 
                  className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-[#C9A876] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Cerca Proprietà
                </a>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
