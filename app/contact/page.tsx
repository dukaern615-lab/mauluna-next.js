'use client';


import { useState } from 'react';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('email', formData.email);
        formDataToSend.append('message', formData.message);

        const response = await fetch('https://readdy.ai/api/form/d46rnjt34biqimnfo8jg', {
          method: 'POST',
          body: formDataToSend,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          setSubmitStatus('success');
          setFormData({ name: '', email: '', message: '' });
          setIsSubmitting(false);
          return;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error: any) {
        retries++;
        if (error.name === 'AbortError') {
          if (retries >= maxRetries) {
            setSubmitStatus('error');
            setIsSubmitting(false);
            return;
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          if (retries >= maxRetries) {
            setSubmitStatus('error');
            setIsSubmitting(false);
            return;
          }
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    }
    
    setSubmitStatus('error');
    setIsSubmitting(false);
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contattaci - MAULUNA IMMOBILIARE",
            "description": "Contatta MAULUNA IMMOBILIARE per domande su immobili a Roma, annunci di proprietà o la nostra piattaforma con 0% di commissioni.",
            "url": "https://mauluna.it/contact",
            "mainEntity": {
              "@type": "Organization",
              "name": "MAULUNA IMMOBILIARE",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+39-350-881-8666",
                "contactType": "customer service",
                "availableLanguage": ["Italian", "English"]
              }
            }
          })
        }}
      />

      <div className="min-h-screen bg-[#F5F7FA]">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#5C4B42] mb-4">Contattaci</h1>
            <p className="text-[#8B7355] text-lg max-w-2xl mx-auto">
              Hai domande sulla nostra piattaforma o hai bisogno di aiuto con il tuo annuncio immobiliare? 
              Siamo qui per aiutarti a navigare nel mercato immobiliare di Roma.
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <section className="bg-white rounded-lg shadow-sm border border-[#E8E4E0] p-8">
              <h2 className="text-2xl font-semibold text-[#5C4B42] mb-6">Inviaci un Messaggio</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-check-circle-line text-green-500 mr-2"></i>
                    <span className="text-green-700">Messaggio inviato con successo! Ti risponderemo presto.</span>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <i className="ri-error-warning-line text-red-500 mr-2"></i>
                    <span className="text-red-700">Invio del messaggio fallito. Riprova per favore.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} data-readdy-form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#5C4B42] mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-sm"
                    placeholder="Mario Rossi"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#5C4B42] mb-2">
                    Indirizzo Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-sm"
                    placeholder="mario@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-[#5C4B42] mb-2">
                    Messaggio
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    maxLength={500}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 border border-[#E8E4E0] rounded-lg focus:ring-2 focus:ring-[#D97860] focus:border-transparent text-sm resize-none"
                    placeholder="Come possiamo aiutarti? Descrivi la tua domanda o preoccupazione..."
                  ></textarea>
                  <div className="text-right text-sm text-[#8B7355] mt-1">
                    {formData.message.length}/500 caratteri
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B52] transition-colors font-medium whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Invio in corso...' : 'Invia Messaggio'}
                </button>
              </form>
            </section>

            {/* Contact Information */}
            <section className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-[#E8E4E0] p-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-6">Mettiti in Contatto</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-[#D97860] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <i className="ri-whatsapp-line text-white text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#5C4B42] mb-1">WhatsApp</h3>
                      <p className="text-[#8B7355] mb-2">Risposte rapide per richieste urgenti</p>
                      <a 
                        href="https://wa.me/393508818666?text=Ciao!%20Ho%20una%20domanda%20su%20Mauluna%20Immobiliare" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={async () => {
                          try {
                            const { whatsappLeadsFunctions } = await import('@/lib/supabaseFunctions');
                            await whatsappLeadsFunctions.trackClick({
                              context: 'contact_page',
                              messagePreview: "Ciao! Ho una domanda su Mauluna Immobiliare",
                            });
                          } catch (err) {
                            // Silent fail
                          }
                        }}
                        className="text-[#D97860] hover:text-[#C86B52] font-medium cursor-pointer"
                      >
                        +39 350 881 8666
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-[#C9A876] rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <i className="ri-mail-line text-white text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#5C4B42] mb-1">Email</h3>
                      <p className="text-[#8B7355] mb-2">Per richieste dettagliate e supporto</p>
                      <a 
                        href="mailto:info@mauluna.it"
                        className="text-[#D97860] hover:text-[#C86B52] font-medium cursor-pointer"
                      >
                        info@mauluna.it
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F0E6D6] rounded-lg p-6">
                <h3 className="font-semibold text-[#5C4B42] mb-3">Domande Frequenti Su</h3>
                <ul className="space-y-2 text-sm text-[#8B7355]">
                  <li>• Come inserire un annuncio immobiliare</li>
                  <li>• Commissioni e tariffe (spoiler: non ce ne sono!)</li>
                  <li>• Processo di verifica delle proprietà</li>
                  <li>• Contatto diretto con acquirenti/venditori</li>
                  <li>• Informazioni sui quartieri di Roma</li>
                </ul>
              </div>

              <div className="bg-[#F9F6F3] rounded-lg p-6 border border-[#E8E4E0]">
                <h3 className="font-semibold text-[#5C4B42] mb-3">Siamo Qui per Te</h3>
                <p className="text-[#8B7355] mb-3">Il nostro team è sempre disponibile per aiutarti</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <i className="ri-customer-service-line text-[#D97860] mr-2"></i>
                    <span className="text-[#5C4B42] font-medium">Supporto dedicato</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-heart-line text-[#D97860] mr-2"></i>
                    <span className="text-[#5C4B42] font-medium">Assistenza personalizzata</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
