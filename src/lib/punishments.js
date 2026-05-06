export function hasPunishment(user, type) {
  return (user?.punishments || []).some((item) => String(item.type).toLowerCase() === type);
}

export function restrictionText(user, area) {
  if (!user) return '';
  if (hasPunishment(user, 'ban')) {
    if (area === 'profile') return 'Ban: редагування профілю обмежено.';
    if (area === 'players') return 'Ban: перегляд профілів інших гравців заблоковано.';
    if (area === 'applications') return 'Ban: подання заявок заблоковано.';
    if (area === 'forum') return 'Ban: доступ до чату заблоковано.';
  }
  if (hasPunishment(user, 'warning')) {
    if (area === 'players') return 'Warning: перегляд інформації про інших гравців обмежено.';
    if (area === 'applications') return 'Warning: подання заявок тимчасово обмежено.';
  }
  if (hasPunishment(user, 'mute') && area === 'forum-send') {
    return 'Mute: ти можеш читати чат, але не можеш надсилати повідомлення.';
  }
  return '';
}
