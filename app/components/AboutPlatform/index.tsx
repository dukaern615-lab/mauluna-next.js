'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPlatform() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            "name": "Mauluna Immobiliare",
            "description": "Prima piattaforma 100% gratuita per immobili a Roma. Connessione diretta tra proprietari e acquirenti senza commissioni.",
            "areaServed": {
              "@type": "City",
              "name": "Rome",
              "addressCountry": "IT"
            },
            "priceRange": "€€€",
            "telephone": "+393508818666",
            "url": "https://mauluna.it"
          })
        }}
      />

      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2817] mb-3 sm:mb-4">
              Perché Scegliere Mauluna Immobiliare?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-[#5C4B42] max-w-3xl mx-auto px-4 leading-relaxed">
              La prima piattaforma 100% gratuita a Roma per annunci immobiliari
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="group text-center p-8 sm:p-10 bg-white border border-[#E8E4E0] rounded-2xl hover:shadow-2xl hover:border-[#D97860]/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-money-dollar-circle-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3 sm:mb-4">
                100% Gratuito
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] leading-relaxed">
                Nessun costo nascosto, nessuna commissione. Pubblica e cerca immobili completamente gratis.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group text-center p-8 sm:p-10 bg-white border border-[#E8E4E0] rounded-2xl hover:shadow-2xl hover:border-[#D97860]/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-map-pin-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3 sm:mb-4">
                Focalizzato su Roma
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] leading-relaxed">
                Specializzato nel mercato immobiliare di Roma con informazioni dettagliate sulle zone e competenza locale.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group text-center p-8 sm:p-10 bg-white border border-[#E8E4E0] rounded-2xl hover:shadow-2xl hover:border-[#D97860]/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-shield-check-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3 sm:mb-4">
                Annunci Verificati
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] leading-relaxed">
                Tutti gli immobili sono verificati per garantire qualità e autenticità per la tua tranquillità.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group text-center p-8 sm:p-10 bg-white border border-[#E8E4E0] rounded-2xl hover:shadow-2xl hover:border-[#D97860]/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-search-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3 sm:mb-4">
                Ricerca Avanzata
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] leading-relaxed">
                Filtra per zone, tipologie di immobili, attività commerciali e altro per trovare esattamente ciò di cui hai bisogno.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group text-center p-8 sm:p-10 bg-white border border-[#E8E4E0] rounded-2xl hover:shadow-2xl hover:border-[#D97860]/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-message-3-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3 sm:mb-4">
                Contatto Diretto
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] leading-relaxed">
                Connettiti direttamente con i proprietari tramite WhatsApp, telefono o email istantaneamente.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group text-center p-8 sm:p-10 bg-white border border-[#E8E4E0] rounded-2xl hover:shadow-2xl hover:border-[#D97860]/30 transition-all duration-300 hover:-translate-y-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 sm:mb-8 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-user-heart-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3 sm:mb-4">
                Facile da Usare
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] leading-relaxed">
                Interfaccia semplice e intuitiva progettata sia per chi cerca che per chi pubblica immobili.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


