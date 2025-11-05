const CACHE_PREFIX = 'patreek_article_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CachedArticle {
  data: any;
  timestamp: number;
}

export function getCachedArticle(id: number): any | null {
  try {
    const key = `${CACHE_PREFIX}${id}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }
    
    const parsed: CachedArticle = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired (7 days)
    if (now - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

export function setCachedArticle(id: number, data: any): void {
  const key = `${CACHE_PREFIX}${id}`;
  const cached: CachedArticle = {
    data,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If localStorage is full, try to clear old entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearExpiredCache();
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify(cached));
      } catch (retryError) {
        console.error('Failed to cache after cleanup:', retryError);
      }
    }
  }
}

function clearExpiredCache(): void {
  try {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed: CachedArticle = JSON.parse(cached);
            if (now - parsed.timestamp > CACHE_TTL) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Invalid cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

// Clean up expired cache on module load
if (typeof window !== 'undefined') {
  clearExpiredCache();
}

