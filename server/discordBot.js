import { Client, GatewayIntentBits } from 'discord.js';
import { pool } from './pool.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

let loginPromise = null;

const baseRoleEnv = {
  player: 'DISCORD_ROLE_PLAYER',
  leader: 'DISCORD_ROLE_LEADER',
  admin: 'DISCORD_ROLE_ADMIN',
};

const punishmentRoleEnv = {
  warning: 'DISCORD_ROLE_WARNING',
  mute: 'DISCORD_ROLE_MUTE',
  ban: 'DISCORD_ROLE_BANNED',
};

function envRole(name) {
  return process.env[name] || '';
}

function systemRoleIds() {
  return [
    ...Object.values(baseRoleEnv).map(envRole),
    ...Object.values(punishmentRoleEnv).map(envRole),
  ].filter(Boolean);
}

async function getGuild() {
  if (!process.env.DISCORD_GUILD_ID) {
    throw new Error('DISCORD_GUILD_ID is not configured');
  }
  return client.guilds.fetch(process.env.DISCORD_GUILD_ID);
}

async function organizationRoleIds() {
  const { rows } = await pool.query(
    'select discord_role_id from organizations where discord_role_id is not null and discord_role_id <> $1',
    ['']
  );
  return rows.map((row) => row.discord_role_id).filter(Boolean);
}

async function activePunishmentTypes(userId) {
  const { rows } = await pool.query(
    'select type from punishments where user_id=$1 and (end_date is null or end_date > current_date)',
    [userId]
  );
  return rows.map((row) => String(row.type).toLowerCase());
}

async function userOrganizationRoleIds(userId) {
  const { rows } = await pool.query(
    `select distinct o.discord_role_id
     from organizations o
     where o.discord_role_id is not null
       and o.discord_role_id <> ''
       and (
         o.id in (select organization_id from players where user_id=$1 and organization_id is not null)
         or o.id in (select organization_id from leaders where user_id=$1 and organization_id is not null)
       )`,
    [userId]
  );
  return rows.map((row) => row.discord_role_id).filter(Boolean);
}

export async function startDiscordBot() {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('Discord bot token is not configured. Role sync is disabled.');
    return false;
  }

  if (client.isReady()) return true;
  if (loginPromise) return loginPromise;

  client.once('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
  });

  loginPromise = client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => true)
    .catch((error) => {
      console.error('Discord bot login failed:', error.message);
      loginPromise = null;
      return false;
    });

  return loginPromise;
}

export async function syncDiscordRoles(userId) {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
    return { ok: false, skipped: true, reason: 'Discord bot is not configured' };
  }

  if (!client.isReady()) {
    await startDiscordBot();
  }

  if (!client.isReady()) {
    return { ok: false, skipped: true, reason: 'Discord bot is not ready' };
  }

  const { rows } = await pool.query(
    'select id,nickname,role,discord_id from users where id=$1',
    [userId]
  );
  const user = rows[0];

  if (!user) {
    return { ok: false, skipped: true, reason: 'User not found' };
  }

  if (!user.discord_id) {
    return { ok: false, skipped: true, reason: 'User has no connected Discord account' };
  }

  const guild = await getGuild();
  const member = await guild.members.fetch(user.discord_id).catch(() => null);

  if (!member) {
    return { ok: false, skipped: true, reason: 'Discord member was not found on this server' };
  }

  const allManagedRoleIds = [
    ...systemRoleIds(),
    ...(await organizationRoleIds()),
  ].filter(Boolean);

  const roleIdsToAdd = [];
  const baseRoleId = envRole(baseRoleEnv[user.role]);
  if (baseRoleId) roleIdsToAdd.push(baseRoleId);

  const punishments = await activePunishmentTypes(user.id);
  for (const punishment of punishments) {
    const roleId = envRole(punishmentRoleEnv[punishment]);
    if (roleId) roleIdsToAdd.push(roleId);
  }

  roleIdsToAdd.push(...await userOrganizationRoleIds(user.id));

  const uniqueManaged = [...new Set(allManagedRoleIds)];
  const uniqueToAdd = [...new Set(roleIdsToAdd)].filter(Boolean);

  if (uniqueManaged.length) {
    await member.roles.remove(uniqueManaged).catch((error) => {
      console.error('Discord role remove failed:', error.message);
    });
  }

  if (uniqueToAdd.length) {
    await member.roles.add(uniqueToAdd).catch((error) => {
      console.error('Discord role add failed:', error.message);
      throw error;
    });
  }

  return {
    ok: true,
    userId: user.id,
    nickname: user.nickname,
    discordId: user.discord_id,
    addedRoles: uniqueToAdd,
  };
}

export async function syncAllDiscordRoles() {
  const { rows } = await pool.query('select id from users where discord_id is not null order by id');
  const results = [];

  for (const row of rows) {
    try {
      results.push(await syncDiscordRoles(row.id));
    } catch (error) {
      results.push({ ok: false, userId: row.id, reason: error.message });
    }
  }

  return results;
}
