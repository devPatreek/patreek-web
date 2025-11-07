/**
 * Cloudflare Worker: Reverse Proxy for patreek.com with Rate Limiting
 * 
 * Architecture:
 * - patreek.com is connected to Cloudflare Pages (patreek-web.pages.dev)
 * - Worker runs on patreek.com/* to selectively route requests
 * 
 * Routing logic:
 * - /public/pats/* → Fetch from Cloudflare Pages (patreek-web.pages.dev)
 * - /ads.txt → Fetch from Cloudflare Pages (patreek-web.pages.dev)
 * - /_next/* (Next.js assets) → Fetch from Cloudflare Pages
 * - /static/* (static assets) → Fetch from Cloudflare Pages
 * - *.txt (Next.js RSC payload files) → Fetch from Cloudflare Pages
 * - Requests with ?_rsc query parameter → Fetch from Cloudflare Pages
 * - /favicon.ico, /robots.txt, /sitemap.xml → Fetch from Cloudflare Pages
 * - Everything else → Proxy to patreek.webflow.io
 * 
 * Rate Limiting:
 * - Uses KV storage (optional) or in-memory cache
 * - Tracks requests per IP address
 * - Configurable limits per time window
 * - Returns 429 Too Many Requests when limit exceeded
 * 
 * Setup Steps:
 * 1. Connect patreek.com to Cloudflare Pages (custom domain)
 * 2. Configure Worker route: patreek.com/*
 * 3. (Optional) Create KV namespace and bind it to the Worker
 * 4. Update PAGES_DEPLOYMENT_URL below with your actual Pages URL
 */

// ⚠️ UPDATE THIS: Your Cloudflare Pages deployment URL
const PAGES_DEPLOYMENT_URL = 'https://patreek-web.pages.dev';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Maximum requests per IP per time window
  MAX_REQUESTS_PER_WINDOW: 100, // Adjust based on your needs
  // Time window in seconds (e.g., 60 = 1 minute)
  TIME_WINDOW_SECONDS: 60,
  // Paths to rate limit (empty array = rate limit all paths)
  // Only rate limit /public/pats/* routes to protect against DDoS
  RATE_LIMIT_PATHS: ['/public/pats/'],
  // Use KV storage for persistence (set to false to use in-memory only - FREE TIER)
  // Set to true only if you've configured KV namespace (requires paid plan for high usage)
  USE_KV: false, // FREE TIER: Set to false for in-memory rate limiting (no cost)
};

// In-memory rate limit store (fallback if KV not available)
// Note: This resets on worker restart, but is fine for basic protection
const inMemoryRateLimit = new Map();

/**
 * Get client IP address from request headers
 */
function getClientIP(request) {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to X-Forwarded-For if available
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  // Last resort: use a default identifier
  return 'unknown';
}

/**
 * Check if path should be rate limited
 */
function shouldRateLimit(pathname) {
  if (RATE_LIMIT_CONFIG.RATE_LIMIT_PATHS.length === 0) {
    return true; // Rate limit all paths
  }
  
  return RATE_LIMIT_CONFIG.RATE_LIMIT_PATHS.some(path => 
    pathname.startsWith(path)
  );
}

/**
 * Get rate limit key for KV storage
 */
function getRateLimitKey(ip, pathname) {
  const window = Math.floor(Date.now() / (RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 1000));
  return `ratelimit:${ip}:${pathname}:${window}`;
}

/**
 * Check rate limit using KV storage
 */
async function checkRateLimitKV(env, ip, pathname) {
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW };
  }
  
  const key = getRateLimitKey(ip, pathname);
  
  try {
    const count = await env.RATE_LIMIT_KV.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;
    
    if (currentCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS - (Date.now() % (RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 1000)) / 1000
      };
    }
    
    // Increment counter
    const newCount = currentCount + 1;
    await env.RATE_LIMIT_KV.put(key, newCount.toString(), {
      expirationTtl: RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS + 10 // Add buffer
    });
    
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW - newCount
    };
  } catch (error) {
    console.error('[Rate Limit] KV error:', error);
    // On error, allow the request (fail open)
    return { allowed: true, remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW };
  }
}

/**
 * Check rate limit using in-memory storage
 */
function checkRateLimitInMemory(ip, pathname) {
  const key = getRateLimitKey(ip, pathname);
  const now = Date.now();
  
  // Clean up old entries (older than 2 time windows)
  const cleanupThreshold = now - (RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 2000);
  for (const [k, v] of inMemoryRateLimit.entries()) {
    if (v.timestamp < cleanupThreshold) {
      inMemoryRateLimit.delete(k);
    }
  }
  
  const entry = inMemoryRateLimit.get(key);
  
  if (entry && entry.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW) {
    const resetIn = RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS - 
      ((now - entry.timestamp) / 1000) % RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS;
    
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil(resetIn)
    };
  }
  
  // Increment or create entry
  if (entry) {
    entry.count++;
  } else {
    inMemoryRateLimit.set(key, {
      count: 1,
      timestamp: now
    });
  }
  
  const currentCount = inMemoryRateLimit.get(key).count;
  
  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW - currentCount
  };
}

