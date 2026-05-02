import { useMemo, useState } from 'react';
import { Users, Shield, FileText, ClipboardList, Building2, ScrollText, Search } from 'lucide-react';
import { seedData } from './data/seedData.js';
import { translations } from './i18n/translations.js';

const tabs = [
  ['dashboard', Shield],
  ['players', Users],
  ['rules', FileText],
  ['applications', ClipboardList],
  ['organizations', Building2],
  ['punishments', Shield],
  ['logs', ScrollText]
];

function App() {
  const [language, setLanguage] = useState('uk');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [query, setQuery] = useState('');
  const t = translations[language];
  const usersById = useMemo(() => Object.fromEntries(seedData.users.map((u) => [u.id, u])), []);
  const orgsById = useMemo(() => Object.fromEntries(seedData.organizations.map((o) => [o.id, o])), []);
  const q = query.toLowerCase();
  const activeUsers = seedData.users.filter((u) => u.status === 'active').length;
  const waitingApps = seedData.applications.filter((a) => a.status === 'pending').length;

  const filteredUsers = seedData.users.filter((u) => `${u.nickname} ${u.role} ${u.status}`.toLowerCase().includes(q));
  const filteredRules = seedData.rules.filter((r) => `${r.title} ${r.category} ${r.text}`.toLowerCase().includes(q));
  const filteredApps = seedData.applications.filter((a) => `${usersById[a.applicantId]?.nickname} ${a.status}`.toLowerCase().includes(q));
  const filteredOrgs = seedData.organizations.filter((o) => `${o.name} ${o.type}`.toLowerCase().includes(q));
  const filteredPunishments = seedData.punishments.filter((p) => `${usersById[p.userId]?.nickname} ${p.type} ${p.reason}`.toLowerCase().includes(q));
  const filteredLogs = seedData.logs.filter((l) => `${usersById[l.userId]?.nickname} ${l.action}`.toLowerCase().includes(q));

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">RP</div><div><h1>{t.appTitle}</h1><p>{t.subtitle}</p></div></div>
      <nav>{tabs.map(([id, Icon]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}><Icon size={18}/>{t[id]}</button>)}</nav>
    </aside>
    <main className="content">
      <header className="topbar"><div><h2>{t[activeTab]}</h2><p>{t.subtitle}</p></div><div className="topbar-actions"><label>{t.language}</label><select value={language} onChange={(e) => setLanguage(e.target.value)}><option value="uk">UA</option><option value="en">ENG</option></select></div></header>
      {activeTab !== 'dashboard' && <div className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search}/></div>}
      {activeTab === 'dashboard' && <section className="dashboard-grid"><Stat title={t.activeUsers} value={activeUsers}/><Stat title={t.pendingApplications} value={waitingApps}/><Stat title={t.totalRules} value={seedData.rules.length}/><Stat title={t.totalOrganizations} value={seedData.organizations.length}/><Panel title={t.roleDistribution}>{['player','leader','admin'].map((role) => <div className="row-line" key={role}><span>{t[role]}</span><b>{seedData.users.filter((u) => u.role === role).length}</b></div>)}</Panel><Panel title={t.recentActivity}>{seedData.logs.map((log) => <div className="activity" key={log.id}><b>{usersById[log.userId]?.nickname}</b><span>{log.action}</span><small>{log.timestamp}</small></div>)}</Panel></section>}
      {activeTab === 'players' && <Table headers={[t.nickname,t.role,t.status,t.level,t.reputation,t.organization]} rows={filteredUsers.map((u) => { const p = seedData.players.find((x) => x.userId === u.id); return [u.nickname, t[u.role] || u.role, t[u.status] || u.status, p?.level ?? '-', p?.reputation ?? '-', orgsById[p?.organizationId]?.name ?? '-']; })}/>} 
      {activeTab === 'rules' && <Cards items={filteredRules.map((r) => ({title:r.title, meta:`${r.category} · ${t.access}: ${r.access} · ${t.updatedAt}: ${r.updatedAt}`, text:r.text}))}/>} 
      {activeTab === 'applications' && <Table headers={[t.applicant,t.organization,t.type,t.status,t.submittedAt]} rows={filteredApps.map((a) => [usersById[a.applicantId]?.nickname, orgsById[a.organizationId]?.name, a.type, t[a.status] || a.status, a.submittedAt])}/>} 
      {activeTab === 'organizations' && <Table headers={[t.organization,t.type,t.rating,t.members]} rows={filteredOrgs.map((o) => [o.name, o.type, o.rating, o.members])}/>} 
      {activeTab === 'punishments' && <Table headers={[t.nickname,t.type,t.reason,t.period]} rows={filteredPunishments.map((p) => [usersById[p.userId]?.nickname, p.type, p.reason, `${p.startDate} - ${p.endDate}`])}/>} 
      {activeTab === 'logs' && <Table headers={[t.nickname,t.action,t.timestamp]} rows={filteredLogs.map((l) => [usersById[l.userId]?.nickname, l.action, l.timestamp])}/>} 
    </main>
  </div>;
}
function Stat({ title, value }) { return <section className="stat-card"><span>{title}</span><strong>{value}</strong></section>; }
function Panel({ title, children }) { return <section className="panel wide"><h3>{title}</h3>{children}</section>; }
function Table({ headers, rows }) { return <div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>; }
function Cards({ items }) { return <div className="cards-grid">{items.map((item) => <article className="info-card" key={item.title}><h3>{item.title}</h3><small>{item.meta}</small><p>{item.text}</p></article>)}</div>; }
export default App;
