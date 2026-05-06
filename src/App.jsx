import { useEffect, useMemo, useState } from 'react';
import { seedData } from './data/seedData.js';
import { translations } from './i18n/translations.js';
import { apiRequest } from './api/client.js';
import { RulesView, ApplicationsView, OrganizationsView, PlayersView, AdminView, LogsView, CabinetView } from './components/MainViews.jsx';
import ForumPage from './components/ForumPage.jsx';

const emptyRule = { category: '', title: '', text: '', access: 'all' };
const emptyProfile = { email: '', birthDate: '', profileDescription: '' };
const normDate = (v) => v ? String(v).slice(0, 10) : '';
const tabs = [
  { id: 'rules', label: 'Правила' }, { id: 'organizations', label: 'Організації' },
  { id: 'applications', label: 'Заявки' }, { id: 'players', label: 'Гравці' },
  { id: 'forum', label: 'Форум' }, { id: 'admin', label: 'Адмін панель' }, { id: 'logs', label: 'Логи' }
];

function App() {
  const [language, setLanguage] = useState('uk');
  const [activeTab, setActiveTab] = useState('rules');
  const [query, setQuery] = useState('');
  const [nickname, setNickname] = useState('John_Vancheti');
  const [password, setPassword] = useState('Player123!');
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
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
    if (!currentUser) return ['rules', 'organizations', 'forum'];
    if (currentUser.role === 'admin') return ['rules', 'organizations', 'applications', 'players', 'forum', 'admin', 'logs'];
    if (currentUser.role === 'leader') return ['rules', 'organizations', 'applications', 'players', 'forum', 'logs'];
    return ['rules', 'organizations', 'applications', 'players', 'forum'];
  }, [currentUser]);
  const navTabs = tabs.filter((tab) => allowedTabs.includes(tab.id));
  const q = query.toLowerCase();

  function applyProfile(user) {
    setCurrentUser(user);
    setProfileForm({ email: user?.email || '', birthDate: normDate(user?.birthDate), profileDescription: user?.profileDescription || '' });
  }

  async function loadData(user = currentUser) {
    if (!user) return;
    try {
      const next = { ...data };
      const profile = await apiRequest('/profile', {}, user.id);
      applyProfile(profile);
      next.rules = await apiRequest('/rules', {}, user.id);
      next.organizations = await apiRequest('/organizations', {}, user.id);
      next.applications = await apiRequest('/applications', {}, user.id);
      next.players = await apiRequest('/players', {}, user.id);
      if (['leader', 'admin'].includes(user.role)) next.logs = await apiRequest('/logs', {}, user.id);
      if (user.role === 'leader') setLeaderOrg(await apiRequest('/leader/organization', {}, user.id));
      if (user.role === 'admin') { next.users = await apiRequest('/users', {}, user.id); next.punishments = await apiRequest('/punishments', {}, user.id); }
      setData(next); setApiError('');
    } catch { setApiError('API недоступне або PostgreSQL ще не запущено. Показано локальні seed-дані.'); }
  }
  useEffect(() => { loadData(); }, [currentUser?.id]);

  async function handleLogin(e) { e.preventDefault(); try { const u = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ nickname, password }) }); applyProfile(u); setLoginError(''); setApiError(''); setActiveTab('cabinet'); } catch { const u = seedData.users.find((x) => x.nickname.toLowerCase() === nickname.trim().toLowerCase() && x.password === password && x.status !== 'banned'); if (!u) { setLoginError(t.loginError); return; } applyProfile(u); setApiError('API недоступне або PostgreSQL ще не запущено. Показано локальні seed-дані.'); setActiveTab('cabinet'); } }
  async function saveProfile(e) { e.preventDefault(); try { const u = await apiRequest('/profile', { method: 'PUT', body: JSON.stringify(profileForm) }, currentUser.id); applyProfile(u); await loadData(u); } catch (err) { setApiError(err.message); } }
  function logout() { setCurrentUser(null); setLeaderOrg(null); setProfileForm(emptyProfile); setData(seedData); setQuery(''); setActiveTab('cabinet'); }
  const reload = () => loadData(currentUser);
  async function saveRule(e) { e.preventDefault(); try { const body = JSON.stringify(ruleForm); if (editRuleId) await apiRequest(`/rules/${editRuleId}`, { method: 'PUT', body }, currentUser.id); else await apiRequest('/rules', { method: 'POST', body }, currentUser.id); setRuleForm(emptyRule); setEditRuleId(null); await reload(); } catch (err) { setApiError(err.message); } }
  async function removeRule(id) { try { await apiRequest(`/rules/${id}`, { method: 'DELETE' }, currentUser.id); await reload(); } catch (err) { setApiError(err.message); } }
  async function setAppStatus(id, status) { try { await apiRequest(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, currentUser.id); await reload(); } catch (err) { setApiError(err.message); } }
  async function submitApplication(e) { e.preventDefault(); if (!currentUser) { setActiveTab('cabinet'); return; } try { await apiRequest('/applications', { method: 'POST', body: JSON.stringify({ organizationId: Number(appForm.organizationId), type: appForm.type }) }, currentUser.id); setAppForm({ organizationId: '', type: 'join_organization' }); await reload(); } catch (err) { setApiError(err.message); } }
  async function addMember(e) { e.preventDefault(); try { await apiRequest(`/players/${memberUserId}/organization`, { method: 'PATCH', body: JSON.stringify({ organizationId: leaderOrg?.id }) }, currentUser.id); setMemberUserId(''); await reload(); } catch (err) { setApiError(err.message); } }
  async function removeMember(userId) { try { await apiRequest(`/players/${userId}/organization`, { method: 'PATCH', body: JSON.stringify({ organizationId: null }) }, currentUser.id); await reload(); } catch (err) { setApiError(err.message); } }
  async function createPunishment(e) { e.preventDefault(); try { await apiRequest('/punishments', { method: 'POST', body: JSON.stringify({ ...punishmentForm, userId: Number(punishmentForm.userId) }) }, currentUser.id); setPunishmentForm({ userId: '', type: 'warning', reason: '', endDate: '' }); await reload(); } catch (err) { setApiError(err.message); } }

  const rules = data.rules.filter((r) => (r.access === 'all' || currentUser?.role === 'admin' || r.access === currentUser?.role) && `${r.title} ${r.category} ${r.text}`.toLowerCase().includes(q));
  const apps = data.applications.filter((a) => `${a.applicant || usersById[a.applicantId]?.nickname || ''} ${a.status}`.toLowerCase().includes(q));
  const logs = data.logs.filter((l) => `${l.nickname || usersById[l.userId]?.nickname || ''} ${l.action}`.toLowerCase().includes(q));
  const filteredPlayers = data.players.filter((p) => `${p.nickname || usersById[p.userId]?.nickname || ''} ${p.organization || ''}`.toLowerCase().includes(q));
  const orgMembers = currentUser?.role === 'leader' && leaderOrg ? data.players.filter((p) => (p.organizationId || p.organization_id) === leaderOrg.id) : [];
  const freePlayers = data.players.filter((p) => !p.organizationId && !p.organization_id);

  return <div className="site-shell"><div className="hero-bg" /><header className="glass-header"><div className="brand-pill">RPMS</div><nav className="top-nav">{navTabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</nav><div className="header-actions"><button className={`dark-btn ${activeTab === 'cabinet' ? 'active' : ''}`} onClick={() => setActiveTab('cabinet')}>Кабінет →</button><button className={`accent-btn ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>Подати заявку</button></div></header><section className="hero-title"><h1>RP ROLE<br />MANAGEMENT</h1><p>Система керування правилами, ролями, організаціями та заявками RP-сервера</p></section><main className="landing-content">{apiError && <div className="warning-box">{apiError}</div>}{activeTab !== 'cabinet' && activeTab !== 'forum' && <div className="search-box"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук у поточному розділі..." /></div>}{activeTab === 'rules' && <RulesView rules={rules} user={currentUser} ruleForm={ruleForm} setRuleForm={setRuleForm} editRuleId={editRuleId} setEditRuleId={setEditRuleId} saveRule={saveRule} removeRule={removeRule} />}{activeTab === 'applications' && <ApplicationsView apps={apps} user={currentUser} organizations={data.organizations} appForm={appForm} setAppForm={setAppForm} submitApplication={submitApplication} change={setAppStatus} t={t} setActiveTab={setActiveTab} />}{activeTab === 'organizations' && <OrganizationsView organizations={data.organizations} />}{activeTab === 'players' && <PlayersView user={currentUser} players={filteredPlayers} usersById={usersById} orgsById={orgsById} leaderOrg={leaderOrg} orgMembers={orgMembers} freePlayers={freePlayers} memberUserId={memberUserId} setMemberUserId={setMemberUserId} addMember={addMember} removeMember={removeMember} />}{activeTab === 'forum' && <ForumPage user={currentUser} setActiveTab={setActiveTab} />}{activeTab === 'admin' && <AdminView user={currentUser} users={data.users} punishments={data.punishments} logs={logs} punishmentForm={punishmentForm} setPunishmentForm={setPunishmentForm} createPunishment={createPunishment} />}{activeTab === 'logs' && <LogsView logs={logs} />}{activeTab === 'cabinet' && <CabinetView user={currentUser} nickname={nickname} password={password} profileForm={profileForm} setProfileForm={setProfileForm} setNickname={setNickname} setPassword={setPassword} handleLogin={handleLogin} saveProfile={saveProfile} logout={logout} loginError={loginError} language={language} setLanguage={setLanguage} />}</main></div>;
}

export default App;
