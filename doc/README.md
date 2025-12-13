# Patreek Web

A Next.js web application for Patreek, featuring:
- **Landing Page**: Marketing site matching the original Webflow design
- **Article Viewer**: Read public articles with comments at `/article/[id]`

## Features

- Beautiful landing page with animated text ticker
- Article viewing with comments
- Responsive design
- Deep linking support (Universal Links / App Links)
- SEO optimized

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Update `NEXT_PUBLIC_API_URL` in `.env.local` with your backend API URL.

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Routes

- `/` - Landing page (marketing site)
- `/article/[id]` - View article with ID

## Deployment to Vercel

1. Push code to GitHub
2. Import to Vercel
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Configure custom domain: `patreek.com` and `www.patreek.com`
5. Update GoDaddy DNS (see `GODADDY_DNS_SETUP.md`)

## Universal Links Configuration

After deployment, update:
- `public/.well-known/apple-app-site-association` - Replace `TEAM_ID` with your Apple Team ID
- `public/.well-known/assetlinks.json` - Replace `YOUR_APP_SHA256_FINGERPRINT` with your Android app fingerprint

## Styling

The landing page matches the original Webflow design with:
- Google Fonts: Varela (body) and Oswald (headings)
- Gradient buttons and accents
- Responsive grid layouts
- Smooth animations
