import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { PunishmentForm } from './ActionForms.jsx';

const emptyOrg = { name: '', type: 'state', rating: 0 };
const isActivePunishment = (p) => !p.endDate || new Date(p.endDate) > new Date(new Date().toDateString());

export default function AdminTools({ user, users, punishments, logs, punishmentForm, setPunishmentForm, createPunishment }) {
  const [allUsers, setAllUsers] = useState(users || []);
  const [allPunishments, setAllPunishments] = useState(punishments || []);
  const [organizations, setOrganizations] = useState([]);
  const [orgForm, setOrgForm] = useState(emptyOrg);
  const [editOrgId, setEditOrgId] = useState(null);
  const [roleForm, setRoleForm] = useState({ userId: '', role: 'player', organizationId: '' });
  const [reportType, setReportType] = useState('activity');
  const [reportRows, setReportRows] = useState([]);
  const [message, setMessage] = useState('');

  async function loadAdminData() {
    if (!user) return;
    try {
      const [u, p, o] = await Promise.all([
        apiRequest('/users', {}, user.id),
        apiRequest('/punishments', {}, user.id),
        apiRequest('/organizations', {}, user.id),
      ]);
      setAllUsers(u);
      setAllPunishments(p);
      setOrganizations(o);
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => { loadAdminData(); }, [user?.id]);

  async function changeRole(event) {
    event.preventDefault();
    try {
      await apiRequest('/users/' + roleForm.userId + '/role', {
        method: 'PATCH',
        body: JSON.stringify({ role: roleForm.role, organizationId: roleForm.organizationId ? Number(roleForm.organizationId) : null })
      }, user.id);
      setRoleForm({ userId: '', role: 'player', organizationId: '' });
      await loadAdminData();
      setMessage('Роль користувача оновлено.');
    } catch (err) { setMessage(err.message); }
  }

  async function saveOrganization(event) {
    event.preventDefault();
    try {
      if (editOrgId) await apiRequest('/organizations/' + editOrgId, { method: 'PUT', body: JSON.stringify(orgForm) }, user.id);
      else await apiRequest('/organizations', { method: 'POST', body: JSON.stringify(orgForm) }, user.id);
      setOrgForm(emptyOrg);
      setEditOrgId(null);
      await loadAdminData();
      setMessage('Організацію збережено.');
    } catch (err) { setMessage(err.message); }
  }

  async function removeOrganization(id) {
    try {
      await apiRequest('/organizations/' + id, { method: 'DELETE' }, user.id);
      await loadAdminData();
      setMessage('Організацію видалено.');
    } catch (err) { setMessage(err.message); }
  }

  async function cancelPunishment(id) {
    try {
      await apiRequest('/punishments/' + id + '/cancel', { method: 'PATCH' }, user.id);
      await loadAdminData();
      setMessage('Покарання скасовано і воно більше не активне.');
    } catch (err) { setMessage(err.message); }
  }

  async function loadReport(type = reportType) {
    try {
      const rows = await apiRequest('/reports/' + type, {}, user.id);
      setReportRows(rows);
      setReportType(type);
    } catch (err) { setMessage(err.message); }
  }

  return <div className="admin-stack">
    {message && <div className="warning-box">{message}</div>}
    <div className="admin-grid">
      <PunishmentForm users={allUsers} form={punishmentForm} setForm={setPunishmentForm} onSubmit={createPunishment} />
      <form className="action-form" onSubmit={changeRole}>
        <h3>Керування ролями</h3>
        <select required value={roleForm.userId} onChange={(e) => setRoleForm({ ...roleForm, userId: e.target.value })}>
          <option value="">Оберіть користувача</option>
          {allUsers.map((u) => <option key={u.id} value={u.id}>{u.nickname} · {u.role}</option>)}
        </select>
        <select value={roleForm.role} onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}>
          <option value="player">player</option>
          <option value="leader">leader</option>
          <option value="admin">admin</option>
        </select>
        {roleForm.role === 'leader' && <select required value={roleForm.organizationId} onChange={(e) => setRoleForm({ ...roleForm, organizationId: e.target.value })}>
          <option value="">Організація для лідера</option>
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>}
        <button className="primary-btn">Оновити роль</button>
      </form>

      <form className="action-form" onSubmit={saveOrganization}>
        <h3>{editOrgId ? 'Редагування організації' : 'Створення організації'}</h3>
        <input placeholder="Назва" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
        <select value={orgForm.type} onChange={(e) => setOrgForm({ ...orgForm, type: e.target.value })}>
          <option value="state">state</option><option value="family">family</option><option value="private">private</option>
        </select>
        <input type="number" step="0.1" placeholder="Рейтинг" value={orgForm.rating} onChange={(e) => setOrgForm({ ...orgForm, rating: Number(e.target.value) })} />
        <div className="form-actions"><button className="primary-btn">Зберегти</button>{editOrgId && <button type="button" onClick={() => { setEditOrgId(null); setOrgForm(emptyOrg); }}>Скасувати</button>}</div>
      </form>

      <div className="mini-card">
        <h3>Покарання</h3>
        {allPunishments.map((p) => {
          const active = p.active !== undefined ? p.active : isActivePunishment(p);
          return <p key={p.id}>{p.nickname}: {String(p.type).toUpperCase()} — {p.reason} <b className={active ? 'status-active' : 'status-inactive'}>{active ? 'Активне' : 'Неактивне'}</b> {active && <button onClick={() => cancelPunishment(p.id)}>Скасувати</button>}</p>;
        })}
      </div>

      <div className="mini-card wide">
        <h3>Організації</h3>
        {organizations.map((o) => <p key={o.id}>{o.name} · {o.type} · rating {o.rating} <button onClick={() => { setEditOrgId(o.id); setOrgForm({ name: o.name, type: o.type, rating: Number(o.rating) }); }}>Редагувати</button><button onClick={() => removeOrganization(o.id)}>Видалити</button></p>)}
      </div>

      <div className="mini-card wide">
        <h3>Звіти</h3>
        <div className="form-actions">
          {['activity','players','organizations','applications','punishments'].map((type) => <button key={type} onClick={() => loadReport(type)}>{type}</button>)}
        </div>
        <div className="report-box"><pre>{JSON.stringify(reportRows, null, 2)}</pre></div>
      </div>

      <div className="mini-card wide"><h3>Останні логи</h3>{logs.slice(0, 8).map((l) => <p key={l.id}>{l.nickname}: {l.action}</p>)}</div>
    </div>
  </div>;
}
