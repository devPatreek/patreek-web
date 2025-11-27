const API_BASE_URL = 'https://api.patreek.com';

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

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  imageUrl?: string | null;
  subscribed?: boolean;
  children?: Category[];
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
  excerpt: string; // Backend uses "excerpt" not "description"
  body: string; // Backend uses "body" not "content"
  imageUrl: string;
  categoryName: string;
  categoryId: number;
  createdAt: string;
  sourceUrl?: string;
}

export interface Comment {
  author: string;
  body: string;
  createdAt: string;
  photoUrl?: string;
}

export interface CommentsResponse {
  content: Comment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface SignupPayload {
  name: string;
  username: string; // Required - all users must provide a username
  email: string;
  password: string;
  categoryIds: number[];
  countryCode?: string;
}

export interface SignupResponse {
  token?: string;
  refreshToken?: string;
  userId?: string;
}

export interface SigninPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UsernameAvailability {
  available: boolean;
  message: string;
}

export interface EmailAvailability {
  available: boolean;
  message: string;
}

export async function getPublicFeeds(): Promise<Feed[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Check for bypass parameter in URL for admin testing
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const bypass = urlParams?.get('bypass');
    const bypassParam = bypass === 'ag3nt007' ? '?bypass=ag3nt007' : '';
    const url = `${API_BASE_URL}/api/v1/feeds/public${bypassParam}`;
    
    const response = await fetch(url, {
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
    
    // Use /api/v1/feeds/{id} endpoint (not /public endpoint)
    // This endpoint handles both authenticated and public users
    // Check for bypass parameter in URL for admin testing
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const bypass = urlParams?.get('bypass');
    const bypassParam = bypass === 'ag3nt007' ? '?bypass=ag3nt007' : '';
    const url = `${API_BASE_URL}/api/v1/feeds/${id}${bypassParam}`;
    console.log(`[API] Fetching article ${id} from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      // Allow browser to cache the response
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Safari compatibility: explicitly set credentials mode
      credentials: 'omit', // Don't send cookies (public endpoint)
      mode: 'cors', // Explicitly set CORS mode for Safari
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
      
      if (response.status === 404 || response.status === 403) {
        if (isSafari) {
          console.error(`[API] Safari: Article ${id} returned ${response.status}. Check if this is a CORS issue or if article is actually not found.`);
        }
        console.warn(`[API] Article ${id} not found or not available (${response.status})`);
        return null; // Article not found or not available
      }
      
      // Log response headers for Safari debugging
      if (isSafari) {
        console.error(`[API] Safari: Failed to fetch feed ${id}: ${response.status}. Response headers:`, 
          Object.fromEntries(response.headers.entries()));
      }
      
      console.warn(`[API] Failed to fetch feed ${id}: ${response.status}`);
      return null;
    }
    
    // Safari compatibility: Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`[API] Unexpected content type: ${contentType}. Expected application/json`);
    }
    
    const data: FeedArticle = await response.json();
    console.log(`[API] Successfully fetched article ${id}:`, data.title);
    return data;
  } catch (error) {
    // Handle timeout and connection errors gracefully
    if (error instanceof Error) {
      const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
      
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('TIMED_OUT')) {
        console.warn(`[API] Connection timeout while fetching article ${id} - backend may be unavailable`);
      } else if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION') || error.message.includes('NetworkError')) {
        // Safari often reports CORS errors as "Failed to fetch" or "NetworkError"
        if (isSafari) {
          console.error(`[API] Safari CORS/Network error while fetching article ${id}. This might be a CORS configuration issue. Error:`, error.message);
        } else {
          console.warn(`[API] Connection error while fetching article ${id} - backend may be unavailable`);
        }
      } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        console.error(`[API] CORS error while fetching article ${id}. Check backend CORS configuration. Error:`, error.message);
      } else {
        console.warn(`[API] Error fetching feed ${id}:`, error.message);
      }
    } else {
      console.warn(`[API] Unknown error fetching feed ${id}:`, error);
    }
    return null;
  }
}

export async function getArticleComments(feedId: number, page: number = 0, size: number = 20): Promise<Comment[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/${feedId}/comments?page=${page}&size=${size}`, {
      method: 'GET',
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`[API] Failed to fetch comments for feed ${feedId}: ${response.status}`);
      return [];
    }
    
    const data: CommentsResponse = await response.json();
    return data.content || [];
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.warn(`[API] Connection timeout while fetching comments for feed ${feedId}`);
      } else {
        console.warn(`[API] Error fetching comments for feed ${feedId}:`, error.message);
      }
    } else {
      console.warn(`[API] Unknown error fetching comments for feed ${feedId}:`, error);
    }
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] Failed to fetch categories:', response.status);
      return [];
    }
    const data = await response.json();
    // Some backends return {categories: []}; normalize to array
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.content)) {
      return data.content;
    }
    if (Array.isArray(data?.categories)) {
      return data.categories;
    }
    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[API] Categories request timed out');
    } else {
      console.warn('[API] Error fetching categories', error);
    }
    return [];
  }
}

