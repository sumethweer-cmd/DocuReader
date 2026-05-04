-- Fix: circular RLS dependency between organizations ↔ org_members
--
-- org_select USING clause queries org_members →
-- org_members_select USING clause queries organizations →
-- org_select USING clause queries org_members → infinite recursion
--
-- Fix: break the cycle with SECURITY DEFINER helper functions
-- (SECURITY DEFINER bypasses RLS on the tables they query,
--  so the recursion never starts)

CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND profile_id = auth.uid()
  )
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION is_org_owner(p_org_id UUID)
RETURNS BOOLEAN SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE id = p_org_id AND owner_id = auth.uid()
  )
$$ LANGUAGE sql STABLE;

-- Rebuild organizations policies using helper (no cross-table subquery)
DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (owner_id = auth.uid() OR is_org_member(id));

DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- Rebuild org_members policies using helper (no cross-table subquery)
DROP POLICY IF EXISTS "org_members_select" ON org_members;
CREATE POLICY "org_members_select" ON org_members
  FOR SELECT USING (profile_id = auth.uid() OR is_org_owner(org_id));

DROP POLICY IF EXISTS "org_members_insert" ON org_members;
CREATE POLICY "org_members_insert" ON org_members
  FOR INSERT WITH CHECK (is_org_owner(org_id));

-- Rebuild org_invites policies using helper
DROP POLICY IF EXISTS "org_invites_select" ON org_invites;
CREATE POLICY "org_invites_select" ON org_invites
  FOR SELECT USING (is_org_owner(org_id));

DROP POLICY IF EXISTS "org_invites_insert" ON org_invites;
CREATE POLICY "org_invites_insert" ON org_invites
  FOR INSERT WITH CHECK (is_org_owner(org_id));

-- Rebuild line_users select using helper
DROP POLICY IF EXISTS "line_users_select" ON line_users;
CREATE POLICY "line_users_select" ON line_users
  FOR SELECT USING (profile_id = auth.uid() OR is_org_owner(org_id));

NOTIFY pgrst, 'reload schema';
