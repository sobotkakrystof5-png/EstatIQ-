-- Property ownership verification records (ČÚZK)
-- RLS: users see only their own rows — owner names are not shared across accounts (GDPR)

CREATE TABLE property_verifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id        UUID             REFERENCES properties(id) ON DELETE SET NULL,
  -- ČÚZK identifiers
  cuzk_id            TEXT NOT NULL,
  property_type      TEXT NOT NULL CHECK (property_type IN ('budova', 'parcela', 'jednotka')),
  address            TEXT,
  katastralni_uzemi  TEXT,
  ku_code            TEXT,
  lv                 TEXT,                       -- číslo listu vlastnictví
  -- Result
  status             TEXT NOT NULL CHECK (status IN ('verified', 'not_found', 'name_mismatch', 'error')),
  confidence         TEXT NOT NULL CHECK (confidence IN ('exact', 'fuzzy', 'none')),
  matched_owner      TEXT,                       -- name as stored in ČÚZK; visible only to record owner via RLS
  all_owners_count   INT NOT NULL DEFAULT 0,    -- count only — full names returned transiently, not stored
  verified_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prop_verifications_user ON property_verifications(user_id);
CREATE INDEX idx_prop_verifications_property ON property_verifications(property_id) WHERE property_id IS NOT NULL;

-- Rate limiting: max 10 verify calls per user per rolling hour
CREATE TABLE verification_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_attempts_user_ts
  ON verification_attempts(user_id, created_at DESC);

-- RLS
ALTER TABLE property_verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_verifications_select"
  ON property_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_verifications_insert"
  ON property_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_attempts_select"
  ON verification_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "own_attempts_insert"
  ON verification_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE property_verifications  IS 'Results of ČÚZK ownership checks. GDPR: RLS restricts to record owner.';
COMMENT ON TABLE verification_attempts   IS 'Rate-limit log for cuzk-property Edge Function (10/hr per user).';
COMMENT ON COLUMN property_verifications.matched_owner IS 'ČÚZK owner name that matched the user — visible only to that user via RLS.';
