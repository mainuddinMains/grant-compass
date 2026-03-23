import type { GrantProps } from '@/components/GrantCard';

export const SAVED_KEY = 'grant_compass_saved';

export interface SavedGrant extends GrantProps {
  savedAt: number;
  savedId: string;
}

export function savedGrantId(grant: Pick<GrantProps, 'title' | 'agency'>): string {
  return `${grant.agency}::${grant.title}`;
}

export function getSavedGrants(): SavedGrant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SavedGrant[]) : [];
  } catch {
    return [];
  }
}

export function saveGrant(grant: GrantProps): void {
  const id = savedGrantId(grant);
  const current = getSavedGrants().filter((g) => g.savedId !== id);
  const entry: SavedGrant = { ...grant, savedAt: Date.now(), savedId: id };
  localStorage.setItem(SAVED_KEY, JSON.stringify([entry, ...current]));
}

export function unsaveGrant(id: string): void {
  const next = getSavedGrants().filter((g) => g.savedId !== id);
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
}

export function isGrantSaved(grant: Pick<GrantProps, 'title' | 'agency'>): boolean {
  return getSavedGrants().some((g) => g.savedId === savedGrantId(grant));
}
