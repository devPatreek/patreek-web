import { getAuthHeaders, getSessionTokenFromStorage, setSessionTokenInStorage, removeSessionTokenFromStorage } from './session';

const isBrowser = typeof window !== 'undefined';

const LOCAL_API_FALLBACK = process.env.NEXT_PUBLIC_LOCAL_API_URL || 'http://localhost:5555';
const DEFAULT_REMOTE_API = 'https://api.patreek.com';

const sanitizeBaseUrl = (value?: string | null) => {
  if (!value) {
    return '';
  }
  let normalized = value.trim();
  if (!normalized) {
    return '';
  }
  normalized = normalized.replace(/\/+$/, '');
  normalized = normalized.replace(/\/api(\/v1)?$/i, '');
  return normalized || '';
};

const detectRuntimeApiBase = () => {
  if (!isBrowser) {
    return null;
  }
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return LOCAL_API_FALLBACK;
  }
  return null;
};

const resolvedPublicBase =
  sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
  sanitizeBaseUrl(detectRuntimeApiBase()) ||
  sanitizeBaseUrl(process.env.NODE_ENV === 'development' ? LOCAL_API_FALLBACK : DEFAULT_REMOTE_API);

const resolvedInternalBase =
  sanitizeBaseUrl(process.env.INTERNAL_API_URL) ||
  sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_URL) ||
  sanitizeBaseUrl(process.env.NODE_ENV === 'development' ? LOCAL_API_FALLBACK : DEFAULT_REMOTE_API);

export const API_BASE_URL = (isBrowser ? resolvedPublicBase : resolvedInternalBase) || DEFAULT_REMOTE_API;

export interface Feed {
  id: number;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  source?: string;
  publishedAt?: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  pats?: number;
  shares?: number;
  comments?: number;
  isPublic?: boolean;
}

export interface Category {
  id: number;
  name: string;
  parentId?: number | null;
  imageUrl?: string | null;
  subscribed?: boolean;
  children?: Category[];
}

export interface UserProfile {
  id?: number | string;
  name?: string;
  username?: string;
  email?: string;
  fullName?: string;
  createdAt?: string;
  totalPats?: number;
  totalShares?: number;
  totalComments?: number;
  coins?: number;
  patCoins?: number;
  xp?: number;
  dailyXp?: number;
  dailyCap?: number;
  adSlots?: number;
  countryCode?: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  rank?: {
    name?: string;
    level?: number;
  } | null;
  website?: string;
  location?: string;
}

export interface MiniFeedItem {
  id: number | string;
  title: string;
  link?: string;
  categoryName?: string;
  imageUrl?: string;
  createdAt?: string;
  engagementScore?: number;
}

export interface EconomyMetadata {
  currency: string;
  unitPrice: number;
  marketCap: number;
}

// Community models
export type LeaderboardMetric = 'shares' | 'comments' | 'pats' | 'coins';

export interface LeaderboardEntry {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  total: number;
  rank: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  text: string;
  createdAt: string;
}

export type NotificationType =
  | 'tip_received'
  | 'comment_reply'
  | 'pat_received'
  | 'share_milestone'
  | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  actorUsername?: string;
  resourceType?: string;
  resourceId?: string;
  isRead: boolean;
  createdAt: string;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
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
  summaryType?: 'EXTRACTIVE' | 'AI_GENERATED';
  viewCount?: number;
  totalPats?: number;
  totalShares?: number;
  totalComments?: number;
  isPublic?: boolean;
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

