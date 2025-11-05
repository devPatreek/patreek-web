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
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/public`, {
      // Allow browser to cache for 1 hour, then fetch fresh
      cache: 'default',
      headers: {
        'Cache-Control': 'public, max-age=3600', // 1 hour browser cache
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch public feeds: ${response.status}`);
    }
    
    const data: FeedsResponse = await response.json();
    // Limit to top 30 articles (API returns 20, but we'll slice if more come in future)
    const feeds = data.content || [];
    return feeds.slice(0, 30);
  } catch (error) {
    console.error('Error fetching public feeds:', error);
    return [];
  }
}

export async function getPublicFeed(id: number): Promise<FeedArticle | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/public/${id}`, {
      // Allow browser HTTP cache, but we'll use localStorage for 7-day TTL
      cache: 'default',
      headers: {
        'Cache-Control': 'public, max-age=604800', // 7 days browser HTTP cache
      },
    });
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 403) {
        return null; // Article not found or not public
      }
      throw new Error(`Failed to fetch public feed: ${response.status}`);
    }
    
    const data: FeedArticle = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching public feed:', error);
    return null;
  }
}

