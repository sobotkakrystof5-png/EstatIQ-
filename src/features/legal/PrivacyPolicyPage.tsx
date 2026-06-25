import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          Zásady ochrany osobních údajů
        </h1>
        <p className="mb-10 text-sm text-surface-400">Platné od 25. června 2026 · Verze 1.0</p>

        <div className="prose prose-surface dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-surface-700 dark:text-surface-300">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">1. Správce osobních údajů</h2>
            <p>
              Správcem osobních údajů ve smyslu čl. 4 odst. 7 nařízení Evropského parlamentu a Rady (EU) 2016/679 (dále jen „GDPR") je:
            </p>
            <div className="mt-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
              <p><strong>EstatIQ</strong></p>
              <p>E-mail: <a href="mailto:info@estatiq.app" className="text-emerald-600 dark:text-emerald-400">info@estatiq.app</a></p>
              <p>Kontakt pro ochranu osobních údajů: <a href="mailto:gdpr@estatiq.app" className="text-emerald-600 dark:text-emerald-400">gdpr@estatiq.app</a></p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">2. Jaké osobní údaje zpracováváme</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Identifikační údaje:</strong> jméno, příjmení, e-mailová adresa</li>
              <li><strong>Kontaktní údaje:</strong> telefonní číslo, adresa</li>
              <li><strong>Smluvní údaje:</strong> údaje z nájemních smluv, výše nájmu, termíny plateb</li>
              <li><strong>Finanční údaje:</strong> záznamy o platbách, výdajích (bez čísla platební karty)</li>
              <li><strong>Technické údaje:</strong> IP adresa, typ prohlížeče, časy přihlášení</li>
              <li><strong>Údaje o nemovitostech:</strong> adresy, energetické spotřeby, dokumenty</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">3. Účel a právní základ zpracování</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-700">
                    <th className="pb-2 pr-4 text-left font-semibold">Účel</th>
                    <th className="pb-2 pr-4 text-left font-semibold">Právní základ (čl. 6 GDPR)</th>
                    <th className="pb-2 text-left font-semibold">Doba uchování</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  <tr>
                    <td className="py-2 pr-4">Poskytování služby (správa nájmů)</td>
                    <td className="py-2 pr-4">Plnění smlouvy (čl. 6 odst. 1 písm. b)</td>
                    <td className="py-2">Po dobu trvání účtu</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Finanční záznamy, daňové doklady</td>
                    <td className="py-2 pr-4">Právní povinnost (čl. 6 odst. 1 písm. c)</td>
                    <td className="py-2">10 let (zákon č. 563/1991 Sb.)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Zasílání upomínek a notifikací</td>
                    <td className="py-2 pr-4">Plnění smlouvy (čl. 6 odst. 1 písm. b)</td>
                    <td className="py-2">Po dobu trvání nájmu</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Bezpečnost a prevence podvodů</td>
                    <td className="py-2 pr-4">Oprávněný zájem (čl. 6 odst. 1 písm. f)</td>
                    <td className="py-2">5 let</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Analytika a zlepšování produktu</td>
                    <td className="py-2 pr-4">Souhlas (čl. 6 odst. 1 písm. a)</td>
                    <td className="py-2">Do odvolání souhlasu</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">4. Příjemci osobních údajů</h2>
            <p className="mb-3">Vaše osobní údaje sdílíme pouze s důvěryhodnými zpracovateli v rozsahu nezbytném pro poskytování služby:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Supabase Inc.</strong> (USA) – databáze a autentizace; Standard Contractual Clauses</li>
              <li><strong>Vercel Inc.</strong> (USA) – hosting aplikace; Standard Contractual Clauses</li>
              <li><strong>Stripe Inc.</strong> (USA) – zpracování plateb; Standard Contractual Clauses</li>
              <li><strong>Resend Inc.</strong> (USA) – e-mailová komunikace; Standard Contractual Clauses</li>
              <li><strong>ČÚZK</strong> (ČR) – ověřování vlastnictví nemovitostí v katastru</li>
            </ul>
            <p className="mt-3">Osobní údaje neprodáváme ani neposkytujeme třetím stranám k marketingovým účelům.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">5. Přenos osobních údajů do třetích zemí</h2>
            <p>
              Někteří zpracovatelé sídlí ve Spojených státech amerických. Přenos je zajištěn prostřednictvím Standardních smluvních doložek schválených Evropskou komisí (čl. 46 odst. 2 GDPR).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">6. Vaše práva</h2>
            <p className="mb-3">Jako subjekt údajů máte tato práva:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Právo na přístup</strong> (čl. 15) – požádat o kopii vašich dat (funkce Export dat v nastavení)</li>
              <li><strong>Právo na opravu</strong> (čl. 16) – opravit nepřesné údaje v nastavení profilu</li>
              <li><strong>Právo na výmaz</strong> (čl. 17) – smazat účet (funkce v nastavení; finanční záznamy jsou anonymizovány, nikoli vymazány)</li>
              <li><strong>Právo na přenositelnost</strong> (čl. 20) – stáhnout data ve formátu JSON</li>
              <li><strong>Právo na omezení zpracování</strong> (čl. 18) – kontaktujte nás na gdpr@estatiq.app</li>
              <li><strong>Právo vznést námitku</strong> (čl. 21) – proti zpracování na základě oprávněného zájmu</li>
              <li><strong>Odvolání souhlasu</strong> – kdykoli, bez dopadu na zákonnost předchozího zpracování</li>
            </ul>
            <p className="mt-3">
              Práva uplatňujte na <a href="mailto:gdpr@estatiq.app" className="text-emerald-600 dark:text-emerald-400">gdpr@estatiq.app</a>. Odpovíme do 30 dnů. Máte také právo podat stížnost u Úřadu pro ochranu osobních údajů (<a href="https://www.uoou.cz" className="text-emerald-600 dark:text-emerald-400" target="_blank" rel="noopener noreferrer">www.uoou.cz</a>).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">7. Soubory cookie</h2>
            <p className="mb-3">Používáme tyto kategorie cookies:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Nezbytné cookies</strong> – autentizace (Supabase session), nastavení jazyka a tématu. Právní základ: oprávněný zájem. Nelze odmítnout.</li>
              <li><strong>Analytické cookies</strong> – anonymizovaná analytika pro zlepšení produktu. Právní základ: souhlas. Nastavte v cookie banneru.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">8. Zabezpečení</h2>
            <p>
              Osobní údaje chráníme pomocí šifrování přenosu (TLS 1.3), šifrování v klidu (AES-256), Row Level Security na úrovni databáze, dvoufaktorového ověření pro B2B účty a pravidelných bezpečnostních auditů. Přístup k datům mají pouze oprávnění zaměstnanci a subdodavatelé vázaní mlčenlivostí.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">9. Změny těchto zásad</h2>
            <p>
              O podstatných změnách vás budeme informovat e-mailem nejméně 30 dní předem. Aktuální verze je vždy dostupná na této stránce.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-surface-900 dark:text-surface-50">10. Kontakt</h2>
            <p>
              Dotazy k ochraně osobních údajů zasílejte na{' '}
              <a href="mailto:gdpr@estatiq.app" className="text-emerald-600 dark:text-emerald-400">gdpr@estatiq.app</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-surface-100 pt-8 dark:border-surface-800">
          <div className="flex flex-wrap gap-4 text-xs text-surface-400">
            <Link to="/podminky-pouziti" className="hover:text-surface-600 dark:hover:text-surface-300">
              Podmínky použití
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