export interface CreateCommentPayload {
  body: string;
  parentId?: number;
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

export interface ResetPasswordRequestPayload {
  email: string;
}

export interface ResetPasswordConfirmPayload {
  token: string;
  newPassword: string;
}

export interface UsernameAvailability {
  available: boolean;
  message: string;
}

export interface EmailAvailability {
  available: boolean;
  message: string;
}

export interface FeedQueryParams {
  query?: string;
  categoryId?: number;
}

export async function getPublicFeeds(params: FeedQueryParams = {}): Promise<Feed[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const searchParams = new URLSearchParams({
      page: '0',
      size: '30',
    });

    if (params.query && params.query.trim().length > 0) {
      searchParams.set('query', params.query.trim());
    }

    if (typeof params.categoryId === 'number') {
      searchParams.set('categoryId', params.categoryId.toString());
    }

    // Preserve bypass parameter in URL for admin testing
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const bypass = urlParams?.get('bypass');
    if (bypass === 'ag3nt007') {
      searchParams.set('bypass', 'ag3nt007');
    }

    const url = `${API_BASE_URL}/api/v1/feeds/public?${searchParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      cache: 'default',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[API] Failed to fetch public feeds: ${response.status}`);
      return [];
    }

    const data: FeedsResponse = await response.json();
    const feeds = data.content || [];
    return feeds.slice(0, 30);
  } catch (error) {
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

export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/user/profile/username/${encodeURIComponent(username)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found
      }
      console.warn('[API] Failed to fetch user profile by username:', response.status);
      return null;
    }
    
    const data = await response.json();
    const profile = data.data || data || null;
    return applyAvatarCache(profile, username);
  } catch (error) {
    console.warn('[API] Error fetching user profile by username', error);
    return null;
  }
}

export async function getEconomyMetadata(): Promise<EconomyMetadata | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/economy/metadata`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[API] Failed to fetch coin metadata:', response.status);
      return null;
    }

    const payload = await response.json();
    const data = payload?.data ?? payload;
    if (!data) {
      return null;
    }

    const currency = typeof data.currency === 'string' ? data.currency : 'PAT';
    const unitPrice = Number(data.unitPrice);
    const marketCap = Number(data.marketCap);

    return {
      currency,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0.01,
      marketCap: Number.isFinite(marketCap) ? marketCap : 0,
    };
  } catch (error) {
    console.warn('[API] Error fetching coin metadata', error);
    return null;
  }
}

export async function getUserProfile(token?: string): Promise<UserProfile | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    
    // Priority: 1. Explicit token parameter, 2. localStorage token, 3. Cookie (via credentials)
    if (token) {
      Object.assign(headers, authHeaders(token));
    } else {
      // Add localStorage token as header (fallback for cookie-restricted jurisdictions)
      Object.assign(headers, getAuthHeaders());
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies (preferred method)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] Failed to fetch user profile:', response.status);
      return null;
    }
    const data = await response.json();
    const profile = data.data || data || null;
    return applyAvatarCache(profile);
  } catch (error) {
    console.warn('[API] Error fetching user profile', error);
    return null;
  }
}

export async function getUserCategoriesAuth(token?: string): Promise<Category[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    
    // Priority: 1. Explicit token parameter, 2. localStorage token, 3. Cookie (via credentials)
    if (token) {
      Object.assign(headers, authHeaders(token));
    } else {
      Object.assign(headers, getAuthHeaders());
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies (preferred method)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] Failed to fetch user categories:', response.status);
      return [];
    }
    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.categories)) return data.categories;
    return [];
  } catch (error) {
    console.warn('[API] Error fetching user categories', error);
    return [];
  }
}

export async function getUserFeedsAuth(token?: string): Promise<Feed[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    
    // Priority: 1. Explicit token parameter, 2. localStorage token, 3. Cookie (via credentials)
    if (token) {
      Object.assign(headers, authHeaders(token));
    } else {
      Object.assign(headers, getAuthHeaders());
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies (preferred method)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] Failed to fetch user feeds:', response.status);
      return [];
    }
    const data: FeedsResponse = await response.json();
    return data.content || [];
  } catch (error) {
    console.warn('[API] Error fetching user feeds', error);
    return [];
  }
}

export async function getUserFeedsByCategoryAuth(token: string | undefined, categoryId: number): Promise<Feed[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    
    // Priority: 1. Explicit token parameter, 2. localStorage token, 3. Cookie (via credentials)
    if (token) {
      Object.assign(headers, authHeaders(token));
    } else {
      Object.assign(headers, getAuthHeaders());
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/category/${categoryId}`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies (preferred method)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] Failed to fetch feeds for category:', response.status);
      return [];
    }
    const data: FeedsResponse = await response.json();
    return data.content || [];
  } catch (error) {
    console.warn('[API] Error fetching category feeds', error);
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

export async function postArticleComment(feedId: number, payload: CreateCommentPayload): Promise<Comment> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/feeds/${feedId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      let message = 'Unable to add comment right now.';
      try {
        const error = await response.json();
        message =
          error?.error?.message ||
          error?.message ||
          error?.data?.message ||
          message;
      } catch {
        try {
          const text = await response.text();
          if (text) {
            message = text;
          }
        } catch {
          // ignore parse failures
        }
      }
      throw new Error(message);
    }
    const data = await response.json();
    return data?.data || data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Comment request timed out. Please try again.');
    }
    throw error instanceof Error ? error : new Error('Failed to post comment.');
  } finally {
    clearTimeout(timeoutId);
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
      credentials: 'include', // Include cookies in request (preferred method)
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to sign up right now');
    }
    const data = await response.json();
    
    // Store session token in localStorage as fallback for cookie-restricted jurisdictions
    // Backend sets HTTP-only cookie (preferred), but we also store in localStorage
    // Backend will check cookie first, then X-Session-Token header from localStorage
    if (data.token) {
      setSessionTokenInStorage(data.token);
    } else if (data.data?.token) {
      setSessionTokenInStorage(data.data.token);
    }
    
    return data;
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
      credentials: 'include', // Include cookies in request (preferred method)
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Unable to sign in right now');
    }
    const data = await response.json();
    
    // Store session token in localStorage as fallback for cookie-restricted jurisdictions
    // Backend sets HTTP-only cookie (preferred), but we also store in localStorage
    // Backend will check cookie first, then X-Session-Token header from localStorage
    if (data.token) {
      setSessionTokenInStorage(data.token);
    } else if (data.data?.token) {
      setSessionTokenInStorage(data.data.token);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Sign in timed out, please try again');
    }
    throw error instanceof Error ? error : new Error('Unknown sign in error');
  }
}

