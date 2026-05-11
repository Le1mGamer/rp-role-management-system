import { LogOut } from 'lucide-react';
import { ApplicationForm, LeaderMembers, RuleForm } from './ActionForms.jsx';
import AdminTools from './AdminTools.jsx';

const emptyRule = { category: '', title: '', text: '', access: 'all' };
const fmtDate = (value) => (value ? String(value).slice(0, 10) : '');
const hasPunishment = (user, type) => (user?.punishments || []).some((p) => String(p.type).toLowerCase() === type);

export function Section({ title, subtitle, children }) {
  return <section className="content-panel"><div className="section-head"><h2>{title}</h2><p>{subtitle}</p></div>{children}</section>;
}

export function PunishmentNotice({ user }) {
  const list = user?.punishments || [];
  if (!list.length) return null;
  return <div className="warning-box"><b>Активні покарання:</b> {list.map((p) => String(p.type).toUpperCase() + ' — ' + (p.reason || 'без причини') + (p.endDate ? ' до ' + fmtDate(p.endDate) : '')).join('; ')}</div>;
}

export function RulesView({ rules, user, ruleForm, setRuleForm, editRuleId, setEditRuleId, saveRule, removeRule }) {
  return <Section title="Правила" subtitle="Актуальні правила сервера з рольовим доступом.">
    <RuleForm user={user || { role: 'guest' }} form={ruleForm} setForm={setRuleForm} onSubmit={saveRule} editId={editRuleId} onCancel={() => { setEditRuleId(null); setRuleForm(emptyRule); }} />
    <div className="cards-grid">{rules.map((r) => <article className="rule-card" key={r.id}><span>{r.category}</span><h3>{r.title}</h3><p>{r.text}</p><small>Доступ: {r.access}</small>{user?.role === 'admin' && <div className="form-actions"><button onClick={() => { setEditRuleId(r.id); setRuleForm({ category: r.category, title: r.title, text: r.text, access: r.access }); }}>Редагувати</button><button onClick={() => removeRule(r.id)}>Видалити</button></div>}</article>)}</div>
  </Section>;
}

export function ApplicationsView({ apps, user, organizations, appForm, setAppForm, submitApplication, change, t, setActiveTab }) {
  const isRestricted = hasPunishment(user, 'ban') || hasPunishment(user, 'warning');
  const message = hasPunishment(user, 'ban') ? 'Ban: подання заявок заблоковано.' : hasPunishment(user, 'warning') ? 'Warning: тимчасово обмежено подання заявок.' : '';
  return <Section title="Заявки" subtitle="Подання та розгляд заявок до організацій.">
    {!user && <div className="warning-box">Щоб подати заявку, спочатку увійди в кабінет.</div>}
    <PunishmentNotice user={user} />
    <ApplicationForm user={user || { role: 'guest' }} organizations={organizations} form={appForm} setForm={setAppForm} onSubmit={submitApplication} disabled={isRestricted} restrictionMessage={message} />
    {!user && <button className="dark-btn" onClick={() => setActiveTab('cabinet')}>Перейти в кабінет</button>}
    <div className="table-wrap"><table><thead><tr><th>{t.applicant}</th><th>{t.organization}</th><th>{t.type}</th><th>{t.status}</th><th>{t.submittedAt}</th>{['leader','admin'].includes(user?.role) && <th>Дії</th>}</tr></thead><tbody>{apps.map((a) => <tr key={a.id}><td>{a.applicant}</td><td>{a.organization}</td><td>{a.type}</td><td>{t[a.status] || a.status}</td><td>{String(a.submittedAt)}</td>{['leader','admin'].includes(user?.role) && <td><button onClick={() => change(a.id, 'reviewing')}>Reviewing</button><button onClick={() => change(a.id, 'needs_info')}>Needs info</button><button onClick={() => change(a.id, 'approved')}>Approve</button><button onClick={() => change(a.id, 'rejected')}>Reject</button></td>}</tr>)}</tbody></table></div>
  </Section>;
}

export function OrganizationsView({ organizations }) {
  return <Section title="Організації" subtitle="Фракції та організації RP-сервера."><div className="cards-grid">{organizations.map((o) => <article className="rule-card" key={o.id}><span>{o.type}</span><h3>{o.name}</h3><p>Рейтинг: {o.rating}</p><small>Учасників: {o.members}</small></article>)}</div></Section>;
}

