/**
 * Cloudflare Worker: Reverse Proxy for patreek.com with Rate Limiting
 *
 * Architecture:
 * - patreek.com is connected to Cloudflare Pages (patreek-web.pages.dev)
 * - Worker runs on patreek.com/* to selectively route requests
 *
 * Routing logic:
 * - / → Fetch from Cloudflare Pages (patreek-web.pages.dev) - homepage with feed list
 * - /pat/* → Fetch from Cloudflare Pages (patreek-web.pages.dev) - article pages
 * - /registration → Fetch from Cloudflare Pages (patreek-web.pages.dev) - registration page
 * - /contact → Fetch from Cloudflare Pages (patreek-web.pages.dev) - contact page
 * - /coins → Fetch from Cloudflare Pages (patreek-web.pages.dev) - coins page
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
// Use the production branch URL if available, otherwise use preflight branch
const PAGES_DEPLOYMENT_URL = 'https://preflight.patreek-web.pages.dev'

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // Maximum requests per IP per time window
  MAX_REQUESTS_PER_WINDOW: 100, // Adjust based on your needs
  // Time window in seconds (e.g., 60 = 1 minute)
  TIME_WINDOW_SECONDS: 60,
  // Paths to rate limit (empty array = rate limit all paths)
  // Rate limit /pat/* routes to protect against DDoS
  RATE_LIMIT_PATHS: ['/pat/'],
  // Use KV storage for persistence (set to false to use in-memory only - FREE TIER)
  // Set to true only if you've configured KV namespace (requires paid plan for high usage)
  USE_KV: false // FREE TIER: Set to false for in-memory rate limiting (no cost)
}

// In-memory rate limit store (fallback if KV not available)
// Note: This resets on worker restart, but is fine for basic protection
const inMemoryRateLimit = new Map()

/**
 * Get client IP address from request headers
 */
function getClientIP(request) {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  const cfConnectingIP = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback to X-Forwarded-For if available
  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  // Last resort: use a default identifier
  return 'unknown'
}

/**
 * Check if path should be rate limited
 */
function shouldRateLimit(pathname) {
  if (RATE_LIMIT_CONFIG.RATE_LIMIT_PATHS.length === 0) {
    return true // Rate limit all paths
  }

  return RATE_LIMIT_CONFIG.RATE_LIMIT_PATHS.some((path) =>
    pathname.startsWith(path)
  )
}

/**
 * Get rate limit key for KV storage
 */
function getRateLimitKey(ip, pathname) {
  const window = Math.floor(
    Date.now() / (RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 1000)
  )
  return `ratelimit:${ip}:${pathname}:${window}`
}

/**
 * Check rate limit using KV storage
 */
async function checkRateLimitKV(env, ip, pathname) {
  if (!env.RATE_LIMIT_KV) {
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW
    }
  }

  const key = getRateLimitKey(ip, pathname)

  try {
    const count = await env.RATE_LIMIT_KV.get(key)
    const currentCount = count ? parseInt(count, 10) : 0

    if (currentCount >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetIn:
          RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS -
          (Date.now() % (RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 1000)) / 1000
      }
    }

    // Increment counter
    const newCount = currentCount + 1
    await env.RATE_LIMIT_KV.put(key, newCount.toString(), {
      expirationTtl: RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS + 10 // Add buffer
    })

    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW - newCount
    }
  } catch (error) {
    console.error('[Rate Limit] KV error:', error)
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW
    }
  }
}

/**
 * Check rate limit using in-memory storage
 */
function checkRateLimitInMemory(ip, pathname) {
  const key = getRateLimitKey(ip, pathname)
  const now = Date.now()

  // Clean up old entries (older than 2 time windows)
  const cleanupThreshold = now - RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 2000
  for (const [k, v] of inMemoryRateLimit.entries()) {
    if (v.timestamp < cleanupThreshold) {
      inMemoryRateLimit.delete(k)
    }
  }

  const entry = inMemoryRateLimit.get(key)

  if (entry && entry.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW) {
    const resetIn =
      RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS -
      (((now - entry.timestamp) / 1000) % RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS)

    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil(resetIn)
    }
  }

  // Increment or create entry
  if (entry) {
    entry.count++
  } else {
    inMemoryRateLimit.set(key, {
      count: 1,
      timestamp: now
    })
  }

  const currentCount = inMemoryRateLimit.get(key).count

  return {
    allowed: true,
    remaining: RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW - currentCount
  }
}

