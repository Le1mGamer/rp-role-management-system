import { useEffect, useState } from 'react';
import { Users, Shield, FileText, ClipboardList, Building2, ScrollText, Search, LogOut } from 'lucide-react';
import { seedData } from './data/seedData.js';
import { translations } from './i18n/translations.js';
import { apiRequest } from './api/client.js';

const allTabs = [['dashboard',Shield],['players',Users],['rules',FileText],['applications',ClipboardList],['organizations',Building2],['punishments',Shield],['logs',ScrollText]];
const emptyRule = { category:'', title:'', text:'', access:'all' };

function App(){
  const [language,setLanguage]=useState('uk');
  const [activeTab,setActiveTab]=useState('dashboard');
  const [query,setQuery]=useState('');
  const [nickname,setNickname]=useState('John_Vancheti');
  const [password,setPassword]=useState('Player123!');
  const [currentUser,setCurrentUser]=useState(null);
  const [loginError,setLoginError]=useState('');
  const [apiError,setApiError]=useState('');
  const [data,setData]=useState(seedData);
  const [ruleForm,setRuleForm]=useState(emptyRule);
  const [editRuleId,setEditRuleId]=useState(null);
  const [punishmentForm,setPunishmentForm]=useState({ userId:'', type:'warning', reason:'', endDate:'' });
  const t=translations[language];
  const roleTabs=currentUser ? data.rolePermissions[currentUser.role] || ['dashboard'] : [];
  const visibleTabs=allTabs.filter(([id])=>roleTabs.includes(id));
  const allowed=roleTabs.includes(activeTab);
  const q=query.toLowerCase();

  async function loadData(user=currentUser){
    if(!user) return;
    try{
      const next={...data};
      next.rules=await apiRequest('/rules',{},user.id);
      next.organizations=await apiRequest('/organizations',{},user.id);
      next.applications=await apiRequest('/applications',{},user.id);
      if(['leader','admin'].includes(user.role)){ next.players=await apiRequest('/players',{},user.id); next.logs=await apiRequest('/logs',{},user.id); }
      if(user.role==='admin'){ next.users=await apiRequest('/users',{},user.id); next.punishments=await apiRequest('/punishments',{},user.id); }
      setData(next); setApiError('');
    }catch(_e){ setApiError('API недоступне або PostgreSQL ще не запущено. Показано локальні seed-дані.'); }
  }
  useEffect(()=>{ loadData(); },[currentUser]);

  async function handleLogin(e){
    e.preventDefault();
    try{
      const user=await apiRequest('/auth/login',{method:'POST',body:JSON.stringify({nickname,password})});
      setCurrentUser(user); setLoginError(''); setActiveTab((data.rolePermissions[user.role]||['dashboard'])[0]);
    }catch(_e){
      const user=seedData.users.find(u=>u.nickname.toLowerCase()===nickname.trim().toLowerCase() && u.password===password && u.status!=='banned');
      if(!user){ setLoginError(t.loginError); return; }
      setCurrentUser(user); setApiError('API недоступне або PostgreSQL ще не запущено. Показано локальні seed-дані.'); setActiveTab((seedData.rolePermissions[user.role]||['dashboard'])[0]);
    }
  }
  function logout(){ setCurrentUser(null); setData(seedData); setQuery(''); }
  async function saveRule(e){
    e.preventDefault();
    try{
      if(editRuleId) await apiRequest(`/rules/${editRuleId}`,{method:'PUT',body:JSON.stringify(ruleForm)},currentUser.id);
      else await apiRequest('/rules',{method:'POST',body:JSON.stringify(ruleForm)},currentUser.id);
      setRuleForm(emptyRule); setEditRuleId(null); await loadData(currentUser);
    }catch(e){ setApiError(e.message); }
  }
  async function removeRule(id){ try{ await apiRequest(`/rules/${id}`,{method:'DELETE'},currentUser.id); await loadData(currentUser); }catch(e){ setApiError(e.message); } }
  async function setAppStatus(id,status){ try{ await apiRequest(`/applications/${id}/status`,{method:'PATCH',body:JSON.stringify({status})},currentUser.id); await loadData(currentUser); }catch(e){ setApiError(e.message); } }
  async function createPunishment(e){
    e.preventDefault();
    try{ await apiRequest('/punishments',{method:'POST',body:JSON.stringify({...punishmentForm,userId:Number(punishmentForm.userId)})},currentUser.id); setPunishmentForm({ userId:'', type:'warning', reason:'', endDate:'' }); await loadData(currentUser); }catch(e){ setApiError(e.message); }
  }

  if(!currentUser){
    const demos=seedData.users.filter(u=>u.status==='active').slice(0,6);
    return <div className="login-page"><section className="login-card"><div className="brand login-brand"><div className="brand-mark">RP</div><div><h1>{t.appTitle}</h1><p>{t.subtitle}</p></div></div><div className="login-header"><h2>{t.loginTitle}</h2><p>{t.loginSubtitle}</p></div><form onSubmit={handleLogin} className="login-form"><label>{t.nicknameInput}<input value={nickname} onChange={e=>setNickname(e.target.value)}/></label><label>{t.passwordInput}<input type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{loginError&&<div className="error-box">{loginError}</div>}<button className="primary-btn">{t.signIn}</button></form><div className="login-tools"><label>{t.language}</label><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="uk">UA</option><option value="en">ENG</option></select></div><div className="demo-box"><h3>{t.demoAccounts}</h3>{demos.map(u=><button key={u.id} onClick={()=>{setNickname(u.nickname);setPassword(u.password)}}><b>{u.nickname}</b><span>{t[u.role]||u.role}</span><small>{u.password}</small></button>)}</div></section></div>;
  }

  const usersById=Object.fromEntries(data.users.map(u=>[u.id,u]));
  const orgsById=Object.fromEntries(data.organizations.map(o=>[o.id,o]));
  const filteredRules=data.rules.filter(r=>(r.access==='all'||r.access===currentUser.role||currentUser.role==='admin') && `${r.title} ${r.category}`.toLowerCase().includes(q));
  const filteredApps=data.applications.filter(a=>`${a.applicant||usersById[a.applicantId]?.nickname||''} ${a.status}`.toLowerCase().includes(q));
  const filteredLogs=data.logs.filter(l=>`${l.nickname||usersById[l.userId]?.nickname||''} ${l.action}`.toLowerCase().includes(q));

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">RP</div><div><h1>{t.appTitle}</h1><p>{t.subtitle}</p></div></div><div className="user-panel"><span>{t.currentUser}</span><b>{currentUser.nickname}</b><small>{t[currentUser.role]||currentUser.role}</small></div><nav>{visibleTabs.map(([id,Icon])=><button key={id} className={activeTab===id?'active':''} onClick={()=>setActiveTab(id)}><Icon size={18}/>{t[id]}</button>)}</nav><button className="logout-btn" onClick={logout}><LogOut size={18}/>{t.signOut}</button></aside><main className="content"><header className="topbar"><div><h2>{t[activeTab]}</h2><p>{t.subtitle}</p></div><div className="topbar-actions"><label>{t.language}</label><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="uk">UA</option><option value="en">ENG</option></select></div></header>{apiError&&<div className="warning-box">{apiError}</div>}{!allowed&&<div className="error-box">{t.accessDenied}</div>}{allowed&&activeTab!=='dashboard'&&<div className="search-box"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></div>}{allowed&&activeTab==='dashboard'&&<section className="dashboard-grid"><Stat title={t.activeUsers} value={data.users.filter(u=>u.status==='active').length}/><Stat title={t.pendingApplications} value={data.applications.filter(a=>a.status==='pending').length}/><Stat title={t.totalRules} value={filteredRules.length}/><Stat title={t.totalOrganizations} value={data.organizations.length}/><Panel title={t.availableSections}>{visibleTabs.map(([id])=><div className="row-line" key={id}><span>{t[id]}</span><b>✓</b></div>)}</Panel><Panel title={t.recentActivity}>{filteredLogs.slice(0,7).map(l=><div className="activity" key={l.id}><b>{l.nickname||usersById[l.userId]?.nickname}</b><span>{l.action}</span><small>{String(l.timestamp)}</small></div>)}</Panel></section>}{allowed&&activeTab==='rules'&&<><RuleForm user={currentUser} form={ruleForm} setForm={setRuleForm} save={saveRule} editId={editRuleId} cancel={()=>{setEditRuleId(null);setRuleForm(emptyRule)}}/><Cards items={filteredRules} user={currentUser} edit={r=>{setEditRuleId(r.id);setRuleForm({category:r.category,title:r.title,text:r.text,access:r.access})}} remove={removeRule}/></>}{allowed&&activeTab==='applications'&&<Applications apps={filteredApps} user={currentUser} t={t} change={setAppStatus}/>} {allowed&&activeTab==='players'&&<Table headers={[t.nickname,t.role,t.status,t.level,t.reputation,t.organization]} rows={data.players.map(p=>[p.nickname||usersById[p.userId]?.nickname,t[usersById[p.userId]?.role]||p.role,p.status||usersById[p.userId]?.status,p.level,p.reputation,p.organization||orgsById[p.organizationId]?.name||'-'])}/>} {allowed&&activeTab==='organizations'&&<Table headers={[t.organization,t.type,t.rating,t.members]} rows={data.organizations.map(o=>[o.name,o.type,o.rating,o.members])}/>} {allowed&&activeTab==='punishments'&&<><PunishmentForm users={data.users} form={punishmentForm} setForm={setPunishmentForm} save={createPunishment}/><Table headers={[t.nickname,t.type,t.reason,t.period]} rows={data.punishments.map(p=>[p.nickname||usersById[p.userId]?.nickname,p.type,p.reason,`${String(p.startDate)} - ${String(p.endDate)}`])}/></>} {allowed&&activeTab==='logs'&&<Table headers={[t.nickname,t.action,t.timestamp]} rows={filteredLogs.map(l=>[l.nickname||usersById[l.userId]?.nickname,l.action,String(l.timestamp)])}/>}</main></div>;
}
function RuleForm({user,form,setForm,save,editId,cancel}){ if(user.role!=='admin') return null; return <form className="action-form" onSubmit={save}><h3>{editId?'Редагування правила':'Додавання правила'}</h3><input placeholder="Категорія" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/><input placeholder="Назва" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><textarea placeholder="Текст правила" value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/><select value={form.access} onChange={e=>setForm({...form,access:e.target.value})}><option value="all">all</option><option value="player">player</option><option value="leader">leader</option><option value="admin">admin</option></select><div className="form-actions"><button className="primary-btn">Зберегти</button>{editId&&<button type="button" onClick={cancel}>Скасувати</button>}</div></form> }
function Applications({apps,user,t,change}){ return <div className="table-wrap"><table><thead><tr><th>{t.applicant}</th><th>{t.organization}</th><th>{t.type}</th><th>{t.status}</th><th>{t.submittedAt}</th>{['leader','admin'].includes(user.role)&&<th>Дії</th>}</tr></thead><tbody>{apps.map(a=><tr key={a.id}><td>{a.applicant}</td><td>{a.organization}</td><td>{a.type}</td><td>{t[a.status]||a.status}</td><td>{String(a.submittedAt)}</td>{['leader','admin'].includes(user.role)&&<td><button onClick={()=>change(a.id,'approved')}>Approve</button><button onClick={()=>change(a.id,'rejected')}>Reject</button></td>}</tr>)}</tbody></table></div> }
function PunishmentForm({users,form,setForm,save}){ return <form className="action-form" onSubmit={save}><h3>Видати покарання</h3><select value={form.userId} onChange={e=>setForm({...form,userId:e.target.value})}><option value="">Оберіть користувача</option>{users.map(u=><option key={u.id} value={u.id}>{u.nickname}</option>)}</select><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="warning">warning</option><option value="ban">ban</option></select><input placeholder="Причина" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/><input type="date" value={form.endDate} onChange={e=>setForm({...form,endDate:e.target.value})}/><button className="primary-btn">Застосувати</button></form> }
function Stat({title,value}){return <section className="stat-card"><span>{title}</span><strong>{value}</strong></section>}
function Panel({title,children}){return <section className="panel wide"><h3>{title}</h3>{children}</section>}
function Table({headers,rows}){return <div className="table-wrap"><table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((c,j)=><td key={j}>{c}</td>)}</tr>)}</tbody></table></div>}
function Cards({items,user,edit,remove}){return <div className="cards-grid">{items.map(item=><article className="info-card" key={item.id}><h3>{item.title}</h3><small>{item.category} · {item.access}</small><p>{item.text}</p>{user.role==='admin'&&<div className="form-actions"><button onClick={()=>edit(item)}>Редагувати</button><button onClick={()=>remove(item.id)}>Видалити</button></div>}</article>)}</div>}
export default App;