/**
 * Get ALL categories (public endpoint, no authentication required)
 * Returns hierarchical structure with parent categories and their children (subcategories)
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    console.log('[API] Fetching all categories from:', `${API_BASE_URL}/api/v1/categories`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log('[API] All categories response status:', response.status);
    if (!response.ok) {
      console.warn('[API] Failed to fetch all categories:', response.status, response.statusText);
      const errorText = await response.text();
      console.warn('[API] Error response body:', errorText);
      return [];
    }
    const data = await response.json();
    console.log('[API] All categories data received:', data);
    if (Array.isArray(data)) {
      console.log('[API] Returning', data.length, 'top-level categories');
      return data;
    }
    if (Array.isArray(data?.content)) {
      console.log('[API] Returning', data.content.length, 'categories from content');
      return data.content;
    }
    if (Array.isArray(data?.categories)) {
      console.log('[API] Returning', data.categories.length, 'categories from categories');
      return data.categories;
    }
    console.warn('[API] Unexpected data format:', data);
    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[API] All categories request timed out');
    } else {
      console.error('[API] Error fetching all categories', error);
    }
    return [];
  }
}

export async function getPublicCategories(): Promise<Category[]> {
  try {
    console.log('[API] Fetching public categories from:', `${API_BASE_URL}/api/v1/categories/public`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/public`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log('[API] Public categories response status:', response.status);
    if (!response.ok) {
      console.warn('[API] Failed to fetch public categories:', response.status, response.statusText);
      const errorText = await response.text();
      console.warn('[API] Error response body:', errorText);
      return [];
    }
    const data = await response.json();
    console.log('[API] Public categories data received:', data);
    if (Array.isArray(data)) {
      console.log('[API] Returning', data.length, 'categories');
      return data;
    }
    if (Array.isArray(data?.content)) {
      console.log('[API] Returning', data.content.length, 'categories from content');
      return data.content;
    }
    if (Array.isArray(data?.categories)) {
      console.log('[API] Returning', data.categories.length, 'categories from categories');
      return data.categories;
    }
    console.warn('[API] Unexpected data format:', data);
    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[API] Public categories request timed out');
    } else {
      console.error('[API] Error fetching public categories', error);
    }
    return [];
  }
}

export async function registerUser(payload: SignupPayload): Promise<SignupResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to sign up right now');
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Signup timed out, please try again');
    }
    throw error instanceof Error ? error : new Error('Unknown signup error');
  }
}

export async function loginUser(payload: SigninPayload): Promise<SignupResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to sign in right now');
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Sign in timed out, please try again');
    }
    throw error instanceof Error ? error : new Error('Unknown sign in error');
  }
}

export async function checkUsernameAvailability(username: string): Promise<UsernameAvailability> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/username/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        message: data?.data?.message || 'Username is available',
      };
    }
    // Try to parse JSON error response
    let message = 'Username is not available';
    try {
      const errorData = await response.json();
      // Extract message from API response structure
      message = errorData?.error?.message || errorData?.message || errorData?.data?.message || message;
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        message = text || message;
      } catch {
        // Use default message if all else fails
      }
    }
    
    if (response.status === 403) {
      return { available: false, message };
    }
    if (response.status === 400) {
      // Use the specific error message from the backend
      return { available: false, message };
    }
    return { available: false, message };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error instanceof Error ? error : new Error('Unable to check username');
  }
}

export async function checkEmailAvailability(email: string): Promise<EmailAvailability> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/user/email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        message: data?.data?.message || 'Email is available',
      };
    }
    // Try to parse JSON error response
    let message = 'Email is not available';
    try {
      const errorData = await response.json();
      // Extract message from API response structure
      message = errorData?.error?.message || errorData?.message || errorData?.data?.message || message;
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const text = await response.text();
        message = text || message;
      } catch {
        // Use default message if all else fails
      }
    }
    if (response.status === 403) {
      return { available: false, message: message || 'Email is already registered' };
    }
    if (response.status === 400) {
      return { available: false, message: message || 'Invalid email format' };
    }
    return { available: false, message };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error instanceof Error ? error : new Error('Unable to check email');
  }
}

/**
 * Get Cognito Hosted UI URL for social authentication (Google/Apple SSO)
 * Uses Cognito's Hosted UI directly, not Spring OAuth2
 * 
 * Note: You need to configure NEXT_PUBLIC_COGNITO_CLIENT_ID and NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN
 * in your environment variables or update the hardcoded values below.
 */
export function getSocialAuthUrl(provider: 'google' | 'apple', redirectUri: string) {
  // Cognito OAuth configuration
  // TODO: Move these to environment variables
  const OAUTH_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN || 'patreek-prod.auth.us-east-1.amazoncognito.com';
  const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || ''; // REQUIRED: Set this in your environment
  
  if (!CLIENT_ID) {
    console.error('[OAuth] Cognito CLIENT_ID is not configured. Please set NEXT_PUBLIC_COGNITO_CLIENT_ID environment variable.');
    throw new Error('OAuth configuration missing: CLIENT_ID is required');
  }
  
  const REDIRECT_URI = encodeURIComponent(redirectUri);
  
  // Cognito identity provider names (must match what's configured in Cognito)
  const providerMap: Record<string, string> = {
    google: 'Google',
    apple: 'SignInWithApple'
  };
  
  const identityProvider = providerMap[provider] || provider;
  
  // Cognito Hosted UI OAuth URL
  // Format: https://{domain}/oauth2/authorize?client_id={clientId}&response_type=code&scope=email+openid+profile&redirect_uri={redirectUri}&identity_provider={provider}
  const scope = encodeURIComponent('email openid profile aws.cognito.signin.user.admin');
  const cognitoUrl = `https://${OAUTH_DOMAIN}/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&scope=${scope}&redirect_uri=${REDIRECT_URI}&identity_provider=${identityProvider}`;
  
  console.log('[OAuth] Redirecting to Cognito Hosted UI:', cognitoUrl);
  return cognitoUrl;
}
