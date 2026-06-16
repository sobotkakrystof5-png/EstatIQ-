# CLAUDE.md — Pravidla projektu EstatIQ

> Tento soubor je **stálý zákoník**. Čteš ho na začátku každé session a držíš se ho po celou dobu práce na EstatIQ. Když je cokoli v rozporu mezi tímto souborem a jednorázovým zadáním, ptej se — pravidla zde mají přednost, dokud je společně nezměníme.

---

## 0. Kdo jsi na tomto projektu

Pracuješ ve třech rolích současně a žádnou neošidíš:
- **Senior full-stack engineer** — čistý, striktně typovaný, modulární a testovatelný kód.
- **UI/UX designér (Fintech/SaaS)** — vizuál „Apple × Stripe": minimalismus, důvěra, klid, dokonalé detaily.
- **Conversion copywriter** — každý nadpis, tlačítko i prázdný stav má znít sebevědomě a lidsky.

Sebeobraz výsledku: uživatel po otevření řekne **„Tohle chci používat každý den."**

---

## 1. Produkt a cílové segmenty

**EstatIQ — „Pronájem, který se řídí sám."** PropTech platforma, která řeší fragmentaci správy nájmů (Excel, WhatsApp, papírové faktury) a vytváří **Single Source of Truth** pro celý životní cyklus nájmu. Web + později iOS/Android. Cíl emoce: *klid*.

**Cílové segmenty:**
- **B2C — Drobný pronajímatel:** 1 až 30 jednotek. Chce autonomii bez papírování.
- **B2B — Správcovská firma:** Profesionálové spravující stovky jednotek pro různé vlastníky. Klíčový pro monetizaci.
- **Nájemník:** Zdarma, jen na pozvánku. Transparentní přehled plateb a spotřeby.

---

## 2. Role hierarchy a přístupová práva

Tato hierarchie musí být vynucená na úrovni RLS i UI — ne jen vizuálně.

| Role | Kdo | Co vidí / může |
|---|---|---|
| **Super-Admin** | B2B interní | Celé portfolio firmy, globální metriky (obsazenost, celkový příjem), správa uživatelů |
| **Správce** | B2B zaměstnanec | Pouze přiřazené objekty a nájemníci |
| **Vlastník / Klient** | B2B klient firmy | Read-only portál svých objektů — náhrada za měsíční PDF reporty |
| **Pronajímatel** | B2C platící uživatel | Vlastní nemovitosti, nájemníci, platby, dokumenty, energie |
| **Nájemník** | Pozvaný uživatel | Pouze své platby, smlouvy a hlášení závad |

Každý databázový dotaz musí respektovat tuto hierarchii přes RLS policy — nikdy nesdílej data napříč organizacemi nebo uživateli.

---

## 3. Byznys logika — automatizované workflow

Toto je jádro produktové hodnoty. Implementuj jako Edge Functions nebo cron jobs (Supabase scheduled functions), ne jako ad-hoc logiku v UI.

### 3A. Platební engine

**Auto-generování plateb:**
- 1. každého měsíce (nebo dle data ve smlouvě) systém automaticky vytvoří záznam `Payment` se stavem `pending`.
- Každá platba nese: `amount`, `due_date`, `lease_id`, `qr_payload` (CZ QR SPD formát), `variable_symbol`.

**Upomínkový automat (Resend + Edge Function):**

| Čas | Akce |
|---|---|
| `due_date - 5 dní` | E-mail nájemníkovi s QR kódem a CTA „Zaplaťte jedním klikem" |
| `due_date` | Automatická validace stavu platby |
| `due_date + 7 dní` | 1. ostrá upomínka nájemníkovi (tón: věcný, ne agresivní) |
| `due_date + 14 dní` | Notifikace pronajímateli k osobní intervenci |

Všechny e-maily přes React Email šablony s i18n podporou.

**Daňový modul — export:**
- PDF a CSV export musí být strukturován tak, aby jej účetní mohl přímo použít pro daňové přiznání.
- Povinný rozpis: po nemovitostech × po měsících, součty, DPH (pokud relevantní).
- Kategorie výdajů (`Expense`): opravy, pojistné, služby, správa — každý výdaj s daňovou uznatelností (ano/ne/paušál 30 %).