/**
 * Check rate limit (uses KV if available, otherwise in-memory)
 */
async function checkRateLimit(env, ip, pathname) {
  if (RATE_LIMIT_CONFIG.USE_KV && env.RATE_LIMIT_KV) {
    return await checkRateLimitKV(env, ip, pathname)
  } else {
    return checkRateLimitInMemory(ip, pathname)
  }
}

/**
 * Check if pathname matches any known routes that should be handled by Cloudflare Pages
 * Returns true if the path should be handled by Pages, false if it should go to 404
 */
function isKnownPagesRoute(pathname, searchParams) {
  // Primary static routes handled by Cloudflare Pages
  const knownRoutes = [
    '/', // Root
    '/home',
    '/contact',
    '/developer',
    '/marketing',
    '/opinion',
    '/privacy',
    '/terms',
    '/links',
    '/community',
    '/coins',
    '/profile',
    '/notifications',
    '/nest',
    '/advertise',
    '/submission',
    '/registration',
    '/forgot-password',
    '/reset-password',
    // Static assets
    '/ads.txt',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/sw.js', // Service worker
    '/manifest.json',
    '/manifest.webmanifest',
    '/apple-touch-icon.png',
    // Admin routes (exact matches)
    '/admin/dashboard',
    '/admin/passcode',
    // Pat routes
    '/pat', // Redirects to /pat/
    '/pat/' // Article hub
  ]

  // Normalize pathname (remove trailing slash for comparison, but keep original for matching)
  const normalizedPath =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname

  // Check exact matches (with and without trailing slash)
  if (
    knownRoutes.includes(pathname) ||
    knownRoutes.includes(normalizedPath) ||
    knownRoutes.includes(pathname + '/')
  ) {
    return true
  }

  // Check pattern matches for dynamic routes and assets
  if (
    // Next.js static assets and build files
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    // Pat article routes: /pat/12345, /pat/12345.txt (RSC payload)
    pathname.match(/^\/pat\/\d+$/) ||
    pathname.match(/^\/pat\/\d+\.txt$/) ||
    // User profile routes: /u/username
    pathname.match(/^\/u\/[^/]+$/) ||
    // Article routes (legacy): /article/slug
    pathname.match(/^\/article\/[^/]+$/) ||
    // Admin dashboard sub-routes: /admin/dashboard/users, /admin/dashboard/feeds, etc.
    pathname.match(/^\/admin\/dashboard\/[^/]+$/) ||
    pathname.startsWith('/admin/dashboard/') ||
    // Admin passcode route
    pathname === '/admin/passcode' ||
    // Static asset patterns
    pathname.match(/^\/icon-\d+x\d+\.png$/) || // Icon files
    pathname.match(
      /^\/.*\.(txt|xml|ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot)$/i
    ) || // Common static file extensions
    pathname.endsWith('.txt') || // RSC payload files and other .txt files
    // Next.js RSC requests (query parameter)
    searchParams.has('_rsc')
  ) {
    return true
  }

  return false
}

/**
 * Serve the branded 404 page from Cloudflare Pages
 */
