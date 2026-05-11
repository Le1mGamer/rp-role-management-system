import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { Section, PunishmentNotice } from './MainViews.jsx';

function hasPunishment(user, type) {
  return (user?.punishments || []).some((item) => String(item.type).toLowerCase() === type);
}

function formatChatDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '--:--:--';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}:${mm}:${yy}`;
}

export default function ForumPage({ user, setActiveTab }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');

  const isBanned = hasPunishment(user, 'ban');
  const isMuted = hasPunishment(user, 'mute');

  async function loadMessages() {
    if (!user || isBanned) return;
    try {
      const data = await apiRequest('/forum/messages', {}, user.id);
      setMessages(data);
      setError('');
    } catch (err) {
      setMessages([]);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadMessages();
    const timer = setInterval(loadMessages, 5000);
    return () => clearInterval(timer);
  }, [user?.id, isBanned]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!user || isBanned || isMuted || !messageText.trim()) return;
    try {
      await apiRequest('/forum/messages', { method: 'POST', body: JSON.stringify({ message: messageText }) }, user.id);
      setMessageText('');
      await loadMessages();
    } catch (err) {
      setError(err.message);
    }
  }

  const sortedMessages = useMemo(() => [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)), [messages]);

  return (
    <Section title="Форумний чат" subtitle="Загальний чат для спілкування між гравцями.">
      {!user && <div className="warning-box">Для читання та надсилання повідомлень потрібно увійти в кабінет.</div>}
      {user && <PunishmentNotice user={user} />}
      {error && <div className="warning-box">{error}</div>}
      {!user && <button className="dark-btn" onClick={() => setActiveTab('cabinet')}>Перейти в кабінет</button>}
      {user && isBanned && <div className="error-box">Ban: читання чату та надсилання повідомлень заблоковано.</div>}
      {user && !isBanned && (
        <div className="forum-box">
          <div className="forum-messages">
            {!sortedMessages.length && <div className="chat-empty">Повідомлень ще немає. Напиши першим.</div>}
            {sortedMessages.map((message) => (
              <div className="chat-line" key={message.id}>
                <span className="chat-date">[{formatChatDate(message.createdAt)}]</span>{' '}
                <strong className="chat-nick">{message.nickname}</strong>{' '}
                <span className="chat-role">[{message.role}]</span>: {' '}
                <span className="chat-text">{message.message}</span>
              </div>
            ))}
          </div>
          <form className="forum-form" onSubmit={sendMessage}>
            <input
              disabled={isMuted}
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder={isMuted ? 'Mute: ти можеш читати чат, але не можеш писати.' : 'Написати повідомлення...'}
            />
            <button className="accent-btn" disabled={isMuted || !messageText.trim()}>Надіслати</button>
          </form>
          {isMuted && <div className="warning-box">Mute: тобі доступне читання чату, але надсилання повідомлень обмежено.</div>}
        </div>
      )}
    </Section>
  );
}