### 3B. Energetický audit

- **MVP:** ruční zadávání stavů měřičů (elektřina, plyn, voda) do entity `EnergyReading`.
- **Příprava na Fázi 2:** sloupce `meter_id`, `provider` (ČEZ / E.ON / PRE / jiný) pro budoucí API napojení.
- **Detekce anomálií:** pokud měsíční spotřeba překročí 12měsíční klouzavý průměr o více než **30 %**, systém automaticky vytvoří `Notification` s typem `energy_anomaly` a upozorní pronajímatele. Prevence havárií a úniků.

### 3C. Dokumenty a compliance

**Kategorie dokumentů** (striktně dodržuj v UI i v DB):
`nájemní_smlouva | předávací_protokol | pojistka | faktura | korespondence | revize | jiné`

**Alert systém expirace:**
- Notifikace 60, 30 a 14 dní před vypršením smlouvy, pojistky nebo revize.
- Implementováno jako scheduled Edge Function, záznamy v `Notification`.

### 3D. Onboarding wizard

Nový pronajímatel musí projít přesně **4 kroky** — nezkracuj, nepřeskakuj:
1. **Nemovitost** — přidat první property (název, adresa, typ)
2. **Nájem** — vytvořit lease (nájemník, částka, datum)
3. **Pozvánka nájemníka** — odeslat invite token (72 h platnost, jednorázový)
4. **Dashboard** — přivítat uživatele, ukázat první widget s přehledem

Wizard je povinný při prvním přihlášení, přeskočitelný pouze B2B rolemi.

---

## 4. Monetizace — tarify a subscription enforcement

Systém musí **aktivně vynucovat limity** na úrovni backendu (Edge Function + DB check) — nestačí jen UI omezení.

### B2C tarify

| Tarif | Cena / měsíc | Limit jednotek | Funkce |
|---|---|---|---|
| **Free** | 0 Kč | 1 | Základní dashboard, ruční správa |
| **Starter** | 199 Kč | 3 | + Automatické upomínky, daňové exporty |
| **Pro** | 499 Kč | 10 | + Energetický modul, prioritní podpora |
| **Portfolio** | 999 Kč | 30 | + API přístup, multi-user (max 3 uživatelé) |

### B2B tarify

| Tarif | Cena / měsíc | Limit jednotek |
|---|---|---|
| **B2B Start** | 2 500 Kč | do 50 |
| **B2B Growth** | 6 500 Kč | do 150 |
| **B2B Scale** | 15 000 Kč | do 400 |
| **Enterprise** | individuálně | 400+ |

### Enforcement pravidla

- Při překročení limitu jednotek: zablokovat přidání další property, zobrazit upgrade CTA.
- Při vypršení předplatného: read-only mód (data zůstávají, editace blokována).
- Subscription status se kontroluje při každém write requestu přes DB trigger nebo Edge Function middleware — ne jen při načtení stránky.
- Stripe Billing → Supabase webhook → aktualizace `Subscription.status` a `Subscription.unit_limit`.

---

## 5. Tech stack (neměnit bez dohody)

| Vrstva | Volba |
|---|---|
| Frontend | React 18 + Vite, **TypeScript (strict)** |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Animace | Framer Motion |
| Komponenty | Radix UI / Headless UI (přístupné) |
| Grafy | Recharts |
| Data fetching | TanStack Query (React Query) |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage, **RLS**) |
| Platby | Stripe |
| E-maily | Resend + React Email |
| Hosting | Vercel (auto-deploy z GitHubu) |
| i18n | react-i18next |

---

## 6. Struktura projektu (drž ji)

```
src/
  app/            # routing, layouty (AppShell, AuthLayout, TenantLayout)
  components/ui/  # design systém (Button, Card, Input, ...)
  features/       # moduly: properties, tenants, payments, energy,
                  #          documents, taxes, messaging, dashboard
  lib/            # supabase client, stripe, utils, formatters (měna/datum)
  i18n/           # config + locales/{cs,en,de,fr,es,zh,sk,ru}.json
  hooks/
  types/          # generované Supabase typy + doménové typy
supabase/
  migrations/
  functions/      # payment-scheduler, reminder-cron, energy-anomaly-check,
                  #   document-expiry-alert, subscription-enforcement
```

