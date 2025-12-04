/**
 * Session management utilities
 * Supports both cookie-based (preferred) and localStorage-based (fallback) authentication
 * This handles jurisdictions that may restrict cookie usage
 */

const SESSION_STORAGE_KEY = 'patreek_session';

/**
 * Get session token from localStorage (fallback for cookie-restricted jurisdictions)
 * @returns Session token if found in localStorage, null otherwise
 */
export function getSessionTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('[Session] Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Store session token in localStorage (fallback for cookie-restricted jurisdictions)
 * @param token Session token to store
 */
export function setSessionTokenInStorage(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  } catch (error) {
    console.warn('[Session] Failed to write to localStorage:', error);
  }
}

/**
 * Remove session token from localStorage
 */
export function removeSessionTokenFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('[Session] Failed to remove from localStorage:', error);
  }
}

/**
 * Get authentication headers for API requests
 * Returns headers with X-Session-Token if available in localStorage (fallback)
 * Cookie-based auth is handled automatically via credentials: 'include'
 * 
 * @returns Headers object with X-Session-Token if localStorage has token, empty object otherwise
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getSessionTokenFromStorage();
  if (token) {
    return {
      'X-Session-Token': token,
    };
  }
  return {};
}

