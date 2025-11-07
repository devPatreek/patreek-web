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
    
    // Route /public/pats/* and /ads.txt to Cloudflare Pages
    if (url.pathname.startsWith('/public/pats/') || url.pathname === '/ads.txt') {
      // Fetch from the Pages deployment URL to avoid loops
      const pagesUrl = `${PAGES_DEPLOYMENT_URL}${url.pathname}${url.search}`;
      
      try {
        const response = await fetch(pagesUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        
        // Return response with proper headers
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (error) {
        console.error('[Worker] Error fetching from Pages:', error);
        return new Response('Error fetching content from Pages', { status: 500 });
      }
    }
    
    // Proxy all other requests to patreek.webflow.io
    const targetUrl = `https://patreek.webflow.io${url.pathname}${url.search}`;
    
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