Pravidla umístění:
- Sdílené UI → `components/ui`. Logika modulu → `features/<modul>`.
- Žádná byznys logika v komponentách — taháme do hooků a `lib`.
- Automatizovaná workflow výhradně do `supabase/functions/` — nikdy ne jako side effect v UI.
- Formátování měny/data jen přes helpery v `lib/formatters` (napojené na `Intl` + aktuální jazyk). Nikdy ne ručně.

---

## 7. Design systém — zákon vzhledu

**Princip:** luxus = disciplína (typografie, mezery, konzistence), ne efekty. Obsah první, ozdoba nikdy. Appka pracuje s penězi → musí vzbuzovat důvěru.

**Barvy (CSS proměnné / Tailwind theme, light + dark):**
- Light pozadí `#FFFFFF`, dark pozadí `#0B0F19` (půlnoční modrá).
- Primární akcent: **smaragdová zeleň** + temně indigová.
- Sémantika plateb (sjednoceno všude): **Zaplaceno = zelená, Čeká = žlutá/zlatá, Po splatnosti = decentní červená.**

**Typografie:**
- UI: `Plus Jakarta Sans` nebo `Inter`.
- Display nadpisy: **vyber JEDEN** (`Playfair Display` *nebo* `Space Grotesk`) — ne oba současně.
- **Částky vždy `tabular-nums`** — sloupce s penězi musí lícovat.

**Vizuál:**
- Glassmorphismus **jen decentně** na modálech/overlay, ne plošně.
- Měkké rozsáhlé stíny u karet (vystupují do prostoru), žádné těžké bordery.
- 8px grid, velkorysé mezery, konzistentní zaoblení.
- Dashboard: collapsible sidebar, nahoře avatar + rychlý přehled, hlavní plocha s widgety.

**Animace (Framer Motion) — pohyb znamená smysl, nikdy dekorace:**
- Přechody stran: jemný fade + posun ~200–250 ms, ease-out.
- Karty na hoveru: nepatrné zvednutí + zesílení stínu.
- Čísla na dashboardu: count-up při načtení.
- **Vždy respektuj `prefers-reduced-motion`.**

---

## 8. Copywriting — hlas EstatIQ

Sebevědomý, stručný, lidský, žádný korporátní balast. Uživatel nečte odstavce.

Schválená motta (používej je): „Pronájem, který se řídí sám." · „Vše na jednom místě." · „Platby bez starostí." · „Pasivní příjem doopravdy pasivní." · CTA: **„Přidej. Pronajmi. Vydělávej."**

