ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS discord_role_id VARCHAR(64);

CREATE INDEX IF NOT EXISTS organizations_discord_role_id_idx
ON organizations(discord_role_id)
WHERE discord_role_id IS NOT NULL;
