import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-device flag: set whenever a fire-and-forget Supabase mutation fails
// (offline, network error, RLS…). On the next login hydration, the full local
// state is pushed to remote instead of letting remote-wins overwrite the
// unsynced local changes. Cleared only after a successful full push.

const KEY = 'dona-sync-dirty';

export async function markSyncDirty(): Promise<void> {
  try { await AsyncStorage.setItem(KEY, '1'); } catch { /* best effort */ }
}

export async function isSyncDirty(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return false; }
}

export async function clearSyncDirty(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch { /* best effort */ }
}