export async function requestPasswordReset(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email } as ResetPasswordRequestPayload),
    });
    return response.ok;
  } catch (error) {
    console.warn('[API] Error requesting password reset', error);
    return false;
  }
}

export async function confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ token, newPassword } as ResetPasswordConfirmPayload),
    });
    return response.ok;
  } catch (error) {
    console.warn('[API] Error confirming password reset', error);
    return false;
  }
}

/**
 * Check if user has a valid session
 * Uses /api/v1/user/auth-status endpoint which returns AuthStatusDto directly
 * Tries cookie first (preferred), then localStorage token as header (fallback)
 */
export async function checkSessionStatus(): Promise<{ authenticated: boolean; message?: string; userId?: string; username?: string; email?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Get auth headers from localStorage (fallback for cookie-restricted jurisdictions)
    const authHeaders = getAuthHeaders();
    
    // Use /api/v1/user/auth-status instead of deprecated /api/v1/auth/session
    const response = await fetch(`${API_BASE_URL}/api/v1/user/auth-status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeaders, // Include X-Session-Token header if available in localStorage
      },
      credentials: 'include', // Include cookies in request (preferred method)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      return { authenticated: false };
    }
    // AuthStatusDto is returned directly (not wrapped in ApiResponse.data)
    const data = await response.json();
    return {
      authenticated: data.authenticated === true,
      userId: data.userId,
      username: data.username,
      email: data.email,
      message: data.authenticated ? 'Authenticated' : 'Not authenticated',
    };
  } catch (error) {
    console.warn('[API] Error checking session status:', error);
    return { authenticated: false };
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

// Community APIs
export async function getTopCoinHolder(): Promise<{ username?: string; name?: string; patCoins?: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(`${API_BASE_URL}/api/v1/analytics/top-coin-holder`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] Failed to fetch top coin holder:', response.status);
      return {};
    }
    const data = await response.json();
    return {
      username: data.username,
      name: data.name,
      patCoins: data.patCoins,
    };
  } catch (error) {
    console.warn('[API] Error fetching top coin holder:', error);
    return {};
  }
}

function normalizeMiniFeedItems(payload: any): MiniFeedItem[] {
  if (!payload) return [];
  const data = payload.data || payload.content || payload.items || payload.trendingFeeds || payload;
  if (!Array.isArray(data)) return [];
  return data
    .map((item: any) => ({
      id: item.id ?? item.feedId ?? item.slug ?? Math.random().toString(),
      title: item.title ?? item.name ?? 'Untitled',
      link: item.link ?? item.url ?? (item.id ? `/pat/${item.id}` : undefined),
      categoryName: item.categoryName ?? item.category ?? item.type,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      engagementScore: item.engagementScore ?? item.count ?? item.score,
    }))
    .filter((item: MiniFeedItem) => Boolean(item.title));
}

/**
 * Fetch the most recently read articles for a specific user.
 * Falls back to global "top-5-recently-read-articles" if a user-specific endpoint isn't available yet.
 */
export async function getUserRecentReads(username: string): Promise<MiniFeedItem[]> {
  const candidates = [
    `${API_BASE_URL}/api/v1/analytics/user/${encodeURIComponent(username)}/recently-read`,
    `${API_BASE_URL}/api/v1/analytics/user/${encodeURIComponent(username)}/top-5-recently-read`,
    `${API_BASE_URL}/api/v1/analytics/top-5-recently-read-articles`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const items = normalizeMiniFeedItems(data);
      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      console.warn('[API] recent reads request failed', error);
    }
  }

  return [];
}

/**
 * Fetch the most recently patted articles for a specific user.
 * Falls back to global "top-5-most-patted-articles" if a user-specific endpoint isn't available yet.
 */
export async function getUserRecentPats(username: string): Promise<MiniFeedItem[]> {
  const candidates = [
    `${API_BASE_URL}/api/v1/analytics/user/${encodeURIComponent(username)}/recent-pats`,
    `${API_BASE_URL}/api/v1/analytics/user/${encodeURIComponent(username)}/top-5-pats`,
    `${API_BASE_URL}/api/v1/analytics/top-5-most-patted-articles`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const items = normalizeMiniFeedItems(data);
      if (items.length > 0) {
        return items;
      }
    } catch (error) {
      console.warn('[API] recent pats request failed', error);
    }
  }

  return [];
}

export async function getCommunityLeaderboard(metric: LeaderboardMetric, limit = 10): Promise<LeaderboardEntry[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/community/leaderboard?metric=${metric}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] leaderboard request failed', response.status);
      return mockLeaderboard(metric);
    }
    const data = await response.json();
    const entries: LeaderboardEntry[] =
      data?.data || data?.content || data || [];
    return entries.map((item: any, idx: number) => {
      const rankValue =
        typeof item.rank === 'number'
          ? item.rank
          : typeof item.rank?.level === 'number'
          ? item.rank.level
          : idx + 1;

      return {
        username: item.username || item.name || `user-${idx + 1}`,
        displayName: item.displayName || item.name,
        avatarUrl: item.avatarUrl,
        total: item.total ?? item.score ?? 0,
        rank: rankValue,
      };
    });
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[API] leaderboard error', error);
    return mockLeaderboard(metric);
  }
}

export async function getCommunityChatHistory(roomId = 'global', cursor?: string): Promise<ChatMessage[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(`${API_BASE_URL}/api/v1/community/chat/history`);
    url.searchParams.set('roomId', roomId);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] chat history request failed', response.status);
      return mockChat();
    }
    const data = await response.json();
    return (data?.data || data?.messages || data || []).map((m: any, idx: number) => ({
      id: m.id?.toString() || `${roomId}-${idx}`,
      username: m.username || m.user || 'anon',
      displayName: m.displayName || m.name,
      avatarUrl: m.avatarUrl,
      text: m.text || m.message || '',
      createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[API] chat history error', error);
    return mockChat();
  }
}

export async function sendCommunityChatMessage(
  roomId: string,
  text: string,
  command?: { name: string; args?: string[] }
): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const body: Record<string, any> = { roomId, text };
    if (command?.name) {
      body.command = command.name;
      if (command.args) body.args = command.args;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/community/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] chat send failed', response.status);
      return false;
    }
    return true;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[API] chat send error', error);
    return false;
  }
}

export async function getNotifications(limit = 20): Promise<NotificationItem[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications?limit=${limit}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] notifications request failed', response.status);
      return mockNotifications();
    }
    const data = await response.json();
    return (data?.data || data?.content || data || []).map((n: any, idx: number) => ({
      id: String(n.id ?? `notif-${idx}`),
      type: n.type ?? 'system',
      title: n.title ?? 'Notification',
      message: n.message ?? '',
      actorUsername: n.actorUsername,
      resourceType: n.resourceType,
      resourceId: n.resourceId,
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt ?? new Date().toISOString(),
    }));
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[API] notifications error', error);
    return mockNotifications();
  }
}

export interface MessageNestItem {
  id: number | string;
  senderId?: string;
  senderUsername?: string;
  senderName?: string;
  recipientId?: string;
  recipientUsername?: string;
  recipientName?: string;
  subject?: string;
  body: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function getMessageNest(page = 0, size = 20): Promise<{ content: MessageNestItem[]; totalElements: number; totalPages: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/message-nest?page=${page}&size=${size}&sort=createdAt&direction=DESC`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] message nest request failed', response.status);
      return { content: [], totalElements: 0, totalPages: 0 };
    }
    const data = await response.json();
    const messages = data?.data?.content || data?.content || data?.data || [];
    return {
      content: messages.map((m: any) => ({
        id: m.id ?? m.messageId,
        senderId: m.senderId,
        senderUsername: m.senderUsername,
        senderName: m.senderName,
        recipientId: m.recipientId,
        recipientUsername: m.recipientUsername,
        recipientName: m.recipientName,
        subject: m.subject,
        body: m.body ?? m.message ?? '',
        read: Boolean(m.read),
        readAt: m.readAt,
        createdAt: m.createdAt ?? m.created_at ?? new Date().toISOString(),
        updatedAt: m.updatedAt ?? m.updated_at,
      })),
      totalElements: data?.data?.totalElements ?? data?.totalElements ?? messages.length,
      totalPages: data?.data?.totalPages ?? data?.totalPages ?? 1,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[API] message nest error', error);
    return { content: [], totalElements: 0, totalPages: 0 };
  }
}

