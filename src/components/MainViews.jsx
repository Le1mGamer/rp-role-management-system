import { LogOut } from 'lucide-react';
import { ApplicationForm, LeaderMembers, RuleForm, PunishmentForm } from './ActionForms.jsx';

const emptyRule = { category: '', title: '', text: '', access: 'all' };
const fmtDate = (value) => (value ? String(value).slice(0, 10) : '');

export function Section({ title, subtitle, children }) {
  return <section className="content-panel"><div className="section-head"><h2>{title}</h2><p>{subtitle}</p></div>{children}</section>;
}

export function RulesView({ rules, user, ruleForm, setRuleForm, editRuleId, setEditRuleId, saveRule, removeRule }) {
  return <Section title="Правила" subtitle="Актуальні правила сервера з рольовим доступом.">
    <RuleForm user={user || { role: 'guest' }} form={ruleForm} setForm={setRuleForm} onSubmit={saveRule} editId={editRuleId} onCancel={() => { setEditRuleId(null); setRuleForm(emptyRule); }} />
    <div className="cards-grid">{rules.map((r) => <article className="rule-card" key={r.id}><span>{r.category}</span><h3>{r.title}</h3><p>{r.text}</p><small>Доступ: {r.access}</small>{user?.role === 'admin' && <div className="form-actions"><button onClick={() => { setEditRuleId(r.id); setRuleForm({ category: r.category, title: r.title, text: r.text, access: r.access }); }}>Редагувати</button><button onClick={() => removeRule(r.id)}>Видалити</button></div>}</article>)}</div>
  </Section>;
}

export function ApplicationsView({ apps, user, organizations, appForm, setAppForm, submitApplication, change, t, setActiveTab }) {
  return <Section title="Заявки" subtitle="Подання та розгляд заявок до організацій.">
    {!user && <div className="warning-box">Щоб подати заявку, спочатку увійди в кабінет.</div>}
    <ApplicationForm user={user || { role: 'guest' }} organizations={organizations} form={appForm} setForm={setAppForm} onSubmit={submitApplication} />
    {!user && <button className="dark-btn" onClick={() => setActiveTab('cabinet')}>Перейти в кабінет</button>}
    <div className="table-wrap"><table><thead><tr><th>{t.applicant}</th><th>{t.organization}</th><th>{t.type}</th><th>{t.status}</th><th>{t.submittedAt}</th>{['leader','admin'].includes(user?.role) && <th>Дії</th>}</tr></thead><tbody>{apps.map((a) => <tr key={a.id}><td>{a.applicant}</td><td>{a.organization}</td><td>{a.type}</td><td>{t[a.status] || a.status}</td><td>{String(a.submittedAt)}</td>{['leader','admin'].includes(user?.role) && <td><button onClick={() => change(a.id, 'approved')}>Approve</button><button onClick={() => change(a.id, 'rejected')}>Reject</button></td>}</tr>)}</tbody></table></div>
  </Section>;
}

export function OrganizationsView({ organizations }) {
  return <Section title="Організації" subtitle="Фракції та організації RP-сервера."><div className="cards-grid">{organizations.map((o) => <article className="rule-card" key={o.id}><span>{o.type}</span><h3>{o.name}</h3><p>Рейтинг: {o.rating}</p><small>Учасників: {o.members}</small></article>)}</div></Section>;
}

export function PlayersView({ user, players, usersById, orgsById, leaderOrg, orgMembers, freePlayers, memberUserId, setMemberUserId, addMember, removeMember }) {
  return <Section title="Профілі гравців" subtitle="Відкриті профілі всіх гравців. Email відображається лише адміністратору.">
    <LeaderMembers user={user || { role: 'guest' }} organization={leaderOrg} members={orgMembers} freePlayers={freePlayers} memberUserId={memberUserId} setMemberUserId={setMemberUserId} onAdd={addMember} onRemove={removeMember} />
    <div className="profile-grid">{players.map((p) => { const u = usersById[p.userId] || {}; return <article className="profile-card" key={p.id}><h3>{p.nickname || u.nickname}</h3><p>{p.profileDescription || u.profileDescription || 'Опис профілю ще не додано.'}</p><div className="profile-meta"><span>Роль: {p.role || u.role}</span><span>Статус: {p.status || u.status}</span><span>Дата народження: {fmtDate(p.birthDate || u.birthDate) || '-'}</span><span>Рівень: {p.level}</span><span>Репутація: {p.reputation}</span><span>Організація: {p.organization || orgsById[p.organizationId]?.name || '-'}</span>{user?.role === 'admin' && <span>Email: {p.email || u.email || '-'}</span>}</div></article>; })}</div>
  </Section>;
}

export function AdminView({ user, users, punishments, logs, punishmentForm, setPunishmentForm, createPunishment }) {
  if (user?.role !== 'admin') return <Section title="Адмін панель" subtitle="Доступ обмежено"><div className="error-box">У тебе немає доступу до цього розділу.</div></Section>;
  return <Section title="Адмін панель" subtitle="Користувачі, покарання та журнал дій."><div className="admin-grid"><PunishmentForm users={users} form={punishmentForm} setForm={setPunishmentForm} onSubmit={createPunishment} /><div className="mini-card"><h3>Користувачі та email</h3>{users.map((u) => <p key={u.id}>{u.nickname}: {u.email || '-'}</p>)}</div><div className="mini-card"><h3>Покарання</h3>{punishments.map((p) => <p key={p.id}>{p.nickname}: {p.type} — {p.reason}</p>)}</div><div className="mini-card wide"><h3>Останні логи</h3>{logs.slice(0, 8).map((l) => <p key={l.id}>{l.nickname}: {l.action}</p>)}</div></div></Section>;
}

export function LogsView({ logs }) {
  return <Section title="Логи" subtitle="Журнал дій системи."><div className="cards-grid">{logs.map((l) => <article className="rule-card" key={l.id}><span>{String(l.timestamp)}</span><h3>{l.nickname}</h3><p>{l.action}</p></article>)}</div></Section>;
}

export function CabinetView({ user, nickname, password, profileForm, setProfileForm, setNickname, setPassword, handleLogin, saveProfile, logout, loginError, language, setLanguage }) {
  return <Section title="Кабінет" subtitle="Вхід, вихід та керування обліковим записом.">{user ? <div className="cabinet-layout"><div className="cabinet-card"><h3>{user.nickname}</h3><p>Роль: {user.role}</p><p>Email: {user.email || 'Не додано'}</p><p>Дата народження: {fmtDate(user.birthDate) || 'Не вказано'}</p><p>Статус: {user.status}</p><p>Опис: {user.profileDescription || 'Опис профілю ще не додано.'}</p><button className="dark-btn" onClick={logout}><LogOut size={16} /> Вийти з акаунту</button></div><form className="action-form" onSubmit={saveProfile}><h3>Редагування профілю</h3><input placeholder="Електронна пошта" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /><input type="date" value={profileForm.birthDate} onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })} /><textarea placeholder="Опис профілю" value={profileForm.profileDescription} onChange={(e) => setProfileForm({ ...profileForm, profileDescription: e.target.value })} /><button className="accent-btn">Зберегти профіль</button></form></div> : <form className="action-form" onSubmit={handleLogin}><input placeholder="Нікнейм" value={nickname} onChange={(e) => setNickname(e.target.value)} /><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />{loginError && <div className="error-box">{loginError}</div>}<div className="form-actions"><button className="accent-btn">Увійти</button><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="uk">UA</option><option value="en">ENG</option></select></div></form>}</Section>;
}
