import { SavedBizfitMap } from './types';

const STORAGE_KEY = 'bizfit_funnel_map_saved';

export function saveMapToStorage(data: SavedBizfitMap): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
    return false;
  }
}

export function loadMapFromStorage(): SavedBizfitMap | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedBizfitMap;
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return null;
  }
}

export function clearMapFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
}
