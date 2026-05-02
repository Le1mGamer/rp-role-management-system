export function ApplicationForm({ user, organizations, form, setForm, onSubmit }) {
  if (user.role !== 'player') return null;
  return (
    <form className="action-form" onSubmit={onSubmit}>
      <h3>Подати заявку</h3>
      <select required value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
        <option value="">Оберіть організацію</option>
        {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
      </select>
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        <option value="join_organization">join_organization</option>
        <option value="rank_update">rank_update</option>
      </select>
      <button className="primary-btn">Надіслати заявку</button>
    </form>
  );
}

export function LeaderMembers({ user, organization, members, freePlayers, memberUserId, setMemberUserId, onAdd, onRemove }) {
  if (user.role !== 'leader') return null;
  return (
    <section className="action-form">
      <h3>Склад організації: {organization?.name || '-'}</h3>
      <form className="inline-form" onSubmit={onAdd}>
        <select required value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}>
          <option value="">Оберіть вільного гравця</option>
          {freePlayers.map((player) => <option key={player.userId} value={player.userId}>{player.nickname}</option>)}
        </select>
        <button className="primary-btn">Додати до організації</button>
      </form>
      <div className="mini-list">
        {members.map((member) => (
          <div className="row-line" key={member.userId}>
            <span>{member.nickname} · reputation {member.reputation}</span>
            <button onClick={() => onRemove(member.userId)}>Видалити</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RuleForm({ user, form, setForm, onSubmit, editId, onCancel }) {
  if (user.role !== 'admin') return null;
  return (
    <form className="action-form" onSubmit={onSubmit}>
      <h3>{editId ? 'Редагування правила' : 'Додавання правила'}</h3>
      <input placeholder="Категорія" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
      <input placeholder="Назва" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Текст правила" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
      <select value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })}>
        <option value="all">all</option>
        <option value="player">player</option>
        <option value="leader">leader</option>
        <option value="admin">admin</option>
      </select>
      <div className="form-actions">
        <button className="primary-btn">Зберегти</button>
        {editId && <button type="button" onClick={onCancel}>Скасувати</button>}
      </div>
    </form>
  );
}

export function PunishmentForm({ users, form, setForm, onSubmit }) {
  return (
    <form className="action-form" onSubmit={onSubmit}>
      <h3>Видати покарання</h3>
      <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
        <option value="">Оберіть користувача</option>
        {users.map((user) => <option key={user.id} value={user.id}>{user.nickname}</option>)}
      </select>
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        <option value="warning">warning</option>
        <option value="ban">ban</option>
      </select>
      <input placeholder="Причина" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
      <button className="primary-btn">Застосувати</button>
    </form>
  );
}
