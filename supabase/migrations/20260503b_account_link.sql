-- LINE Account Link API support
-- line_link_nonces: webapp stores nonce before redirecting to LINE dialog
-- use_link_nonce: n8n calls this after accountLink webhook to complete linking

CREATE TABLE IF NOT EXISTS line_link_nonces (
  nonce      TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '10 minutes',
  used_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_line_link_nonces_user_id ON line_link_nonces(user_id);

ALTER TABLE line_link_nonces ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own nonces (webapp uses user JWT)
DROP POLICY IF EXISTS "Users insert own nonces" ON line_link_nonces;
CREATE POLICY "Users insert own nonces" ON line_link_nonces
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- use_link_nonce: validates nonce, links LINE user to org, returns result
-- Called by n8n with service role after receiving accountLink webhook event
CREATE OR REPLACE FUNCTION use_link_nonce(p_nonce TEXT, p_line_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id  UUID;
  v_org_id   UUID;
  v_org_name TEXT;
BEGIN
  -- Validate and atomically consume the nonce
  UPDATE line_link_nonces
  SET used_at = now()
  WHERE nonce = p_nonce AND used_at IS NULL AND expires_at > now()
  RETURNING user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_nonce');
  END IF;

  -- Get or create org for this user
  SELECT id, name INTO v_org_id, v_org_name
  FROM organizations WHERE owner_id = v_user_id LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, owner_id, credits)
    SELECT COALESCE(p.full_name, split_part(u.email, '@', 1), 'My Account'), u.id, 0
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = v_user_id
    RETURNING id, name INTO v_org_id, v_org_name;
  END IF;

  -- Link LINE user → org (upsert)
  INSERT INTO line_users (line_user_id, org_id, display_name)
  VALUES (p_line_user_id, v_org_id, '')
  ON CONFLICT (line_user_id) DO UPDATE SET org_id = EXCLUDED.org_id;

  RETURN jsonb_build_object('success', true, 'org_id', v_org_id, 'org_name', v_org_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
