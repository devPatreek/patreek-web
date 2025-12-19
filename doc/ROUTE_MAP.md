# Cloudflare Worker Route Map

## Known Routes (Handled by Cloudflare Pages)

### Primary Static Pages
- `/` - Root/homepage
- `/home` - Home page
- `/contact` - Contact page
- `/developer` - Developer page
- `/marketing` - Marketing page
- `/opinion` - Opinion page
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/links` - Links page
- `/community` - Community page
- `/coins` - Coins page
- `/profile` - Profile page
- `/notifications` - Notifications page
- `/nest` - Nest page
- `/advertise` - Advertise page
- `/submission` - Submission page
- `/registration` - Registration page
- `/forgot-password` - Forgot password page
- `/reset-password` - Reset password page

### Admin Routes
- `/admin/dashboard` - Admin dashboard
- `/admin/dashboard/*` - Admin dashboard sub-routes (users, feeds, reports, etc.)
- `/admin/passcode` - Admin passcode entry

### Pat Article Routes
- `/pat` - Redirects to `/pat/`
- `/pat/` - Article hub/homepage
- `/pat/{id}` - Article detail page (e.g., `/pat/12345`)
- `/pat/{id}.txt` - RSC payload for article

### User Profile Routes
- `/u/{username}` - User profile page (e.g., `/u/padmin`)

### Legacy Article Routes
- `/article/{slug}` - Legacy article routes

### Static Assets
- `/ads.txt` - Ads.txt file
- `/robots.txt` - Robots.txt file
- `/sitemap.xml` - Sitemap file
- `/favicon.ico` - Favicon
- `/sw.js` - Service worker
- `/manifest.json` - Web manifest
- `/manifest.webmanifest` - Web manifest (alternative)
- `/apple-touch-icon.png` - Apple touch icon
- `/icon-{size}.png` - Icon files
- `/_next/*` - Next.js static assets
- `/static/*` - Static assets directory
- `*.txt` - RSC payload files and other text files
- Common image/font extensions: `.png`, `.jpg`, `.svg`, `.woff`, etc.

### Query Parameters
- `?_rsc` - Next.js RSC requests

## Unknown Routes (Serve 404 Page)

Any path not matching the above patterns will be served the branded Patreek 404 page from Cloudflare Pages.

Examples:
- `/wjflffldjl` → 404 page
- `/random/path` → 404 page
- `/unknown-route` → 404 page