export interface AdminFeedbackMessage {
  id: number;
  userId?: string;
  name?: string;
  email?: string;
  title?: string;
  body: string;
  status: 'open' | 'closed';
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AdminFeedbackPage {
  content: AdminFeedbackMessage[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// Opinion models
export interface Opinion {
  id: number;
  content: string;
  image?: string;
  timestamp: string;
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  source1?: string;
  source2?: string;
  categoryId: number;
  categoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OpinionPage {
  content: Opinion[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/**
 * Get all opinions (public endpoint)
 * @param page Page number (0-indexed)
 * @param size Page size
 * @param categoryId Optional category filter
 */
export async function getOpinions(page = 0, size = 20, categoryId?: number): Promise<OpinionPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (categoryId) {
    params.append('categoryId', categoryId.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/opinions?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch opinions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Get opinion by ID (public endpoint)
 */
export async function getOpinionById(id: number): Promise<Opinion | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/opinions/${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'omit',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch opinion: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

export async function checkAdminSession(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/v1/admin/session`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn('[Admin] Session check failed:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    const authenticated = data.data?.authenticated === true;
    console.log('[Admin] Session check result:', authenticated);
    return authenticated;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('[Admin] Session check timed out');
    } else {
      console.warn('[Admin] Session check error:', error.message || error);
    }
    return false;
  }
}

export async function adminLogin(username: string, password: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  return data.data?.authenticated === true;
}

export async function getAdminSupportMessages(
  page = 0,
  size = 20,
  status?: 'open' | 'closed'
): Promise<AdminFeedbackPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) {
    params.append('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/support-messages?${params}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch support messages');
  }

  const data = await response.json();
  return data.data || { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
}

export async function markSupportMessageAsRead(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/support-messages/${id}/read`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to mark message as read');
  }
}

export async function updateSupportMessageStatus(
  id: number,
  status: 'open' | 'closed'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/support-messages/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update message status');
  }
}

// ========== Admin User Management ==========

export interface AdminUser {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  headline?: string;
  countryCode?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  suspended?: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  totalPats?: number;
  totalShares?: number;
  totalComments?: number;
  patCoins?: number;
  rankName?: string;
  rankLevel?: number;
  referralCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUserPage {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export async function getAdminUsers(
  page = 0,
  size = 20,
  search?: string
): Promise<AdminUserPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const data = await response.json();
  return data.data || { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
}

export async function getAdminUser(userId: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const data = await response.json();
  return data.data;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/email/${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message = errorData?.message || errorData?.error?.message || 'Failed to fetch user by email';
    throw new Error(message);
  }

  const data = await response.json();
  return data.data;
}

export async function getAdminUserByUsername(username: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/username/${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message = errorData?.message || errorData?.error?.message || 'Failed to fetch user by username';
    throw new Error(message);
  }

  const data = await response.json();
  return data.data;
}

export async function updateAdminUser(
  userId: string,
  updates: { name?: string; headline?: string; email?: string }
): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update user');
  }

  const data = await response.json();
  return data.data;
}

export async function suspendAdminUser(userId: string, reason: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/suspend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to suspend user');
  }

  const data = await response.json();
  return data.data;
}

export async function unsuspendAdminUser(userId: string): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/unsuspend`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to unsuspend user');
  }

  const data = await response.json();
  return data.data;
}

export async function updateAdminUserCoins(userId: string, coins: number): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/coins`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ coins }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update user coins');
  }

  const data = await response.json();
  return data.data;
}

export async function updateAdminUserRank(userId: string, level: number): Promise<AdminUser> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/users/${userId}/rank`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ level }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update user rank');
  }

  const data = await response.json();
  return data.data;
}

// ========== Admin Category Management ==========

export interface AdminCategory {
  id: number;
  parentId?: number | null;
  parentName?: string;
  name?: string;
  imageUrl?: string | null;
  query?: string | null;
  concept?: string | null;
  publicCategory?: boolean | null;
  localized?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCategoryUpdatePayload {
  name?: string | null;
  imageUrl?: string | null;
  query?: string | null;
  concept?: string | null;
  publicCategory?: boolean | null;
  localized?: boolean | null;
  parentId?: number | null;
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/categories`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.data || [];
}

export async function updateAdminCategory(
  categoryId: number,
  updates: AdminCategoryUpdatePayload
): Promise<AdminCategory> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/categories/${categoryId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message = errorData?.message || errorData?.error?.message || 'Failed to update category';
    throw new Error(message);
  }

  const data = await response.json();
  return data.data;
}

// ========== Admin Feed Management ==========

export interface AdminFeed {
  id: number;
  title?: string;
  excerpt?: string;
  body?: string;
  imageUrl?: string;
  sourceUrl?: string;
  countryCode?: string;
  published?: boolean;
  featured?: boolean;
  hidden?: boolean;
  readCount?: number;
  categoryId?: number;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminFeedPage {
  content: AdminFeed[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export async function getAdminFeeds(
  page = 0,
  size = 20,
  search?: string
): Promise<AdminFeedPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch feeds');
  }

  const data = await response.json();
  return data.data || { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
}

export async function getAdminFeed(feedId: number): Promise<AdminFeed> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch feed');
  }

