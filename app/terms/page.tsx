
'use client';

import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Termini e Condizioni - MAULUNA IMMOBILIARE Roma",
            "description": "Termini e Condizioni di MAULUNA IMMOBILIARE - Piattaforma immobiliare Roma senza commissioni. Leggi i nostri termini di servizio per l'utilizzo della nostra piattaforma immobiliare romana.",
            "url": "https://mauluna.it/terms",
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
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-[#5C4B42] mb-4">Termini e Condizioni</h1>
            <p className="text-[#8B7355]">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
          </header>

          <div className="bg-white rounded-lg shadow-sm border border-[#E8E4E0] p-8">
            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">1. Accettazione dei Termini</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Accedendo e utilizzando il sito web e i servizi di MAULUNA IMMOBILIARE, accetti e 
                  acconsenti ad essere vincolato dai termini e dalle disposizioni del presente accordo. 
                  Se non accetti di rispettare quanto sopra, ti preghiamo di non utilizzare questo servizio.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">2. Descrizione del Servizio</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  MAULUNA IMMOBILIARE è una piattaforma immobiliare innovativa che connette direttamente 
                  i proprietari di immobili con potenziali acquirenti e locatari a Roma, Italia. 
                  Il nostro servizio opera con un <strong>modello 0% commissioni</strong>, facilitando 
                  la comunicazione diretta tra le parti e rivoluzionando il mercato immobiliare romano.
                </p>
                
                <h3 className="text-xl font-medium text-[#5C4B42] mb-3">Caratteristiche Principali:</h3>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Piattaforma di annunci immobiliari per proprietà romane</li>
                  <li>Contatto diretto tra proprietari e interessati</li>
                  <li>Nessuna commissione per le transazioni</li>
                  <li>Ricerca e filtri avanzati per proprietà</li>
                  <li>Mappa interattiva delle proprietà a Roma</li>
                  <li>Sistema di valutazione e recensioni</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">3. Responsabilità degli Utenti</h2>
                
                <h3 className="text-xl font-medium text-[#5C4B42] mb-3">Proprietari di Immobili</h3>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Inserendo un annuncio immobiliare, accetti di:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Fornire informazioni accurate e veritiere sulla tua proprietà</li>
                  <li>Caricare foto genuine e aggiornate dell'immobile</li>
                  <li>Mantenere informazioni di contatto correnti e aggiornate</li>
                  <li>Rispondere alle richieste in modo tempestivo e professionale</li>
                  <li>Rispettare tutte le leggi e i regolamenti applicabili</li>
                  <li>Rimuovere gli annunci quando le proprietà non sono più disponibili</li>
                  <li>Indicare chiaramente il prezzo di vendita o affitto</li>
                  <li>Specificare tutte le caratteristiche rilevanti dell'immobile</li>
                </ul>

                <h3 className="text-xl font-medium text-[#5C4B42] mb-3">Cercatori di Immobili</h3>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Utilizzando la nostra piattaforma per trovare proprietà, accetti di:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Contattare i proprietari in modo rispettoso e professionale</li>
                  <li>Fornire informazioni accurate su te stesso quando fai richieste</li>
                  <li>Non utilizzare impropriamente le informazioni di contatto per spam</li>
                  <li>Rispettare i tempi e la disponibilità dei proprietari</li>
                  <li>Essere onesto riguardo alle tue intenzioni di acquisto o affitto</li>
                  <li>Rispettare gli appuntamenti concordati per le visite</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">4. Usi Vietati</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Non puoi utilizzare il nostro servizio:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Per scopi illegali o per sollecitare altri a compiere atti illegali</li>
                  <li>Per violare regolamenti internazionali, federali, provinciali, statali o locali</li>
                  <li>Per violare i nostri diritti di proprietà intellettuale o quelli di terzi</li>
                  <li>Per molestare, abusare, insultare, danneggiare, diffamare o discriminare</li>
                  <li>Per inviare informazioni false o fuorvianti</li>
                  <li>Per caricare virus o codice dannoso</li>
                  <li>Per attività di spam, phishing o scraping</li>
                  <li>Per scopi osceni o immorali</li>
                  <li>Per pubblicare annunci duplicati o falsi</li>
                  <li>Per aggirare il sistema di contatto diretto</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">5. Politica Zero Commissioni</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  MAULUNA IMMOBILIARE opera con un <strong>modello 0% commissioni</strong>. Non addebitiamo 
                  alcuna commissione per gli annunci immobiliari o per le transazioni completate con successo. 
                  Tutte le negoziazioni e transazioni avvengono direttamente tra proprietari e parti interessate.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  <strong>Importante:</strong> Mentre facilitiamo le connessioni, non siamo parte di 
                  alcun accordo o transazione tra utenti. Tutte le responsabilità legali e finanziarie 
                  rimangono con le parti coinvolte. La nostra missione è eliminare le commissioni 
                  immobiliari tradizionali e democratizzare l'accesso al mercato immobiliare romano.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">6. Contenuti e Proprietà Intellettuale</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Mantieni la proprietà di qualsiasi contenuto che invii sulla nostra piattaforma. 
                  Tuttavia, inviando contenuti, ci concedi una licenza non esclusiva, mondiale e 
                  gratuita per utilizzare, visualizzare e distribuire i tuoi contenuti sulla nostra piattaforma.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Tutti gli altri contenuti del nostro sito web, inclusi ma non limitati a testo, 
                  grafica, loghi e software, sono proprietà di MAULUNA IMMOBILIARE e sono protetti 
                  da copyright e altre leggi sulla proprietà intellettuale.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">7. Esclusione di Garanzie</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Il nostro servizio è fornito "così com'è" senza alcuna dichiarazione o garanzia, 
                  espressa o implicita. Non forniamo dichiarazioni o garanzie in relazione a questo 
                  sito web o alle informazioni e materiali forniti su questo sito web.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Non garantiamo che:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Il sito web sarà costantemente disponibile</li>
                  <li>Le informazioni su questo sito web siano complete, vere o accurate</li>
                  <li>Gli annunci immobiliari siano accurati o aggiornati</li>
                  <li>Le transazioni tra utenti saranno sempre di successo</li>
                  <li>La piattaforma sia priva di errori o interruzioni</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">8. Limitazione di Responsabilità</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  MAULUNA IMMOBILIARE non sarà responsabile per danni indiretti, incidentali, speciali, 
                  consequenziali o punitivi, inclusi senza limitazione, perdita di profitti, dati, 
                  uso, goodwill o altre perdite intangibili, risultanti dal tuo uso del servizio.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Non siamo responsabili per:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>L'accuratezza degli annunci immobiliari o delle informazioni fornite dagli utenti</li>
                  <li>Dispute tra utenti</li>
                  <li>Transazioni o negoziazioni fallite</li>
                  <li>Questioni legali derivanti da transazioni immobiliari</li>
                  <li>Attività fraudolente da parte degli utenti</li>
                  <li>Problemi con la qualità o condizione degli immobili</li>
                  <li>Perdite finanziarie derivanti da investimenti immobiliari</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">9. Indennizzo</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Accetti di difendere, indennizzare e tenere indenne MAULUNA IMMOBILIARE e le sue 
                  affiliate da e contro qualsiasi rivendicazione, danno, obbligo, perdita, 
                  responsabilità, costo o debito, e spese (incluse ma non limitate alle spese legali).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">10. Risoluzione del Contratto</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Possiamo terminare o sospendere il tuo account e impedire l'accesso al servizio 
                  immediatamente, senza preavviso o responsabilità, a nostra esclusiva discrezione, 
                  per qualsiasi motivo e senza limitazione, inclusa ma non limitata a una violazione dei Termini.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Motivi per la risoluzione includono:
                </p>
                <ul className="list-disc list-inside text-[#8B7355] mb-4 space-y-1">
                  <li>Violazione dei presenti Termini e Condizioni</li>
                  <li>Pubblicazione di annunci falsi o fuorvianti</li>
                  <li>Comportamento inappropriato verso altri utenti</li>
                  <li>Attività fraudolente o illegali</li>
                  <li>Uso improprio della piattaforma</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">11. Legge Applicabile</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Questi Termini saranno interpretati e governati dalle leggi d'Italia. Qualsiasi 
                  disputa relativa a questi Termini sarà soggetta alla giurisdizione esclusiva 
                  dei tribunali di Roma, Italia.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Per controversie immobiliari specifiche, si applicano le normative italiane 
                  relative alle transazioni immobiliari e alla protezione dei consumatori.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">12. Modifiche ai Termini</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Ci riserviamo il diritto, a nostra esclusiva discrezione, di modificare o sostituire 
                  questi Termini in qualsiasi momento. Se una revisione è sostanziale, forniremo 
                  almeno 30 giorni di preavviso prima che i nuovi termini entrino in vigore.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  È tua responsabilità rivedere periodicamente questi Termini per eventuali modifiche. 
                  L'uso continuato del nostro servizio dopo la pubblicazione di modifiche costituisce 
                  accettazione di tali modifiche.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">13. Risoluzione delle Controversie</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Incoraggiamo la risoluzione amichevole delle controversie. In caso di dispute 
                  tra utenti, MAULUNA IMMOBILIARE può fornire assistenza nella mediazione, ma 
                  non è obbligata a farlo.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Per controversie che non possono essere risolte amichevolmente, le parti 
                  possono ricorrere alla mediazione o all'arbitrato secondo le procedure 
                  stabilite dalla Camera di Commercio di Roma.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">14. Informazioni di Contatto</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Se hai domande su questi Termini e Condizioni, ti preghiamo di contattarci:
                </p>
                <div className="bg-[#F0E6D6] rounded-lg p-6">
                  <p className="text-[#5C4B42] font-bold text-lg mb-3">MAULUNA IMMOBILIARE</p>
                  <div className="space-y-2">
                    <p className="text-[#8B7355] flex items-center">
                      <i className="ri-mail-line mr-2"></i>
                      <strong>Email:</strong> info@mauluna.it
                    </p>
                    <p className="text-[#8B7355] flex items-center">
                      <i className="ri-whatsapp-line mr-2"></i>
                      <strong>WhatsApp:</strong> +39 350 881 8666
                    </p>
                    <p className="text-[#8B7355] flex items-center">
                      <i className="ri-map-pin-line mr-2"></i>
                      <strong>Sede:</strong> Roma, Italia
                    </p>
                    <p className="text-[#8B7355] flex items-center">
                      <i className="ri-time-line mr-2"></i>
                      <strong>Orari:</strong> Lunedì - Venerdì: 9:00 - 18:00
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-[#5C4B42] mb-4">15. Disposizioni Finali</h2>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Se una qualsiasi disposizione di questi Termini è ritenuta non valida o 
                  inapplicabile, tale disposizione sarà eliminata o limitata al minimo necessario, 
                  e le restanti disposizioni di questi Termini rimarranno in pieno vigore ed effetto.
                </p>
                <p className="text-[#8B7355] leading-relaxed mb-4">
                  Questi Termini costituiscono l'intero accordo tra te e MAULUNA IMMOBILIARE 
                  riguardo all'uso del nostro servizio e sostituiscono tutti gli accordi 
                  precedenti e contemporanei relativi a tale oggetto.
                </p>
                <p className="text-[#8B7355] leading-relaxed">
                  <strong>Grazie per aver scelto MAULUNA IMMOBILIARE - Rivoluzionando il 
                  mercato immobiliare romano dal 2024!</strong>
                </p>
              </section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
