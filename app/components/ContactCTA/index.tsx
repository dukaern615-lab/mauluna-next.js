'use client';

export default function ContactCTA() {
  const handlePropertyWhatsApp = async () => {
    const message = "Ciao! Voglio pubblicare la mia proprietà GRATUITAMENTE su Mauluna Immobiliare. Ecco i dettagli:";
    const whatsappUrl = `https://wa.me/393508818666?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Track WhatsApp click
    try {
      const { whatsappLeadsFunctions } = await import('@/lib/supabaseFunctions');
      await whatsappLeadsFunctions.trackClick({
        context: 'home_page_publish',
        messagePreview: message,
      });
    } catch (err) {
      console.error('Error tracking WhatsApp click:', err);
    }
  };

  const handleQuestionWhatsApp = async () => {
    const message = "Ciao! Ho una domanda su Mauluna Immobiliare:";
    const whatsappUrl = `https://wa.me/393508818666?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Track WhatsApp click
    try {
      const { whatsappLeadsFunctions } = await import('@/lib/supabaseFunctions');
      await whatsappLeadsFunctions.trackClick({
        context: 'home_page_question',
        messagePreview: message,
      });
    } catch (err) {
      console.error('Error tracking WhatsApp click:', err);
    }
  };

  const handlePropertyEmail = () => {
    window.location.href = 'mailto:info@mauluna.it?subject=Pubblicazione Proprietà su Mauluna Immobiliare';
  };

  const handleQuestionEmail = () => {
    window.location.href = 'mailto:info@mauluna.it?subject=Domanda su Mauluna Immobiliare';
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F9F6F3] via-white to-[#F9F6F3]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2817] mb-3 sm:mb-4">
            Siamo Qui per Te
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#5C4B42] max-w-2xl mx-auto px-4 leading-relaxed">
            Hai una proprietà da pubblicare? Domande sulla piattaforma? Scrivici su WhatsApp o email. Rispondiamo sempre.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Publish Property Card */}
          <div className="group bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border-2 border-[#E8E4E0] hover:border-[#25D366]/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-center">
              <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-5 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-home-4-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3">
                Pubblica la Tua Proprietà
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] mb-6 leading-relaxed">
                Invia i dettagli via WhatsApp o email e la pubblichiamo gratuitamente per te
              </p>
              <div className="space-y-3">
                <button
                  onClick={handlePropertyWhatsApp}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm sm:text-base shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <i className="ri-whatsapp-line text-xl sm:text-2xl"></i>
                  <span>Invia via WhatsApp</span>
                </button>
                <button
                  onClick={handlePropertyEmail}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 bg-white border-2 border-[#D97860] text-[#D97860] rounded-xl font-semibold text-sm sm:text-base hover:bg-[#D97860] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <i className="ri-mail-line text-xl sm:text-2xl"></i>
                  <span>Invia Email</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ask Questions Card */}
          <div className="group bg-white rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border-2 border-[#E8E4E0] hover:border-[#D97860]/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-center">
              <div className="w-18 h-18 sm:w-20 sm:h-20 mx-auto mb-5 bg-gradient-to-br from-[#D97860] to-[#C9A876] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <i className="ri-question-line text-3xl sm:text-4xl text-white"></i>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#3D2817] mb-3">
                Fai una Domanda
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42] mb-6 leading-relaxed">
                Chiedici qualsiasi cosa sulla piattaforma. Siamo sempre disponibili
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleQuestionWhatsApp}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm sm:text-base shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <i className="ri-whatsapp-line text-xl sm:text-2xl"></i>
                  <span>Scrivi su WhatsApp</span>
                </button>
                <button
                  onClick={handleQuestionEmail}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 sm:py-4 bg-white border-2 border-[#D97860] text-[#D97860] rounded-xl font-semibold text-sm sm:text-base hover:bg-[#D97860] hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <i className="ri-mail-line text-xl sm:text-2xl"></i>
                  <span>Invia Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
