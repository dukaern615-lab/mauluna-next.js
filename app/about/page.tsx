'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

const AboutPage: React.FC = () => {
  const router = useRouter();
  
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent('Ciao! Vogliamo saperne di più sulla vostra piattaforma immobiliare gratuita.');
    window.open(`https://wa.me/393508818666?text=${message}`, '_blank');
  };

  const milestones = [
    {
      year: '2024',
      title: 'Nascita del Progetto',
      description: 'Idea rivoluzionaria di eliminare le commissioni immobiliari a Roma'
    },
    {
      year: '2025',
      title: 'Lancio Piattaforma',
      description: 'Prima piattaforma immobiliare completamente gratuita di Roma'
    },
    {
      year: '2025',
      title: 'Crescita Rapida',
      description: 'Migliaia di proprietari e acquirenti si uniscono alla community'
    }
  ];

  const values = [
    {
      icon: 'ri-heart-line',
      title: 'Trasparenza Totale',
      description: 'Nessun costo nascosto, nessuna commissione, tutto completamente gratuito per sempre'
    },
    {
      icon: 'ri-user-heart-line',
      title: 'Servizio Umano',
      description: 'Supporto personalizzato e assistenza dedicata per ogni utente della nostra piattaforma'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Sicurezza Garantita',
      description: 'Verifichiamo ogni annuncio per garantire autenticità e qualità degli immobili'
    },
    {
      icon: 'ri-rocket-line',
      title: 'Innovazione Continua',
      description: 'Tecnologia avanzata per semplificare il processo di compravendita immobiliare'
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-[#3D2817] to-[#2A1B0F] text-white overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Beautiful%20panoramic%20view%20of%20Rome%20cityscape%20with%20ancient%20architecture%2C%20Colosseum%20and%20Roman%20Forum%20visible%2C%20golden%20sunset%20lighting%2C%20professional%20real%20estate%20photography%2C%20warm%20atmospheric%20lighting%2C%20Italian%20capital%20city%20landmarks&width=1920&height=800&seq=about-hero&orientation=landscape')`
          }}
        ></div>
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Chi Siamo - Piattaforma Immobiliare Roma
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-[#D97860] mb-8">
            Rivoluzionando il Mercato Immobiliare Romano dal 2024
          </h2>
          <p className="text-xl max-w-4xl mx-auto leading-relaxed mb-8">
            Siamo la prima piattaforma immobiliare completamente gratuita di Roma che connette 
            direttamente proprietari e acquirenti, eliminando commissioni e intermediari per 
            sempre. La nostra missione è democratizzare l'accesso al mercato immobiliare romano.
          </p>
          <button
            onClick={handleWhatsAppContact}
            className="inline-flex items-center px-8 py-4 bg-[#D97860] text-white font-semibold rounded-lg hover:bg-[#C86A4E] transition-colors shadow-lg whitespace-nowrap"
          >
            <i className="ri-whatsapp-line text-2xl mr-3"></i>
            Contattaci su WhatsApp
          </button>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-bold text-[#3D2817] mb-6">
                La Nostra Missione Immobiliare
              </h3>
              <h4 className="text-2xl font-semibold text-[#D97860] mb-6">
                Eliminare le Commissioni Immobiliari a Roma
              </h4>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Crediamo che comprare, vendere o affittare casa a Roma non dovrebbe costare 
                migliaia di euro in commissioni. Per questo abbiamo creato la prima piattaforma 
                immobiliare completamente gratuita della Capitale, dove proprietari e acquirenti 
                si incontrano direttamente.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Dal 2023 stiamo rivoluzionando il mercato immobiliare romano, offrendo un 
                servizio trasparente, sicuro e completamente gratuito. Nessuna commissione, 
                nessun intermediario, solo contatto diretto tra le parti.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#D97860] mb-2">0%</div>
                  <div className="text-gray-600">Commissioni</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#D97860] mb-2">100%</div>
                  <div className="text-gray-600">Gratuito</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://readdy.ai/api/search-image?query=Modern%20real%20estate%20office%20in%20Rome%20with%20professional%20team%20working%2C%20Italian%20architecture%20visible%20through%20windows%2C%20warm%20lighting%2C%20contemporary%20workspace%20design%2C%20real%20estate%20professionals%20collaborating%2C%20Roman%20cityscape%20background&width=600&height=500&seq=mission&orientation=landscape"
                alt="Team immobiliare Roma - Piattaforma gratuita"
                className="rounded-lg shadow-xl object-cover w-full h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-[#F9F6F3]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#3D2817] mb-6">
              I Nostri Valori Immobiliari
            </h3>
            <h4 className="text-2xl font-semibold text-[#D97860] mb-8">
              Principi che Guidano la Nostra Piattaforma
            </h4>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Ogni decisione che prendiamo è guidata da questi valori fondamentali che 
              rendono unica la nostra piattaforma immobiliare romana.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 flex items-center justify-center bg-[#D97860] text-white rounded-full mx-auto mb-4">
                  <i className={`${value.icon} text-2xl`}></i>
                </div>
                <h5 className="text-xl font-bold text-[#3D2817] mb-3">{value.title}</h5>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#3D2817] mb-6">
              La Nostra Storia Immobiliare
            </h3>
            <h4 className="text-2xl font-semibold text-[#D97860] mb-8">
              Tappe Fondamentali della Piattaforma
            </h4>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Dal concept iniziale alla piattaforma leader del mercato immobiliare romano, 
              ecco come siamo cresciuti.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center mb-12 last:mb-0">
                <div className="flex-shrink-0 w-24 h-24 bg-[#C9A876] text-white rounded-full flex items-center justify-center text-xl font-bold mr-8">
                  {milestone.year}
                </div>
                <div className="flex-grow">
                  <h5 className="text-2xl font-bold text-[#3D2817] mb-3">{milestone.title}</h5>
                  <p className="text-lg text-gray-700 leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-[#F9F6F3]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-[#3D2817] mb-6">
              Perché Scegliere la Nostra Piattaforma
            </h3>
            <h4 className="text-2xl font-semibold text-[#D97860] mb-8">
              Vantaggi Unici del Mercato Immobiliare Romano
            </h4>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] text-white rounded-lg mr-4 flex-shrink-0">
                    <i className="ri-money-dollar-circle-line text-xl"></i>
                  </div>
                  <div>
                    <h5 className="text-xl font-bold text-[#3D2817] mb-2">Risparmio Garantito</h5>
                    <p className="text-gray-700">Eliminiamo le commissioni immobiliari, facendoti risparmiare migliaia di euro su ogni transazione a Roma.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] text-white rounded-lg mr-4 flex-shrink-0">
                    <i className="ri-user-heart-line text-xl"></i>
                  </div>
                  <div>
                    <h5 className="text-xl font-bold text-[#3D2817] mb-2">Contatto Diretto</h5>
                    <p className="text-gray-700">Connessione diretta tra proprietari e acquirenti senza intermediari o agenzie immobiliari.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] text-white rounded-lg mr-4 flex-shrink-0">
                    <i className="ri-shield-check-line text-xl"></i>
                  </div>
                  <div>
                    <h5 className="text-xl font-bold text-[#3D2817] mb-2">Sicurezza Verificata</h5>
                    <p className="text-gray-700">Ogni annuncio è verificato dal nostro team per garantire autenticità e qualità degli immobili romani.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] text-white rounded-lg mr-4 flex-shrink-0">
                    <i className="ri-map-pin-line text-xl"></i>
                  </div>
                  <div>
                    <h5 className="text-xl font-bold text-[#3D2817] mb-2">Focus su Roma</h5>
                    <p className="text-gray-700">Specializzati esclusivamente nel mercato immobiliare romano, conosciamo ogni quartiere della Capitale.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <img 
              src="https://readdy.ai/api/search-image?query=Happy%20family%20receiving%20keys%20to%20new%20apartment%20in%20Rome%20celebrating&width=800&height=600&orientation=landscape" 
              alt="Clienti soddisfatti" 
              className="rounded-lg shadow-xl w-full object-cover h-[500px]"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#3D2817] to-[#D97860] text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-4xl font-bold mb-6 text-white">
            Unisciti alla Rivoluzione Immobiliare
          </h3>
          <h4 className="text-2xl font-semibold mb-8 text-white">
            Inizia Oggi a Risparmiare sulle Commissioni
          </h4>
          <p className="text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
            Migliaia di proprietari e acquirenti hanno già scelto la nostra piattaforma 
            per le loro transazioni immobiliari a Roma. Unisciti anche tu!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleWhatsAppContact}
              className="inline-flex items-center px-8 py-4 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#20BA5A] transition-colors shadow-lg whitespace-nowrap"
            >
              <i className="ri-whatsapp-line text-2xl mr-3"></i>
              Contattaci su WhatsApp
            </button>
            <button
              onClick={() => router.push('/pubblica-annuncio')}
              className="inline-flex items-center px-8 py-4 bg-white text-[#3D2817] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap cursor-pointer"
            >
              <i className="ri-home-4-line text-2xl mr-3"></i>
              Pubblica Gratis
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
