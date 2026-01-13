'use client';


import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <title>Informativa Privacy - MAULUNA IMMOBILIARE Roma | Protezione Dati Personali</title>
      <meta name="description" content="Informativa Privacy MAULUNA IMMOBILIARE Roma - Scopri come proteggiamo i tuoi dati personali sulla nostra piattaforma immobiliare. Trasparenza, sicurezza e rispetto della privacy per proprietari e acquirenti." />
      <meta name="keywords" content="privacy policy Roma, protezione dati immobiliari, GDPR immobiliare, sicurezza dati proprietà, privacy piattaforma immobiliare" />
      <link rel="canonical" href="https://mauluna.it/privacy" />
      <meta name="geo.region" content="IT-RM" />
      <meta name="geo.placename" content="Roma" />
      <meta name="geo.position" content="41.9028;12.4964" />
      <meta property="og:title" content="Informativa Privacy - MAULUNA IMMOBILIARE Roma" />
      <meta property="og:description" content="Informativa Privacy completa per la piattaforma immobiliare MAULUNA IMMOBILIARE Roma. Protezione dati, trasparenza e sicurezza." />
      <meta property="og:url" content="https://mauluna.it/privacy" />
      <meta property="og:type" content="website" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Informativa Privacy - MAULUNA IMMOBILIARE Roma",
            "description": "Informativa Privacy completa per MAULUNA IMMOBILIARE Roma - Scopri come proteggiamo i tuoi dati personali sulla nostra piattaforma immobiliare romana.",
            "url": "https://mauluna.it/privacy",
            "inLanguage": "it-IT",
            "isPartOf": {
              "@type": "WebSite",
              "name": "MAULUNA IMMOBILIARE",
              "url": "https://mauluna.it"
            },
            "about": {
              "@type": "Organization",
              "name": "MAULUNA IMMOBILIARE",
              "description": "Piattaforma immobiliare Roma senza commissioni"
            }
          })
        }}
      />

      <div className="min-h-screen bg-[#F5F7FA]">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-[#5C4B42] mb-4">Informativa sulla Privacy</h1>
            <p className="text-[#8B7355]">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
          </header>

          <div className="bg-white rounded-lg shadow-sm border border-[#E8E4E0] p-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">1. Introduzione</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  <strong>MAULUNA IMMOBILIARE</strong> ("noi", "nostro" o "ci") è impegnata nella protezione della tua privacy. 
                  La nostra missione è rivoluzionare il mercato immobiliare romano eliminando le commissioni eccessive 
                  e creando una piattaforma immobiliare trasparente che connette direttamente proprietari e acquirenti a Roma.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Questa Informativa sulla Privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo 
                  le tue informazioni quando visiti il nostro sito web e utilizzi i nostri servizi di piattaforma immobiliare romana.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">2. Titolare del Trattamento</h2>
                <div className="bg-[#F0E6D6] rounded-lg p-4 mb-4">
                  <p className="text-[#5C4B42] font-medium mb-2">MAULUNA IMMOBILIARE</p>
                  <p className="text-[#8B7355]">Sede: Roma, Italia</p>
                  <p className="text-[#8B7355]">Email: info@mauluna.it</p>
                  <p className="text-[#8B7355]">WhatsApp: +39 350 881 8666</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">3. Dati Personali Raccolti</h2>
                
                <h3 className="text-xl font-medium text-[#5C4B42] mb-3">Dati di Registrazione</h3>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Raccogliamo i dati personali che ci fornisci volontariamente quando:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Ti registri per un account sulla nostra piattaforma immobiliare romana</li>
                  <li>Inserisci un annuncio immobiliare a Roma</li>
                  <li>Ci contatti attraverso i nostri moduli di contatto</li>
                  <li>Ti iscrivi alla nostra newsletter immobiliare</li>
                  <li>Comunichi con noi tramite WhatsApp o email</li>
                  <li>Richiedi informazioni su proprietà immobiliari a Roma</li>
                </ul>

                <h3 className="text-xl font-medium text-[#5C4B42] mb-3">Dati degli Immobili</h3>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Quando inserisci una proprietà immobiliare sulla nostra piattaforma romana, raccogliamo informazioni 
                  come dettagli dell'immobile, fotografie, ubicazione a Roma, prezzo, caratteristiche della proprietà 
                  e le tue informazioni di contatto per permettere ai potenziali acquirenti di raggiungerti direttamente, 
                  eliminando così le commissioni immobiliari tradizionali.
                </p>

                <h3 className="text-xl font-medium text-[#5C4B42] mb-3">Dati di Navigazione</h3>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Raccogliamo automaticamente alcune informazioni quando visiti la nostra piattaforma immobiliare, 
                  inclusi indirizzo IP, tipo di browser, sistema operativo, pagine visitate e comportamento di navigazione 
                  per migliorare l'esperienza immobiliare romana.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">4. Finalità del Trattamento</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Utilizziamo i dati raccolti per le seguenti finalità immobiliari:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Fornire e mantenere i nostri servizi di piattaforma immobiliare romana</li>
                  <li>Elaborare e visualizzare annunci immobiliari a Roma</li>
                  <li>Facilitare la comunicazione diretta tra proprietari e potenziali acquirenti</li>
                  <li>Eliminare le commissioni immobiliari attraverso il contatto diretto</li>
                  <li>Inviarti aggiornamenti sui tuoi annunci immobiliari e notifiche della piattaforma</li>
                  <li>Migliorare la nostra piattaforma immobiliare e i servizi per il mercato romano</li>
                  <li>Rispettare gli obblighi legali nel settore immobiliare</li>
                  <li>Prevenire frodi e garantire la sicurezza delle transazioni immobiliari</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">5. Base Giuridica del Trattamento</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Il trattamento dei tuoi dati personali si basa su:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li><strong>Consenso:</strong> Per l'invio di newsletter e comunicazioni promozionali immobiliari</li>
                  <li><strong>Esecuzione del contratto:</strong> Per fornire i servizi della piattaforma immobiliare</li>
                  <li><strong>Interesse legittimo:</strong> Per migliorare i nostri servizi immobiliari romani</li>
                  <li><strong>Obbligo legale:</strong> Per rispettare le normative del settore immobiliare</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">6. Condivisione dei Dati</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  <strong>Modello di Contatto Diretto:</strong> La nostra piattaforma immobiliare romana è progettata 
                  per connettere direttamente proprietari e potenziali acquirenti, eliminando le commissioni immobiliari. 
                  Quando inserisci una proprietà, le tue informazioni di contatto (telefono e/o email) saranno visibili 
                  agli interessati per facilitare la comunicazione diretta.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Non vendiamo, scambiamo o affittiamo le tue informazioni personali a terzi. 
                  Possiamo condividere i tuoi dati solo nelle seguenti circostanze:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Con il tuo consenso esplicito</li>
                  <li>Per rispettare obblighi legali nel settore immobiliare</li>
                  <li>Per proteggere i nostri diritti e la sicurezza della piattaforma</li>
                  <li>In caso di trasferimento aziendale o fusione</li>
                  <li>Con fornitori di servizi che supportano la nostra piattaforma immobiliare</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">7. Sicurezza dei Dati</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Implementiamo misure di sicurezza tecniche e organizzative appropriate per proteggere 
                  le tue informazioni personali contro accesso non autorizzato, alterazione, divulgazione o distruzione. 
                  La sicurezza dei dati immobiliari è fondamentale per la nostra piattaforma romana.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Tuttavia, nessun metodo di trasmissione su Internet è sicuro al 100%. 
                  Ci impegniamo a proteggere i tuoi dati immobiliari con le migliori pratiche di sicurezza disponibili.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">8. I Tuoi Diritti (GDPR)</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Secondo il Regolamento Generale sulla Protezione dei Dati (GDPR), hai i seguenti diritti:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li><strong>Diritto di accesso:</strong> Accedere ai tuoi dati personali immobiliari</li>
                  <li><strong>Diritto di rettifica:</strong> Correggere informazioni inesatte o incomplete</li>
                  <li><strong>Diritto di cancellazione:</strong> Richiedere la cancellazione dei tuoi dati</li>
                  <li><strong>Diritto di limitazione:</strong> Limitare il trattamento dei tuoi dati</li>
                  <li><strong>Diritto di portabilità:</strong> Ricevere i tuoi dati in formato strutturato</li>
                  <li><strong>Diritto di opposizione:</strong> Opporti al trattamento dei tuoi dati</li>
                  <li><strong>Diritto di revoca:</strong> Revocare il consenso in qualsiasi momento</li>
                </ul>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Per esercitare questi diritti, contattaci all'indirizzo info@mauluna.it
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">9. Cookie e Tecnologie di Tracciamento</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Utilizziamo cookie e tecnologie di tracciamento simili per migliorare la tua esperienza 
                  di navigazione sulla nostra piattaforma immobiliare romana, analizzare il traffico del sito web 
                  e comprendere le preferenze degli utenti interessati al mercato immobiliare di Roma.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Puoi controllare le impostazioni dei cookie attraverso le preferenze del tuo browser. 
                  La disabilitazione dei cookie potrebbe limitare alcune funzionalità della piattaforma immobiliare.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">10. Servizi di Terze Parti</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  La nostra piattaforma immobiliare può contenere link a siti web di terze parti o integrare 
                  servizi di terze parti (come Google Maps per la localizzazione delle proprietà immobiliari a Roma). 
                  Non siamo responsabili per le pratiche di privacy di queste terze parti.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">11. Conservazione dei Dati</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Conserviamo i tuoi dati personali solo per il tempo necessario a soddisfare le finalità 
                  descritte in questa Informativa sulla Privacy, a meno che un periodo di conservazione più lungo 
                  non sia richiesto dalla legge o necessario per la gestione della piattaforma immobiliare romana.
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Dati di registrazione: Per tutta la durata dell'account</li>
                  <li>Annunci immobiliari: Fino alla cancellazione dell'annuncio</li>
                  <li>Dati di navigazione: Massimo 24 mesi</li>
                  <li>Comunicazioni: Secondo gli obblighi legali</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">12. Privacy dei Minori</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  I nostri servizi immobiliari non sono destinati a persone di età inferiore ai 18 anni. 
                  Non raccogliamo consapevolmente informazioni personali da minori di 18 anni. 
                  Se veniamo a conoscenza di aver raccolto dati di un minore, procederemo immediatamente alla cancellazione.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">13. Trasferimenti Internazionali</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  I tuoi dati personali sono trattati principalmente all'interno dell'Unione Europea. 
                  Eventuali trasferimenti verso paesi terzi avverranno solo con adeguate garanzie di protezione 
                  secondo il GDPR e le normative europee sulla protezione dei dati.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">14. Modifiche a questa Informativa</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Possiamo aggiornare questa Informativa sulla Privacy di tanto in tanto per riflettere 
                  cambiamenti nei nostri servizi immobiliari o nelle normative applicabili. 
                  Ti notificheremo eventuali modifiche pubblicando la nuova Informativa su questa pagina 
                  e aggiornando la data di "Ultimo aggiornamento".
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Ti consigliamo di rivedere periodicamente questa Informativa per rimanere informato 
                  su come proteggiamo i tuoi dati sulla nostra piattaforma immobiliare romana.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">15. Autorità di Controllo</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Hai il diritto di presentare un reclamo all'autorità di controllo competente se ritieni 
                  che il trattamento dei tuoi dati personali violi il GDPR. In Italia, l'autorità competente è:
                </p>
                <div className="bg-[#F0E6D6] rounded-lg p-4 mb-4">
                  <p className="text-[#5C4B42] font-medium mb-2">Garante per la Protezione dei Dati Personali</p>
                  <p className="text-[#8B7355]">Sito web: www.gpdp.it</p>
                  <p className="text-[#8B7355]">Email: garante@gpdp.it</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">16. Contattaci</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Se hai domande su questa Informativa sulla Privacy, sui nostri servizi immobiliari romani 
                  o sulle nostre pratiche di protezione dei dati, non esitare a contattarci:
                </p>
                <div className="bg-[#F0E6D6] rounded-lg p-4">
                  <p className="text-[#5C4B42] font-medium mb-2">MAULUNA IMMOBILIARE</p>
                  <p className="text-[#8B7355]">Email: info@mauluna.it</p>
                  <p className="text-[#8B7355]">WhatsApp: +39 350 881 8666</p>
                  <p className="text-[#8B7355]">Sede: Roma, Italia</p>
                  <p className="text-[#8B7355] mt-2 text-sm">
                    Risponderemo alle tue richieste entro 30 giorni come previsto dal GDPR.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
