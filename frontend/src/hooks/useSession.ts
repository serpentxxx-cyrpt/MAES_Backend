import { useState } from 'react';
import api from '../lib/apiClient';

export interface Message {
  role: 'student' | 'tutor';
  text: string;
  bloom_tag?: string;
}

export function useSession(studentId: string, domain: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRegister, setCurrentRegister] = useState('socratic');

  const startSession = async () => {
    try {
      const { data } = await api.post('/session/start', { student_id: studentId, domain });
      setSessionId(data.session_id);
    } catch (e) {
      console.error('Failed to start session', e);
    }
  };

  const sendMessage = async (text: string) => {
    if (!sessionId) return;
    setLoading(true);
    setMessages((m) => [...m, { role: 'student', text }]);
    
    try {
      const { data } = await api.post('/turn/', { session_id: sessionId, student_message: text });
      setMessages((m) => [
        ...m, 
        { role: 'tutor', text: data.hint_text, bloom_tag: data.bloom_tag }
      ]);
      if (data.register) setCurrentRegister(data.register);
    } catch (e) {
      console.error('Failed to send message', e);
      setMessages((m) => [
        ...m, 
        { role: 'tutor', text: '[SYSTEM ERROR: Comm Link Failed]', bloom_tag: 'error' }
      ]);
    }
    setLoading(false);
  };

  const endSession = async () => {
    if (!sessionId) return;
    try {
      await api.post('/session/end', { session_id: sessionId });
      setSessionId(null);
    } catch (e) {
      console.error('Failed to end session', e);
    }
  };

  return { startSession, sendMessage, endSession, messages, loading, currentRegister, sessionId };
}