  const data = await response.json();
  return data.data;
}

export async function deleteAdminFeed(feedId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete feed');
  }
}

export async function hideAdminFeed(feedId: number): Promise<AdminFeed> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}/hide`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to hide feed');
  }

  const data = await response.json();
  return data.data;
}

export async function unhideAdminFeed(feedId: number): Promise<AdminFeed> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}/unhide`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to unhide feed');
  }

  const data = await response.json();
  return data.data;
}

export async function featureAdminFeed(feedId: number): Promise<AdminFeed> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}/feature`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to feature feed');
  }

  const data = await response.json();
  return data.data;
}

export async function unfeatureAdminFeed(feedId: number): Promise<AdminFeed> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}/unfeature`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to unfeature feed');
  }

  const data = await response.json();
  return data.data;
}

export async function updateAdminFeedPublished(feedId: number, published: boolean): Promise<AdminFeed> {
  const response = await fetch(`${API_BASE_URL}/api/v1/admin/feeds/${feedId}/published`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ published }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update feed published status');
  }

  const data = await response.json();
  return data.data;
}

// ========== Admin Activity Logs ==========

export interface AdminActivityLog {
  id: number;
  actionType: string;
  actionDescription: string;
  adminIp?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AdminActivityLogPage {
  content: AdminActivityLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export async function getAdminActivityLogs(
  page = 0,
  size = 50,
  actionType?: string
): Promise<AdminActivityLogPage> {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (actionType) {
    params.append('actionType', actionType);
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/activity-logs?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }

  const data = await response.json();
  return data.data || { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 };
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    await fetch(`${API_BASE_URL}/api/v1/notifications/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({ ids: ids && ids.length ? ids : undefined, all: !ids || !ids.length }),
    });
  } catch (error) {
    console.warn('[API] mark notifications read error', error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/unread-count`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...getAuthHeaders() },
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn('[API] unread count request failed', response.status);
      return mockNotifications().filter(n => !n.isRead).length;
    }
    const data = await response.json();
    return data?.count ?? data?.total ?? 0;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[API] unread count error', error);
    return mockNotifications().filter(n => !n.isRead).length;
  }
}

