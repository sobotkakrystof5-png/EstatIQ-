-- Přidání polí katastru nemovitostí (ČÚZK) do tabulky properties

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS cadastre_lv          TEXT,
  ADD COLUMN IF NOT EXISTS cadastre_ku          TEXT,
  ADD COLUMN IF NOT EXISTS cadastre_ku_code     TEXT,
  ADD COLUMN IF NOT EXISTS cadastre_parcel      TEXT,
  ADD COLUMN IF NOT EXISTS cadastre_owners      JSONB,
  ADD COLUMN IF NOT EXISTS cadastre_encumbrances JSONB,
  ADD COLUMN IF NOT EXISTS cadastre_refreshed_at TIMESTAMPTZ;

COMMENT ON COLUMN properties.cadastre_lv              IS 'Číslo listu vlastnictví z ČÚZK';
COMMENT ON COLUMN properties.cadastre_ku              IS 'Název katastrálního území';
COMMENT ON COLUMN properties.cadastre_ku_code         IS 'Kód katastrálního území';
COMMENT ON COLUMN properties.cadastre_parcel          IS 'Parcelní číslo';
COMMENT ON COLUMN properties.cadastre_owners          IS 'Vlastníci: [{name: string, share: string}]';
COMMENT ON COLUMN properties.cadastre_encumbrances    IS 'Zástavy a věcná břemena: string[]';
COMMENT ON COLUMN properties.cadastre_refreshed_at    IS 'Datum posledního ověření dat v ČÚZK';
