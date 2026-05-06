import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { ForumView } from './MainViews.jsx';

export default function ForumPage({ user, setActiveTab }) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');

  async function loadMessages() {
    if (!user) return;
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
  }, [user?.id]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!user || !messageText.trim()) return;
    try {
      await apiRequest('/forum/messages', { method: 'POST', body: JSON.stringify({ message: messageText }) }, user.id);
      setMessageText('');
      await loadMessages();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      {error && <div className="warning-box">{error}</div>}
      <ForumView user={user} messages={messages} messageText={messageText} setMessageText={setMessageText} sendMessage={sendMessage} setActiveTab={setActiveTab} />
    </>
  );
}
