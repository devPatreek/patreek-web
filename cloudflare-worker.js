/**
 * Cloudflare Worker: Reverse Proxy for patreek.com
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
 * Setup Steps:
 * 1. Connect patreek.com to Cloudflare Pages (custom domain)
 * 2. Configure Worker route: patreek.com/*
 * 3. Update PAGES_DEPLOYMENT_URL below with your actual Pages URL
 */

// ⚠️ UPDATE THIS: Your Cloudflare Pages deployment URL
const PAGES_DEPLOYMENT_URL = 'https://patreek-web.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Debug logging (remove in production)
    console.log(`[Worker] Request: ${pathname}`);
    
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
    
    return modifiedResponse;
  },
};
