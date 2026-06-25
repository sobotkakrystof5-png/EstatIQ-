import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Back */}
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100"
        >
          <ArrowLeft size={15} />
          {t('common.backHome')}
        </Link>

        <h1 className="font-display mb-2 text-4xl font-bold text-surface-900 dark:text-surface-50">
          Podmínky použití
        </h1>
        <p className="mb-10 text-sm text-surface-400">Platné od 25. června 2026 · Verze 1.0</p>

        <div className="space-y-8 text-sm leading-relaxed text-surface-700 dark:text-surface-300">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">1. Smluvní strany a předmět smlouvy</h2>
            <p>
              Tyto podmínky použití (dále jen „Podmínky") upravují práva a povinnosti mezi provozovatelem služby EstatIQ (dále jen „Provozovatel") a uživatelem (dále jen „Uživatel") při užívání webové aplikace dostupné na adrese <strong>estatiq.app</strong> (dále jen „Služba").
            </p>
            <p className="mt-2">
              Registrací nebo užíváním Služby Uživatel potvrzuje, že si Podmínky přečetl, porozuměl jim a souhlasí s nimi. Pokud Uživatel s Podmínkami nesouhlasí, nesmí Službu užívat.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">2. Popis Služby</h2>
            <p>
              EstatIQ je platforma pro správu nájmů nemovitostí umožňující pronajímatelům a správcovským firmám spravovat nemovitosti, nájemníky, platby, dokumenty a energetické spotřeby. Nájemníkům poskytuje přehled jejich plateb a smluv.
            </p>
            <p className="mt-2">
              Provozovatel si vyhrazuje právo Službu průběžně rozvíjet, upravovat nebo omezit dostupnost jednotlivých funkcí bez předchozího upozornění, s výjimkou změn podstatně ovlivňujících placené tarify.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">3. Registrace a účet</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Uživatel musí být starší 18 let nebo jednat jménem právnické osoby.</li>
              <li>Uživatel je povinen uvádět pravdivé a aktuální údaje.</li>
              <li>Uživatel odpovídá za bezpečnost svého hesla a za veškeré aktivity provedené z jeho účtu.</li>
              <li>Jeden uživatel nesmí vytvářet více účtů za účelem obcházení limitů tarifu.</li>
              <li>Provozovatel může účet pozastavit nebo smazat při porušení Podmínek.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">4. Tarify a platby</h2>
            <p className="mb-3">Služba je dostupná ve variantách Free, Starter, Pro a Portfolio (B2C) a B2B tarifech. Aktuální ceník je na webu Provozovatele.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Předplatné se fakturuje měsíčně nebo ročně předem.</li>
              <li>Platby jsou zpracovávány prostřednictvím Stripe a řídí se jejich podmínkami.</li>
              <li>Při překročení limitu jednotek tarifu bude přidání dalších nemovitostí zablokováno.</li>
              <li>Při vypršení předplatného přejde účet do read-only režimu; data jsou zachována.</li>
              <li><strong>Spotřebitelé</strong> mají právo od smlouvy odstoupit do 14 dnů od uzavření, pokud dosud nebyla zahájena dodávka digitálního obsahu.</li>
              <li>Vrácení poplatků za nevyužité období není standardně poskytováno, s výjimkou prokázané technické závady na straně Provozovatele.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">5. Povinnosti Uživatele</h2>
            <p className="mb-2">Uživatel se zavazuje, že nebude:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>zneužívat Službu k protiprávní činnosti;</li>
              <li>sdílet přístupové údaje s neoprávněnými osobami;</li>
              <li>pokoušet se o neoprávněný přístup k datům jiných uživatelů;</li>
              <li>ohrožovat bezpečnost nebo dostupnost Služby;</li>
              <li>nahrávat soubory obsahující malware nebo škodlivý kód;</li>
              <li>porušovat práva třetích osob (autorská práva, ochrana osobních údajů).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">6. Odpovědnost a omezení</h2>
            <p className="mb-2">
              Provozovatel usiluje o maximální dostupnost Služby, ale nezaručuje nepřerušenou dostupnost. Provozovatel nenese odpovědnost za:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>škody způsobené výpadky třetích stran (Supabase, Stripe, Vercel);</li>
              <li>správnost dat zadaných Uživatelem;</li>
              <li>daňová a právní rozhodnutí Uživatele učiněná na základě dat ve Službě — ta neslouží jako daňové nebo právní poradenství;</li>
              <li>ztrátu dat způsobenou Uživatelem.</li>
            </ul>
            <p className="mt-2">
              Celková odpovědnost Provozovatele vůči Uživateli je omezena na výši předplatného uhrazeného za posledních 12 měsíců. Omezení se nevztahuje na škody způsobené úmyslně nebo hrubou nedbalostí.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">7. Ochrana osobních údajů</h2>
            <p>
              Zpracování osobních údajů se řídí{' '}
              <Link to="/zasady-ochrany-soukromi" className="text-emerald-600 dark:text-emerald-400">
                Zásadami ochrany osobních údajů
              </Link>
              , které jsou nedílnou součástí těchto Podmínek.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">8. Duševní vlastnictví</h2>
            <p>
              Veškerá práva k Službě, včetně softwaru, designu, loga a obsahu vytvořeného Provozovatelem, náleží Provozovateli. Uživatel získává nevýhradní, nepřenosné právo Službu užívat v souladu s těmito Podmínkami. Data vložená Uživatelem zůstávají majetkem Uživatele.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">9. Zánik smlouvy</h2>
            <p>
              Uživatel může účet kdykoli zrušit v nastavení (sekce GDPR / Smazat účet). Provozovatel může smlouvu vypovědět s 30denní výpovědní lhůtou nebo okamžitě při závažném porušení Podmínek.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">10. Rozhodné právo a řešení sporů</h2>
            <p>
              Tyto Podmínky se řídí právním řádem České republiky. Spory bude příslušný soud v České republice. Spotřebitelé mohou využít mimosoudní řešení sporů prostřednictvím České obchodní inspekce (<a href="https://www.coi.cz" className="text-emerald-600 dark:text-emerald-400" target="_blank" rel="noopener noreferrer">www.coi.cz</a>) nebo evropské platformy ODR (<a href="https://ec.europa.eu/consumers/odr" className="text-emerald-600 dark:text-emerald-400" target="_blank" rel="noopener noreferrer">ec.europa.eu/consumers/odr</a>).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">11. Změny Podmínek</h2>
            <p>
              O podstatných změnách vás informujeme e-mailem nejméně 30 dní předem. Pokračováním v užívání Služby po nabytí účinnosti změn vyjadřujete souhlas s novými Podmínkami.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">12. Kontakt</h2>
            <p>
              Dotazy k těmto Podmínkám zasílejte na{' '}
              <a href="mailto:info@estatiq.app" className="text-emerald-600 dark:text-emerald-400">info@estatiq.app</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-surface-100 pt-8 dark:border-surface-800">
          <div className="flex flex-wrap gap-4 text-xs text-surface-400">
            <Link to="/zasady-ochrany-soukromi" className="hover:text-surface-600 dark:hover:text-surface-300">
              Zásady ochrany osobních údajů
            </Link>
            <Link to="/" className="hover:text-surface-600 dark:hover:text-surface-300">
              Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