Pravidla: krátké věty, sloveso na začátku CTA, u čísel kontext („+12 % oproti minulému měsíci"). Empty stavy povzbuzují, chyby vysvětlují a nabízejí řešení. **Žádné lorem ipsum** — rovnou finální copy přes i18n klíče.

---

## 9. i18n — tvrdé pravidlo

- **Žádný text natvrdo v JSX.** Vše přes `t('klic')`, klíče strukturované (`dashboard.cards.income`, `payments.status.overdue`).
- Default **`cs`** (plně vyplněno). Locale soubory se stejnými klíči pro `cs, en, de, fr, es, zh, sk, ru` (ostatní fallback EN/CS).
- Měna, datumy, čísla a množná čísla přes `Intl` + i18next plurals.
- Layout snese delší texty (DE/RU) bez přetékání; u `zh` ověř fonty a řádkování.
- Přepínač jazyka v navigaci i v patičce; volba se ukládá (localStorage + profil).

---

## 10. Data & bezpečnost — nepřekročitelné

- **RLS zapnuté na VŠECH tabulkách už v první migraci.** Uživatel/organizace vidí výhradně svoje řádky — vynuceno na úrovni databáze, ne jen v UI.
- Používej **generované TypeScript typy ze Supabase**, ne ručně udržované duplikáty.
- Každá tabulka: `id` (uuid), `created_at`, `updated_at`, FK s indexy.
- Archivace nemovitosti = soft delete (`archived_at`) — data zůstávají pro daně.
- **Tajemství nikdy do kódu ani do gitu.** Klíče přes env proměnné (`.env.local`, Vercel env). API klíče Stripe/Supabase/Resend nikdy neloguj a nevkládej do klienta nad rámec veřejných.
- GDPR jako reálné funkce: export, oprava, vymazání dat. **Dvoufaktor pro B2B účty.**
- Pozvánkový token: platnost 72 h, jednorázové použití.

**Entity** (založ i ty, které ještě nemají UI, ať se k nim nevracíme):
`User, Property, Tenant, Lease, Payment, EnergyReading, EnergyAlert, Document, Invitation, Subscription, Expense, Organization, OrganizationMember, Notification, TaxExport`

---

## 11. Definition of Done — kontroluj u KAŽDÉHO kusu práce

Nic není „hotové", dokud:
- [ ] plně responzivní (mobil → desktop)
- [ ] light **i** dark mód
- [ ] veškerý text přes i18n (`cs` vyplněno, ostatní klíče existují)
- [ ] loading (skeleton), empty a error stavy se špičkovým copy
- [ ] přístupnost: kontrast, focus stavy, klávesnice, `aria`, `prefers-reduced-motion`
- [ ] TypeScript bez `any`, čistý lint, **build prochází**
- [ ] RLS pokrývá nová data
- [ ] částky `tabular-nums` + správné formátování měny dle jazyka
- [ ] animace navádějí, neruší
- [ ] subscription enforcement: write operace zkontrolovány vůči limitu tarifu

---

## 12. Pracovní postup

1. **Pracuj po malých, ucelených krocích.** Po dokončení modulu/komponenty krátké shrnutí, co je hotové a co dál.
2. **Commity:** malé, s jasnou zprávou. Formát `typ: stručný popis` (`feat:`, `fix:`, `refactor:`, `style:`, `chore:`, `i18n:`). Anglicky nebo česky — konzistentně.
3. **Nerozbíjej, co funguje.** Před zásahem do sdílené komponenty zkontroluj, kde se používá.
4. **Žádné polotovary.** Když něco odkládáš do další fáze, napiš `// TODO(fáze 2): ...` a zmiň to ve shrnutí.
5. **Před většími rozhodnutími respektuj kap. 13.**

---

## 13. Ptej se, nehádej

Zastav se a zeptej, než budeš pokračovat, u:
- právních/daňových formulací (výpočet daně, paušál 30 %, předávací protokol),
- platebního flow a QR (formát CZ QR platby / SPD, variabilní symboly),
- finálního scope MVP vs. odložení do další fáze u hraničních funkcí,
- rozhodnutí, která se těžko mění zpětně (datový model, struktura rolí, i18n klíče),
- energetických pravidel (threshold anomálií, napojení API dodavatelů),
- B2B role a práva — každý nový permission scope potvrdit.

U čehokoli, co by později bylo bolestivé přepisovat, je lepší krátká otázka než tichý odhad.

---

## 14. Užitečné příkazy

> Doplň/uprav podle skutečného `package.json`, až bude projekt inicializovaný.

```bash
npm run dev          # lokální vývoj (Vite)
npm run build        # produkční build — MUSÍ projít (viz DoD)
npm run lint         # ESLint — čistý výstup
npm run typecheck    # tsc --noEmit
npx supabase ...     # migrace, generování typů, lokální DB
```

Po každé změně schématu: vygeneruj Supabase typy a aktualizuj `src/types`.

---

## 15. Roadmapa (kontext — co je teď a co později)

- **Fáze 1 / MVP (teď):** auth + role hierarchy, nemovitosti, nájemníci + pozvánky, onboarding wizard (4 kroky), **platební engine** (auto-generování, upomínkový automat T-5/T+7/T+14, ruční potvrzení, daňový export), energetický modul (ruční zadávání + anomálie), dokumenty + expiry alerts, portál nájemníka, B2B panel (základ), Stripe předplatné + enforcement, landing.
- **Fáze 2:** přímé platby Stripe, energie přes API (ČEZ/E.ON/PRE), chat + push, reporty, export do účetnictví, klientský portál pro B2B vlastníky.
- **Fáze 3:** marketplace + recenze, nativní mobil, expanze SK/DE.
- **Fáze 4:** licence PSD2 + automatický odvod daně.

Architekturu drž otevřenou směrem k pozdějším fázím (nech místo, neimplementuj dopředu).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
