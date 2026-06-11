import { supabase } from './supabase';

// Mistral chat history — conversation continuity across devices.
// Messages are pushed fire-and-forget as they happen; history is loaded
// once when the chat screen opens.

export interface StoredChatMessage {
  id:   string;
  role: 'bot' | 'user';
  text: string;
}

/** Fire-and-forget: persists a single chat message. */
export async function pushChatMessage(userId: string, msg: StoredChatMessage): Promise<void> {
  try {
    await supabase.from('chat_messages').upsert({
      user_id: userId,
      id:      msg.id,
      role:    msg.role,
      content: msg.text,
    });
  } catch { /* history is best-effort — no dirty flag, no retry */ }
}

/** Last `limit` messages in chronological order. */
export async function fetchChatHistory(userId: string, limit = 50): Promise<StoredChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.reverse().map((r) => ({
      id:   r.id as string,
      role: r.role as 'bot' | 'user',
      text: r.content as string,
    }));
  } catch {
    return [];
  }
}