function mockLeaderboard(metric: LeaderboardMetric): LeaderboardEntry[] {
  const sampleNames = ['Ava', 'Liam', 'Noah', 'Mia', 'Ethan', 'Zara', 'Leo', 'Sofia', 'Mateo', 'Isla'];
  return sampleNames.map((name, idx) => ({
    username: `${name.toLowerCase()}${idx + 1}`,
    displayName: name,
    total: 1200 - idx * 47 + (metric === 'pats' ? 30 : 0),
    rank: idx + 1,
  }));
}

function mockChat(): ChatMessage[] {
  const now = Date.now();
  return [
    {
      id: 'c1',
      username: 'sam',
      displayName: 'Sam',
      text: 'Welcome to the community lounge!',
      createdAt: new Date(now - 1000 * 60 * 2).toISOString(),
    },
    {
      id: 'c2',
      username: 'jules',
      displayName: 'Jules',
      text: 'Leaderboard just updated — go sharers!',
      createdAt: new Date(now - 1000 * 30).toISOString(),
    },
  ];
}

function mockNotifications(): NotificationItem[] {
  const now = Date.now();
  return [
    {
      id: 'n1',
      type: 'tip_received',
      title: 'You received a tip',
      message: '@jules sent you 2.5 Pat Coins',
      actorUsername: 'jules',
      isRead: false,
      createdAt: new Date(now - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 'n2',
      type: 'comment_reply',
      title: 'New reply on your post',
      message: '@sam replied to your comment',
      actorUsername: 'sam',
      isRead: true,
      createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
    },
  ];
}

/**
 * Get Cognito Hosted UI URL for social authentication (Google/Apple SSO)
 * Uses Cognito's Hosted UI directly, not Spring OAuth2
 * 
 * Note: You need to configure NEXT_PUBLIC_COGNITO_CLIENT_ID and NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN
 * in your environment variables or update the hardcoded values below.
 */
/**
 * Sign out the current user
 * Clears both cookie (via backend) and localStorage (fallback)
 */
export interface UpdateProfilePayload {
  name?: string;
  headline?: string;
}

type AvatarCacheEntry = {
  url: string;
  expiresAt: number;
};

const AVATAR_CACHE_PREFIX = 'pat_avatar_';
const AVATAR_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const avatarCacheKey = (username?: string) =>
  username ? `${AVATAR_CACHE_PREFIX}${username.toLowerCase()}` : '';

function readAvatarFromCache(username?: string): string | null {
  if (!isBrowser || !username) return null;
  try {
    const raw = localStorage.getItem(avatarCacheKey(username));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AvatarCacheEntry;
    if (!parsed?.url || !parsed?.expiresAt) {
      localStorage.removeItem(avatarCacheKey(username));
      return null;
    }
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(avatarCacheKey(username));
      return null;
    }
    return parsed.url;
  } catch {
    return null;
  }
}