export function PlayersView({ user, players, usersById, orgsById, leaderOrg, orgMembers, freePlayers, memberUserId, setMemberUserId, addMember, removeMember }) {
  if (user && user.role !== 'admin' && hasPunishment(user, 'ban')) return <Section title="Профілі гравців" subtitle="Доступ обмежено"><PunishmentNotice user={user} /><div className="error-box">Ban: перегляд профілів інших гравців заблоковано.</div></Section>;
  if (user && user.role !== 'admin' && hasPunishment(user, 'warning')) return <Section title="Профілі гравців" subtitle="Доступ обмежено"><PunishmentNotice user={user} /><div className="warning-box">Warning: тимчасово обмежено перегляд інформації про інших гравців.</div></Section>;
  return <Section title="Профілі гравців" subtitle="Відкриті профілі всіх гравців. Email відображається лише адміністратору.">
    <LeaderMembers user={user || { role: 'guest' }} organization={leaderOrg} members={orgMembers} freePlayers={freePlayers} memberUserId={memberUserId} setMemberUserId={setMemberUserId} onAdd={addMember} onRemove={removeMember} />
    <div className="profile-grid">{players.map((p) => { const u = usersById[p.userId] || {}; return <article className="profile-card" key={p.id}><h3>{p.nickname || u.nickname}</h3><p>{p.profileDescription || u.profileDescription || 'Опис профілю ще не додано.'}</p><div className="profile-meta"><span>Роль: {p.role || u.role}</span><span>Статус: {p.status || u.status}</span><span>Дата народження: {fmtDate(p.birthDate || u.birthDate) || '-'}</span><span>Рівень: {p.level}</span><span>Репутація: {p.reputation}</span><span>Організація: {p.organization || orgsById[p.organizationId]?.name || '-'}</span>{user?.role === 'admin' && <span>Email: {p.email || u.email || '-'}</span>}</div></article>; })}</div>
  </Section>;
}

export function AdminView(props) {
  if (props.user?.role !== 'admin') return <Section title="Адмін панель" subtitle="Доступ обмежено"><div className="error-box">У тебе немає доступу до цього розділу.</div></Section>;
  return <Section title="Адмін панель" subtitle="Керування ролями, організаціями, покараннями та звітами."><AdminTools {...props} /></Section>;
}

export function ForumView({ user, messages, messageText, setMessageText, sendMessage, setActiveTab }) {
  const isBanned = hasPunishment(user, 'ban');
  const isMuted = hasPunishment(user, 'mute');
  return <Section title="Форумний чат" subtitle="Загальний чат для спілкування гравців.">
    {!user && <div className="warning-box">Для читання та надсилання повідомлень потрібно увійти в кабінет.</div>}
    {user && <PunishmentNotice user={user} />}
    {isBanned && <div className="error-box">Ban: читання чату та надсилання повідомлень заблоковано.</div>}
    {!user && <button className="dark-btn" onClick={() => setActiveTab('cabinet')}>Перейти в кабінет</button>}
    {user && !isBanned && <div className="forum-box"><div className="forum-messages">{messages.map((m) => <div className="chat-message" key={m.id}><b>{m.nickname}</b><span>{m.message}</span><small>{String(m.createdAt)}</small></div>)}</div><form className="forum-form" onSubmit={sendMessage}><input disabled={isMuted} value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder={isMuted ? 'Mute: ти можеш читати чат, але не можеш писати.' : 'Написати повідомлення...'} /><button className="accent-btn" disabled={isMuted}>Надіслати</button></form>{isMuted && <div className="warning-box">Mute: тобі доступне читання чату, але надсилання повідомлень обмежено.</div>}</div>}
  </Section>;
}

export function LogsView({ logs }) {
  return <Section title="Логи" subtitle="Журнал дій системи."><div className="cards-grid">{logs.map((l) => <article className="rule-card" key={l.id}><span>{String(l.timestamp)}</span><h3>{l.nickname}</h3><p>{l.action}</p></article>)}</div></Section>;
}

export function CabinetView({ user, nickname, password, profileForm, setProfileForm, setNickname, setPassword, handleLogin, saveProfile, logout, loginError, language, setLanguage }) {
  const isBanned = hasPunishment(user, 'ban');
  async function discordLogin() {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/auth/discord/url');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) { alert('Discord OAuth не налаштовано. Перевір .env.'); }
  }
  return <Section title="Кабінет" subtitle="Вхід, вихід та керування обліковим записом.">{user ? <div className="cabinet-layout"><div className="cabinet-card"><h3>{user.nickname}</h3><p>Роль: {user.role}</p><p>Email: {user.email || 'Не додано'}</p><p>Дата народження: {fmtDate(user.birthDate) || 'Не вказано'}</p><p>Статус: {user.status}</p><p>Опис: {user.profileDescription || 'Опис профілю ще не додано.'}</p><PunishmentNotice user={user} /><button className="dark-btn" onClick={logout}><LogOut size={16} /> Вийти з акаунту</button></div><form className="action-form" onSubmit={saveProfile}><h3>Редагування профілю</h3>{isBanned && <div className="error-box">Ban: редагування профілю обмежено.</div>}<input disabled={isBanned} placeholder="Електронна пошта" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /><input disabled={isBanned} type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })} /><textarea disabled={isBanned} placeholder="Опис профілю" value={profileForm.profileDescription} onChange={(e) => setProfileForm({ ...profileForm, profileDescription: e.target.value })} /><button className="accent-btn" disabled={isBanned}>Зберегти профіль</button></form></div> : <form className="action-form" onSubmit={handleLogin}><input placeholder="Нікнейм" value={nickname} onChange={(e) => setNickname(e.target.value)} /><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />{loginError && <div className="error-box">{loginError}</div>}<div className="form-actions"><button className="accent-btn">Увійти</button><button type="button" className="dark-btn" onClick={discordLogin}>Увійти через Discord</button><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="uk">UA</option><option value="en">ENG</option></select></div></form>}</Section>;
}
