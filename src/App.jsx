import { useEffect, useMemo, useState } from 'react';
import { LogOut } from 'lucide-react';
import { seedData } from './data/seedData.js';
import { translations } from './i18n/translations.js';
import { apiRequest } from './api/client.js';
import { ApplicationForm, LeaderMembers, RuleForm, PunishmentForm } from './components/ActionForms.jsx';

const emptyRule = { category: '', title: '', text: '', access: 'all' };
const baseTabs = [
  { id: 'rules', label: 'Правила' },
  { id: 'organizations', label: 'Організації' },
  { id: 'applications', label: 'Заявки' },
  { id: 'players', label: 'Гравці' },
  { id: 'admin', label: 'Адмін панель' },
  { id: 'logs', label: 'Логи' }
];

function App() {
  const [language, setLanguage] = useState('uk');
  const [activeTab, setActiveTab] = useState('rules');
  const [query, setQuery] = useState('');
  const [nickname, setNickname] = useState('John_Vancheti');
  const [password, setPassword] = useState('Player123!');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [apiError, setApiError] = useState('');
  const [data, setData] = useState(seedData);
  const [leaderOrg, setLeaderOrg] = useState(null);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [editRuleId, setEditRuleId] = useState(null);
  const [appForm, setAppForm] = useState({ organizationId: '', type: 'join_organization' });
  const [memberUserId, setMemberUserId] = useState('');
  const [punishmentForm, setPunishmentForm] = useState({ userId: '', type: 'warning', reason: '', endDate: '' });
  const t = translations[language];

  const usersById = useMemo(() => Object.fromEntries(data.users.map((u) => [u.id, u])), [data.users]);
  const orgsById = useMemo(() => Object.fromEntries(data.organizations.map((o) => [o.id, o])), [data.organizations]);

  const allowedTabs = useMemo(() => {
    if (!currentUser) return ['rules', 'organizations'];
    if (currentUser.role === 'admin') return ['rules', 'organizations', 'applications', 'players', 'admin', 'logs'];
    if (currentUser.role === 'leader') return ['rules', 'organizations', 'applications', 'players', 'logs'];
    return ['rules', 'organizations', 'applications'];
  }, [currentUser]);

  const navTabs = baseTabs.filter((tab) => allowedTabs.includes(tab.id));
  const q = query.toLowerCase();

  async function loadData(user = currentUser) {
    if (!user) return;
    try {
      const next = { ...data };
      next.rules = await apiRequest('/rules', {}, user.id);
      next.organizations = await apiRequest('/organizations', {}, user.id);
      next.applications = await apiRequest('/applications', {}, user.id);
      if (['leader', 'admin'].includes(user.role)) {
        next.players = await apiRequest('/players', {}, user.id);
        next.logs = await apiRequest('/logs', {}, user.id);
      }
      if (user.role === 'leader') setLeaderOrg(await apiRequest('/leader/organization', {}, user.id));
      if (user.role === 'admin') {
        next.users = await apiRequest('/users', {}, user.id);
        next.punishments = await apiRequest('/punishments', {}, user.id);
      }
      setData(next);
      setApiError('');
    } catch {
      setApiError('API недоступне або PostgreSQL ще не запущено. Показано локальні seed-дані.');
    }
  }

  useEffect(() => { loadData(); }, [currentUser]);

  async function handleLogin(e) {
    e.preventDefault();
    try {
      const user = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ nickname, password }) });
      setCurrentUser(user);
      setLoginError('');
      setApiError('');
      setActiveTab('cabinet');
    } catch {
      const user = seedData.users.find((u) => u.nickname.toLowerCase() === nickname.trim().toLowerCase() && u.password === password && u.status !== 'banned');
      if (!user) { setLoginError(t.loginError); return; }
      setCurrentUser(user);
      setApiError('API недоступне або PostgreSQL ще не запущено. Показано локальні seed-дані.');
      setActiveTab('cabinet');
    }
  }

  function logout() {
    setCurrentUser(null);
    setLeaderOrg(null);
    setData(seedData);
    setQuery('');
    setActiveTab('cabinet');
  }

  async function saveRule(e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
      const body = JSON.stringify(ruleForm);
      if (editRuleId) await apiRequest(`/rules/${editRuleId}`, { method: 'PUT', body }, currentUser.id);
      else await apiRequest('/rules', { method: 'POST', body }, currentUser.id);
      setRuleForm(emptyRule);
      setEditRuleId(null);
      await loadData(currentUser);
    } catch (e) { setApiError(e.message); }
  }

  async function removeRule(id) {
    try { await apiRequest(`/rules/${id}`, { method: 'DELETE' }, currentUser.id); await loadData(currentUser); }
    catch (e) { setApiError(e.message); }
  }

  async function setAppStatus(id, status) {
    try { await apiRequest(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, currentUser.id); await loadData(currentUser); }
    catch (e) { setApiError(e.message); }
  }

  async function submitApplication(e) {
    e.preventDefault();
    if (!currentUser) { setActiveTab('cabinet'); return; }
    try {
      await apiRequest('/applications', { method: 'POST', body: JSON.stringify({ organizationId: Number(appForm.organizationId), type: appForm.type }) }, currentUser.id);
      setAppForm({ organizationId: '', type: 'join_organization' });
      await loadData(currentUser);
    } catch (e) { setApiError(e.message); }
  }

  async function addMember(e) {
    e.preventDefault();
    try { await apiRequest(`/players/${memberUserId}/organization`, { method: 'PATCH', body: JSON.stringify({ organizationId: leaderOrg?.id }) }, currentUser.id); setMemberUserId(''); await loadData(currentUser); }
    catch (e) { setApiError(e.message); }
  }

  async function removeMember(userId) {
    try { await apiRequest(`/players/${userId}/organization`, { method: 'PATCH', body: JSON.stringify({ organizationId: null }) }, currentUser.id); await loadData(currentUser); }
    catch (e) { setApiError(e.message); }
  }

  async function createPunishment(e) {
    e.preventDefault();
    try { await apiRequest('/punishments', { method: 'POST', body: JSON.stringify({ ...punishmentForm, userId: Number(punishmentForm.userId) }) }, currentUser.id); setPunishmentForm({ userId: '', type: 'warning', reason: '', endDate: '' }); await loadData(currentUser); }
    catch (e) { setApiError(e.message); }
  }

  const rules = data.rules.filter((r) => (r.access === 'all' || currentUser?.role === 'admin' || r.access === currentUser?.role) && `${r.title} ${r.category} ${r.text}`.toLowerCase().includes(q));
  const apps = data.applications.filter((a) => `${a.applicant || usersById[a.applicantId]?.nickname || ''} ${a.status}`.toLowerCase().includes(q));
  const logs = data.logs.filter((l) => `${l.nickname || usersById[l.userId]?.nickname || ''} ${l.action}`.toLowerCase().includes(q));
  const orgMembers = currentUser?.role === 'leader' && leaderOrg ? data.players.filter((p) => (p.organizationId || p.organization_id) === leaderOrg.id) : [];
  const freePlayers = data.players.filter((p) => !p.organizationId && !p.organization_id);

  return (
    <div className="site-shell">
      <div className="hero-bg" />
      <header className="glass-header">
        <div className="brand-pill">RPMS</div>
        <nav className="top-nav">
          {navTabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
        </nav>
        <div className="header-actions">
          <button className={`dark-btn ${activeTab === 'cabinet' ? 'active' : ''}`} onClick={() => setActiveTab('cabinet')}>Кабінет →</button>
          <button className={`accent-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Подати заявку</button>
        </div>
      </header>

      <section className="hero-title">
        <h1>RP ROLE<br />MANAGEMENT</h1>
        <p>Система керування правилами, ролями, організаціями та заявками RP-сервера</p>
      </section>

      <main className="landing-content">
        {apiError && <div className="warning-box">{apiError}</div>}
        {activeTab !== 'cabinet' && <div className="search-box"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук у поточному розділі..." /></div>}
        {activeTab === 'rules' && <RulesView rules={rules} user={currentUser} ruleForm={ruleForm} setRuleForm={setRuleForm} editRuleId={editRuleId} setEditRuleId={setEditRuleId} saveRule={saveRule} removeRule={removeRule} />}
        {activeTab === 'applications' && <ApplicationsView apps={apps} user={currentUser} organizations={data.organizations} appForm={appForm} setAppForm={setAppForm} submitApplication={submitApplication} change={setAppStatus} t={t} setActiveTab={setActiveTab} />}
        {activeTab === 'organizations' && <OrganizationsView organizations={data.organizations} />}
        {activeTab === 'players' && <PlayersView user={currentUser} players={data.players} usersById={usersById} orgsById={orgsById} leaderOrg={leaderOrg} orgMembers={orgMembers} freePlayers={freePlayers} memberUserId={memberUserId} setMemberUserId={setMemberUserId} addMember={addMember} removeMember={removeMember} />}
        {activeTab === 'admin' && <AdminView user={currentUser} users={data.users} punishments={data.punishments} logs={logs} punishmentForm={punishmentForm} setPunishmentForm={setPunishmentForm} createPunishment={createPunishment} />}
        {activeTab === 'logs' && <LogsView logs={logs} />}
        {activeTab === 'cabinet' && <CabinetView user={currentUser} nickname={nickname} password={password} setNickname={setNickname} setPassword={setPassword} handleLogin={handleLogin} logout={logout} loginError={loginError} language={language} setLanguage={setLanguage} />}
      </main>
    </div>
  );
}

function Section({ title, subtitle, children }) { return <section className="content-panel"><div className="section-head"><h2>{title}</h2><p>{subtitle}</p></div>{children}</section>; }
function RulesView({ rules, user, ruleForm, setRuleForm, editRuleId, setEditRuleId, saveRule, removeRule }) { return <Section title="Правила" subtitle="Актуальні правила сервера з рольовим доступом."><RuleForm user={user || { role: 'guest' }} form={ruleForm} setForm={setRuleForm} onSubmit={saveRule} editId={editRuleId} onCancel={() => { setEditRuleId(null); setRuleForm(emptyRule); }} /><div className="cards-grid">{rules.map((r) => <article className="rule-card" key={r.id}><span>{r.category}</span><h3>{r.title}</h3><p>{r.text}</p><small>Доступ: {r.access}</small>{user?.role === 'admin' && <div className="form-actions"><button onClick={() => { setEditRuleId(r.id); setRuleForm({ category: r.category, title: r.title, text: r.text, access: r.access }); }}>Редагувати</button><button onClick={() => removeRule(r.id)}>Видалити</button></div>}</article>)}</div></Section>; }
function ApplicationsView({ apps, user, organizations, appForm, setAppForm, submitApplication, change, t, setActiveTab }) { return <Section title="Заявки" subtitle="Подання та розгляд заявок до організацій.">{!user && <div className="warning-box">Щоб подати заявку, спочатку увійди в кабінет.</div>}<ApplicationForm user={user || { role: 'guest' }} organizations={organizations} form={appForm} setForm={setAppForm} onSubmit={submitApplication} />{!user && <button className="dark-btn" onClick={() => setActiveTab('cabinet')}>Перейти в кабінет</button>}<div className="table-wrap"><table><thead><tr><th>{t.applicant}</th><th>{t.organization}</th><th>{t.type}</th><th>{t.status}</th><th>{t.submittedAt}</th>{['leader','admin'].includes(user?.role) && <th>Дії</th>}</tr></thead><tbody>{apps.map((a) => <tr key={a.id}><td>{a.applicant}</td><td>{a.organization}</td><td>{a.type}</td><td>{t[a.status] || a.status}</td><td>{String(a.submittedAt)}</td>{['leader','admin'].includes(user?.role) && <td><button onClick={() => change(a.id, 'approved')}>Approve</button><button onClick={() => change(a.id, 'rejected')}>Reject</button></td>}</tr>)}</tbody></table></div></Section>; }
function OrganizationsView({ organizations }) { return <Section title="Організації" subtitle="Фракції та організації RP-сервера."><div className="cards-grid">{organizations.map((o) => <article className="rule-card" key={o.id}><span>{o.type}</span><h3>{o.name}</h3><p>Рейтинг: {o.rating}</p><small>Учасників: {o.members}</small></article>)}</div></Section>; }
function PlayersView({ user, players, usersById, orgsById, leaderOrg, orgMembers, freePlayers, memberUserId, setMemberUserId, addMember, removeMember }) { return <Section title="Гравці" subtitle="Список гравців та управління складом організації."><LeaderMembers user={user || { role: 'guest' }} organization={leaderOrg} members={orgMembers} freePlayers={freePlayers} memberUserId={memberUserId} setMemberUserId={setMemberUserId} onAdd={addMember} onRemove={removeMember} /><div className="table-wrap"><table><thead><tr><th>Нікнейм</th><th>Роль</th><th>Статус</th><th>Рівень</th><th>Репутація</th><th>Організація</th></tr></thead><tbody>{players.map((p) => <tr key={p.id}><td>{p.nickname || usersById[p.userId]?.nickname}</td><td>{p.role || usersById[p.userId]?.role}</td><td>{p.status || usersById[p.userId]?.status}</td><td>{p.level}</td><td>{p.reputation}</td><td>{p.organization || orgsById[p.organizationId]?.name || '-'}</td></tr>)}</tbody></table></div></Section>; }
function AdminView({ user, users, punishments, logs, punishmentForm, setPunishmentForm, createPunishment }) { if (user?.role !== 'admin') return <Section title="Адмін панель" subtitle="Доступ обмежено"><div className="error-box">У тебе немає доступу до цього розділу.</div></Section>; return <Section title="Адмін панель" subtitle="Користувачі, покарання та журнал дій."><div className="admin-grid"><PunishmentForm users={users} form={punishmentForm} setForm={setPunishmentForm} onSubmit={createPunishment} /><div className="mini-card"><h3>Покарання</h3>{punishments.map((p) => <p key={p.id}>{p.nickname}: {p.type} — {p.reason}</p>)}</div><div className="mini-card wide"><h3>Останні логи</h3>{logs.slice(0, 8).map((l) => <p key={l.id}>{l.nickname}: {l.action}</p>)}</div></div></Section>; }
function LogsView({ logs }) { return <Section title="Логи" subtitle="Журнал дій системи."><div className="cards-grid">{logs.map((l) => <article className="rule-card" key={l.id}><span>{String(l.timestamp)}</span><h3>{l.nickname}</h3><p>{l.action}</p></article>)}</div></Section>; }
function CabinetView({ user, nickname, password, setNickname, setPassword, handleLogin, logout, loginError, language, setLanguage }) { return <Section title="Кабінет" subtitle="Вхід, вихід та керування обліковим записом.">{user ? <div className="cabinet-card"><h3>{user.nickname}</h3><p>Роль: {user.role}</p><p>Email: {user.email || '-'}</p><p>Статус: {user.status}</p><button className="dark-btn" onClick={logout}><LogOut size={16} /> Вийти з акаунту</button></div> : <form className="action-form" onSubmit={handleLogin}><input placeholder="Нікнейм" value={nickname} onChange={(e) => setNickname(e.target.value)} /><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />{loginError && <div className="error-box">{loginError}</div>}<div className="form-actions"><button className="accent-btn">Увійти</button><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="uk">UA</option><option value="en">ENG</option></select></div></form>}</Section>; }

export default App;