function writeAvatarCache(username: string | undefined, url: string | undefined, ttlMs = AVATAR_CACHE_TTL_MS) {
  if (!isBrowser || !username || !url) return;
  try {
    const entry: AvatarCacheEntry = { url, expiresAt: Date.now() + ttlMs };
    localStorage.setItem(avatarCacheKey(username), JSON.stringify(entry));
    const maxAge = Math.floor(ttlMs / 1000);
    document.cookie = `${avatarCacheKey(username)}=${encodeURIComponent(url)}; max-age=${maxAge}; path=/`;
  } catch {
    // non-fatal
  }
}

function applyAvatarCache(profile: UserProfile | null, fallbackUsername?: string): UserProfile | null {
  if (!profile) return profile;
  const username = profile.username || fallbackUsername;
  const cached = readAvatarFromCache(username);
  if (cached && !profile.avatarUrl) {
    profile.avatarUrl = cached;
  } else if (profile.avatarUrl && username) {
    writeAvatarCache(username, profile.avatarUrl);
  }
  return profile;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const headers = getAuthHeaders(); // Get X-Session-Token from localStorage if available

    const response = await fetch(`${API_BASE_URL}/api/v1/user/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers, // Include X-Session-Token header if available
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to update profile';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.data || data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Update timed out, please try again');
    }
    throw error instanceof Error ? error : new Error('Unknown error updating profile');
  }
}

export async function uploadAvatar(file: File): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };

    // 1) Request presigned URL
    const presignRes = await fetch(`${API_BASE_URL}/api/v1/user/profile/avatar/presign`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        contentType: file.type || 'application/octet-stream',
        contentLength: file.size,
      }),
      signal: controller.signal,
    });

    if (!presignRes.ok) {
      clearTimeout(timeoutId);
      console.warn('[API] Avatar presign failed:', presignRes.status);
      return null;
    }

    const presignJson = await presignRes.json();
    const presign = presignJson?.data || presignJson;
    if (!presign?.uploadUrl || !presign?.key) {
      clearTimeout(timeoutId);
      console.warn('[API] Invalid presign payload', presignJson);
      return null;
    }

    // 2) Upload to S3
    const uploadHeaders: Record<string, string> = {};
    if (file.type) uploadHeaders['Content-Type'] = file.type;
    const uploadRes = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: uploadHeaders,
      body: file,
      signal: controller.signal,
    });
    if (!uploadRes.ok) {
      clearTimeout(timeoutId);
      console.warn('[API] Avatar PUT failed:', uploadRes.status);
      return null;
    }

    // 3) Confirm and persist
    const confirmRes = await fetch(`${API_BASE_URL}/api/v1/user/profile/avatar/confirm`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        key: presign.key,
        publicUrl: presign.publicUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!confirmRes.ok) {
      console.warn('[API] Avatar confirm failed:', confirmRes.status);
      return presign.publicUrl || null;
    }

    const confirmJson = await confirmRes.json();
    const updatedProfile: UserProfile | null = confirmJson?.data || confirmJson || null;
    const url = updatedProfile?.avatarUrl || presign.publicUrl || null;
    if (url) {
      writeAvatarCache(updatedProfile?.username, url);
    }
    return url;
  } catch (error) {
    console.warn('[API] Avatar upload error:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Get auth headers from localStorage (fallback for cookie-restricted jurisdictions)
    const authHeaders = getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signout`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...authHeaders, // Include X-Session-Token header if available in localStorage
      },
      credentials: 'include', // Include cookies (preferred method)
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    // Always clear localStorage regardless of response (best effort)
    removeSessionTokenFromStorage();
    
    if (!response.ok) {
      console.warn('[API] Sign-out request failed:', response.status);
    }
  } catch (error) {
    // Still clear localStorage even if request fails
    removeSessionTokenFromStorage();
    console.warn('[API] Error during sign-out:', error);
  }
}

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