async function serve404Page(rateLimitHeaders) {
  const pages404Urls = [
    `${PAGES_DEPLOYMENT_URL}/404.html`,
    `${PAGES_DEPLOYMENT_URL}/404`
  ]

  for (const pages404Url of pages404Urls) {
    try {
      const pages404Response = await fetch(pages404Url, {
        method: 'GET',
        headers: {
          Accept: 'text/html'
        }
      })

      if (pages404Response.status === 200 || pages404Response.status === 308) {
        // Handle redirect (308) by following it
        let finalResponse = pages404Response
        if (pages404Response.status === 308) {
          const redirectUrl = pages404Response.headers.get('location')
          if (redirectUrl) {
            finalResponse = await fetch(
              redirectUrl.startsWith('http')
                ? redirectUrl
                : `${PAGES_DEPLOYMENT_URL}${redirectUrl}`,
              {
                method: 'GET',
                headers: { Accept: 'text/html' }
              }
            )
          }
        }

        if (finalResponse.status === 200) {
          const body = await finalResponse.text()
          const newHeaders = new Headers()
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')
          newHeaders.set('X-Content-Type-Options', 'nosniff')
          newHeaders.set('X-Frame-Options', 'SAMEORIGIN')
          newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          return new Response(body, {
            status: 404,
            statusText: 'Not Found',
            headers: newHeaders
          })
        }
      }
    } catch (error) {
      console.error(
        `[Worker] Error fetching 404 page from ${pages404Url}:`,
        error
      )
      // Continue to next URL
    }
  }

  // Fallback: return a simple 404 response
  return new Response('404 Not Found', {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/plain'
    }
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname
    const hostname = url.hostname

    // Debug logging (remove in production)
    console.log(`[Worker] Request: ${hostname}${pathname}`)

    // Handle admin.patreek.com - route all requests to admin pages
    if (hostname === 'admin.patreek.com') {
      // Let static assets (_next, static, etc.) pass through to normal routing
      if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        pathname.startsWith('/favicon.ico') ||
        pathname.startsWith('/robots.txt') ||
        pathname.startsWith('/sitemap.xml') ||
        pathname.endsWith('.txt') ||
        url.searchParams.has('_rsc')
      ) {
        // Fall through to normal static asset routing below
      } else {
        // Route /passcode to passcode page, everything else to admin
        let adminPath
        if (pathname === '/passcode' || pathname === '/passcode/') {
          adminPath = '/admin/passcode.html'
        } else {
          adminPath =
            pathname === '/' ? '/admin.html' : `/admin${pathname}.html`
        }
        console.log(
          `[Worker] Admin request: routing ${pathname} to ${adminPath}`
        )
        const pagesUrl = `${PAGES_DEPLOYMENT_URL}${adminPath}${url.search}`

        try {
          const response = await fetch(pagesUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body
          })

          if (response.status === 200) {
            const newHeaders = new Headers(response.headers)
            newHeaders.set('Content-Type', 'text/html; charset=utf-8')
            newHeaders.set('Access-Control-Allow-Origin', '*')

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders
            })
          } else {
            // Fallback to index.html for admin if specific page not found
            const fallbackUrl = `${PAGES_DEPLOYMENT_URL}/admin.html${url.search}`
            const fallbackResponse = await fetch(fallbackUrl, {
              method: request.method,
              headers: request.headers,
              body: request.body
            })

            if (fallbackResponse.status === 200) {
              const newHeaders = new Headers(fallbackResponse.headers)
              newHeaders.set('Content-Type', 'text/html; charset=utf-8')
              return new Response(fallbackResponse.body, {
                status: fallbackResponse.status,
                statusText: fallbackResponse.statusText,
                headers: newHeaders
              })
            }

            return new Response(`Admin page not found (${response.status})`, {
              status: response.status
            })
          }
        } catch (error) {
          console.error('[Worker] Error fetching admin page:', error)
          return new Response('Error fetching admin page from Pages', {
            status: 500
          })
        }
      }
    }

    // Redirect patreek.com/api to developer.patreek.com
    if (
      hostname === 'patreek.com' &&
      (pathname === '/api' || pathname.startsWith('/api/'))
    ) {
      const developerPath =
        pathname === '/api' ? '/' : pathname.replace('/api', '')
      return Response.redirect(
        `https://developer.patreek.com${developerPath}${url.search}`,
        301
      )
    }

    // EARLY CHECK: If this is an unknown route on patreek.com, serve 404 immediately
    // This prevents proxying to Webflow for unknown routes
    // IMPORTANT: This check happens BEFORE any route handlers to catch unknown routes early
    if (hostname === 'patreek.com') {
      const isKnown = isKnownPagesRoute(pathname, url.searchParams)
      console.log(
        `[Worker] Route check for ${pathname}: ${
          isKnown ? 'KNOWN' : 'UNKNOWN → 404'
        }`
      )

      if (!isKnown) {
        console.log(
          `[Worker] Unknown route ${pathname} on patreek.com, serving 404 page directly (skipping Webflow)`
        )
        return await serve404Page(rateLimitHeaders)
      }
    }

    // Handle developer.patreek.com - route to developer pages
    if (hostname === 'developer.patreek.com') {
      // Route developer requests to developer.html
      const developerPath =
        pathname === '/' ? '/developer.html' : `/developer${pathname}.html`
      console.log(
        `[Worker] Developer request: routing ${pathname} to ${developerPath}`
      )
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${developerPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          // Fallback to index.html for developer if specific page not found
          const fallbackUrl = `${PAGES_DEPLOYMENT_URL}/developer.html${url.search}`
          const fallbackResponse = await fetch(fallbackUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body
          })

          if (fallbackResponse.status === 200) {
            const newHeaders = new Headers(fallbackResponse.headers)
            newHeaders.set('Content-Type', 'text/html; charset=utf-8')
            return new Response(fallbackResponse.body, {
              status: fallbackResponse.status,
              statusText: fallbackResponse.statusText,
              headers: newHeaders
            })
          }

          return new Response(`Developer page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching developer page:', error)
        return new Response('Error fetching developer page from Pages', {
          status: 500
        })
      }
    }

    // Redirect www to non-www for SEO and consistency
    // This ensures www.patreek.com/ads.txt redirects to patreek.com/ads.txt
    if (hostname === 'www.patreek.com') {
      return Response.redirect(
        `https://patreek.com${pathname}${url.search}`,
        301
      )
    }

    // Rate limiting check
    let rateLimitHeaders = null
    if (shouldRateLimit(pathname)) {
      const clientIP = getClientIP(request)
      const rateLimitResult = await checkRateLimit(env, clientIP, pathname)

      if (!rateLimitResult.allowed) {
        console.warn(
          `[Rate Limit] Blocked request from ${clientIP} for ${pathname}`
        )

        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter:
              rateLimitResult.resetIn || RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS
          }),
          {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(
                rateLimitResult.resetIn || RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS
              ),
              'X-RateLimit-Limit': String(
                RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW
              ),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
              'X-RateLimit-Reset': String(
                Date.now() +
                  (rateLimitResult.resetIn ||
                    RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS) *
                    1000
              )
            }
          }
        )
      }

      // Store rate limit headers to add to successful responses
      rateLimitHeaders = {
        'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.MAX_REQUESTS_PER_WINDOW),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(
          Date.now() + RATE_LIMIT_CONFIG.TIME_WINDOW_SECONDS * 1000
        )
      }
    }

    // Handle /pat routes (main public routes)
    // Next.js static export generates /pat.html for the catch-all route [[...id]]
    // This single HTML file handles both /pat/ (homepage) and /pat/{id} (article) routes

    // Handle RSC payload requests for /pat/{id}.txt
    // Next.js requests these for client-side navigation, but static export only generates /pat.txt
    if (pathname.match(/^\/pat\/(\d+)\.txt$/)) {
      const rscPath = '/pat.txt'
      console.log(`[Worker] Routing RSC payload ${pathname} to ${rscPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${rscPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/plain; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          // If /pat.txt doesn't exist, return empty RSC payload to suppress errors
          console.warn(
            `[Worker] RSC payload ${rscPath} not found, returning empty payload`
          )
          return new Response('', {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Access-Control-Allow-Origin': '*'
            }
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching RSC payload:', error)
        // Return empty payload to suppress errors
        return new Response('', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }
    }

    // Redirect /pat (no trailing slash) to /pat/ (with trailing slash)
    if (pathname === '/pat') {
      return Response.redirect(`${url.origin}/pat/`, 301)
    }

    // For /pat/ (homepage) and /pat/{id} (article pages), route to /pat.html
    // The React app will extract the ID from the URL and fetch data from the API if needed
    if (pathname === '/pat/' || pathname.match(/^\/pat\/(\d+)$/)) {
      const htmlPath = '/pat.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(
            `[Worker] Successfully fetched ${htmlPath} for route ${pathname}`
          )
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching HTML:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle root path (/) - route to index.html (which shows feed list)
    if (pathname === '/') {
      const htmlPath = '/index.html'
      console.log(`[Worker] Routing root path to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(`[Worker] Successfully fetched ${htmlPath} for root path`)
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching HTML:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /registration route - route to registration.html
    if (pathname === '/registration' || pathname === '/registration/') {
      const htmlPath = '/registration.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(
            `[Worker] Successfully fetched ${htmlPath} for registration`
          )
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching registration page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /contact route - route to contact.html
    if (pathname === '/contact' || pathname === '/contact/') {
      const htmlPath = '/contact.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(`[Worker] Successfully fetched ${htmlPath} for contact`)
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching contact page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /submission route - route to submission.html
    if (pathname === '/submission' || pathname === '/submission/') {
      const htmlPath = '/submission.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(
            `[Worker] Successfully fetched ${htmlPath} for submission`
          )
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching submission page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /community route - route to community.html
    if (pathname === '/community' || pathname === '/community/') {
      const htmlPath = '/community.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(`[Worker] Successfully fetched ${htmlPath} for community`)
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching community page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /coins route - route to coins.html
    if (pathname === '/coins' || pathname === '/coins/') {
      const htmlPath = '/coins.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(`[Worker] Successfully fetched ${htmlPath} for coins`)
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching coins page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /profile route - route to profile.html (which will redirect to /u/{username})
    if (pathname === '/profile' || pathname === '/profile/') {
      const htmlPath = '/profile.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(
            `[Worker] Successfully fetched ${htmlPath} for profile page`
          )
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching profile page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /home route - route to home.html (which will redirect to /u/{username})
    if (pathname === '/home' || pathname === '/home/') {
      const htmlPath = '/home.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(`[Worker] Successfully fetched ${htmlPath} for home page`)
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching home page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
      }
    }

    // Handle /u/{username} routes - route to index.html (Next.js will handle the dynamic route client-side)
    if (pathname.match(/^\/u\/[^/]+$/)) {
      // For static export, Next.js generates a catch-all route
      // We'll serve index.html and let client-side routing handle it
      const htmlPath = '/index.html'
      console.log(`[Worker] Routing ${pathname} to ${htmlPath} for user page`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${htmlPath}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        if (response.status === 200) {
          const newHeaders = new Headers(response.headers)
          newHeaders.set('Content-Type', 'text/html; charset=utf-8')
          newHeaders.set('Access-Control-Allow-Origin', '*')

          // Add rate limit headers if available
          if (rateLimitHeaders) {
            Object.entries(rateLimitHeaders).forEach(([key, value]) => {
              newHeaders.set(key, value)
            })
          }

          console.log(`[Worker] Successfully fetched ${htmlPath} for user page`)
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          })
        } else {
          console.error(
            `[Worker] Failed to fetch ${htmlPath}: ${response.status}`
          )
          return new Response(`Page not found (${response.status})`, {
            status: response.status
          })
        }
      } catch (error) {
        console.error('[Worker] Error fetching user page:', error)
        return new Response('Error fetching page from Pages', { status: 500 })
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
      console.log(`[Worker] Routing to Pages: ${pathname}`)
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${pathname}${url.search}`

      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })

        // Clone response and ensure proper headers
        const newHeaders = new Headers(response.headers)

        // Ensure proper Content-Type for CSS and JS files
        if (pathname.endsWith('.css')) {
          newHeaders.set('Content-Type', 'text/css; charset=utf-8')
        } else if (pathname.endsWith('.js')) {
          newHeaders.set(
            'Content-Type',
            'application/javascript; charset=utf-8'
          )
        }

        // Ensure CORS headers for cross-origin requests
        newHeaders.set('Access-Control-Allow-Origin', '*')
        newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')

        // Add rate limit headers if available
        if (request.rateLimitHeaders) {
          Object.entries(request.rateLimitHeaders).forEach(([key, value]) => {
            newHeaders.set(key, value)
          })
        }

        const newResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        })

        return newResponse
      } catch (error) {
        console.error('[Worker] Error fetching from Pages:', error)
        return new Response('Error fetching content from Pages', {
          status: 500
        })
      }
    }

    // Proxy all other requests to patreek.webflow.io
    // Note: This should only be reached for known routes that need Webflow content
    // Unknown routes are already handled above with 404 page
    console.log(`[Worker] Routing to Webflow: ${pathname}`)
    const targetUrl = `https://patreek.webflow.io${pathname}${url.search}`

    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    })

    const response = await fetch(modifiedRequest)

    // If Webflow returns 404, serve our branded 404 page from Cloudflare Pages instead
    if (response.status === 404) {
      console.log(
        `[Worker] Webflow returned 404 for ${pathname}, serving Pages 404 page`
      )
      return await serve404Page(rateLimitHeaders)
    }

    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })

    modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff')
    modifiedResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')

    // Add rate limit headers if available
    if (rateLimitHeaders) {
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        modifiedResponse.headers.set(key, value)
      })
    }

    return modifiedResponse
  }
}
