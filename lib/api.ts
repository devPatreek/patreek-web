const API_BASE_URL = 'https://patreekbackend-env.eba-ifvfvi7q.us-east-1.elasticbeanstalk.com';

export interface Feed {
  id: number;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedsResponse {
  content: Feed[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface FeedArticle {
  id: number;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export async function getPublicFeeds(): Promise<Feed[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/public`, {
      method: 'GET',
      // Allow browser to cache the response
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[API] Failed to fetch public feeds: ${response.status}`);
      return [];
    }
    
    const data: FeedsResponse = await response.json();
    // Limit to top 30 articles (API returns 20, but we'll slice if more come in future)
    const feeds = data.content || [];
    return feeds.slice(0, 30);
  } catch (error) {
    // Handle timeout and connection errors gracefully
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('TIMED_OUT')) {
        console.warn('[API] Connection timeout while fetching public feeds - backend may be unavailable');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION')) {
        console.warn('[API] Connection error while fetching public feeds - backend may be unavailable');
      } else {
        console.warn('[API] Error fetching public feeds:', error.message);
      }
    } else {
      console.warn('[API] Unknown error fetching public feeds:', error);
    }
    return [];
  }
}

export async function getPublicFeed(id: number): Promise<FeedArticle | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/public/${id}`, {
      method: 'GET',
      // Allow browser to cache the response
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return null; // Article not found or not public
      }
      console.warn(`[API] Failed to fetch public feed ${id}: ${response.status}`);
      return null;
    }
    
    const data: FeedArticle = await response.json();
    return data;
  } catch (error) {
    // Handle timeout and connection errors gracefully
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('TIMED_OUT')) {
        console.warn(`[API] Connection timeout while fetching article ${id} - backend may be unavailable`);
      } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION')) {
        console.warn(`[API] Connection error while fetching article ${id} - backend may be unavailable`);
      } else {
        console.warn(`[API] Error fetching public feed ${id}:`, error.message);
      }
    } else {
      console.warn(`[API] Unknown error fetching public feed ${id}:`, error);
    }
    return null;
  }
}