/**
 * Check rate limit (uses KV if available, otherwise in-memory)
 */
async function checkRateLimit(env, ip, pathname) {
  if (RATE_LIMIT_CONFIG.USE_KV && env.RATE_LIMIT_KV) {
    return await checkRateLimitKV(env, ip, pathname);
  } else {
    return checkRateLimitInMemory(ip, pathname);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Debug logging (remove in production)
    console.log(`[Worker] Request: ${pathname}`);
    
    // Rate limiting check
    let rateLimitHeaders = null;
    if (shouldRateLimit(pathname)) {
      const clientIP = getClientIP(request);
      const rateLimitResult = await checkRateLimit(env, clientIP, pathname);
      
      if (!rateLimitResult.allowed) {
        console.warn(`[Rate Limit] Blocked request from ${clientIP} for ${pathname}`);
        
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: rateLimitResult.resetIn || RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS
          }),
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(rateLimitResult.resetIn || RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS),
              'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
              'X-RateLimit-Reset': String(Date.now() + (rateLimitResult.resetIn || RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS) * 1000)
            }
          }
        );
      }
      
      // Store rate limit headers to add to successful responses
      rateLimitHeaders = {
        'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(Date.now() + RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 1000)
      };
    }
    
    // Handle /public/pats routes
    // Next.js static export generates /public/pats.html for the catch-all route [[...id]]
    // This single HTML file handles both /public/pats/ (homepage) and /public/pats/{id} (article) routes
    
    // Redirect /public/pats (no trailing slash) to /public/pats/ (with trailing slash)
    if (pathname === '/public/pats') {
      return Response.redirect(`${url.origin}/public/pats/`, 301);
    }
    
    // For /public/pats/ (homepage) and /public/pats/{id} (article pages), route to /public/pats.html
    // The React app will extract the ID from the URL and fetch data from the API if needed
    if (pathname === '/public/pats/' || pathname.match(/^\/public\/pats\/(\d+)$/)) {
      const htmlPath = '/public/pats.html';
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`);
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`;
      
      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        
        if (response.status === 200) {
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Content-Type', 'text/html; charset=utf-8');
          newHeaders.set('Access-Control-Allow-Origin', '*');
          
          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value);
            });
          }
          
          console.log(`[Worker] Successfully fetched ${htmlPath} for route ${pathname}`);
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        } else {
          console.error(`[Worker] Failed to fetch ${htmlPath}: ${response.status}`);
          return new Response(`Page not found (${response.status})`, { status: response.status });
        }
      } catch (error) {
        console.error('[Worker] Error fetching HTML:', error);
        return new Response('Error fetching page from Pages', { status: 500 });
      }
    }
    
    // Route /ads.txt, Next.js assets, and RSC payload files to Cloudflare Pages
    // Note: /public/pats/* routes are handled above
    if (
      pathname === '/ads.txt' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/robots.txt') ||
      pathname.startsWith('/sitemap.xml') ||
      pathname.endsWith('.txt') || // Next.js RSC payload files (index.txt, privacy.txt, terms.txt, etc.)
      url.searchParams.has('_rsc') // Next.js RSC requests with _rsc query parameter
    ) {
      console.log(`[Worker] Routing to Pages: ${pathname}`);
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${pathname}${url.search}`;
      
      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        
        // Clone response and ensure proper headers
        const newHeaders = new Headers(response.headers);
        
        // Ensure proper Content-Type for CSS and JS files
        if (pathname.endsWith('.css')) {
          newHeaders.set('Content-Type', 'text/css; charset=utf-8');
        } else if (pathname.endsWith('.js')) {
          newHeaders.set('Content-Type', 'application/javascript; charset=utf-8');
        }
        
        // Ensure CORS headers for cross-origin requests
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        
        // Add rate limit headers if available
        if (request.rateLimitHeaders) {
          Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
        }
        
        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
        
        return newResponse;
      } catch (error) {
        console.error('[Worker] Error fetching from Pages:', error);
        return new Response('Error fetching content from Pages', { status: 500 });
      }
    }
    
    // Proxy all other requests to patreek.webflow.io
    console.log(`[Worker] Routing to Webflow: ${pathname}`);
    const targetUrl = `https://patreek.webflow.io${pathname}${url.search}`;
    
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const response = await fetch(modifiedRequest);
    
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
    
    modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');
    modifiedResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    
    // Add rate limit headers if available
    if (rateLimitHeaders) {
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        modifiedResponse.headers.set(key, value);
      });
    }
    
    return modifiedResponse;
  },
};
