// Collision-resistant ID for local entities (activities, custom categories).
// Date.now() alone can collide across devices syncing to the same account.
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
