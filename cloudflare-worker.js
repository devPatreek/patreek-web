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
    
    // Redirect /public/pats to /public/pats/ (with trailing slash)
    if (pathname === '/public/pats') {
      return Response.redirect(`${url.origin}/public/pats/`, 301);
    }
    
    // Route /public/pats/*, /ads.txt, and Next.js assets to Cloudflare Pages
    if (
      pathname.startsWith('/public/pats/') || 
      pathname === '/ads.txt' ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/robots.txt') ||
      pathname.startsWith('/sitemap.xml')
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
