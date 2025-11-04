import { redirect } from 'next/navigation';

/**
 * Article redirect page - Server Component
 * 
 * This page handles article links from sharing:
 * - If app is installed: Universal Links will intercept and open the app (iOS/Android)
 * - If app is not installed: This page redirects to App Store/Play Store
 */
export default function ArticleRedirectPage() {
  // Redirect to App Store (will be handled by Universal Links if app is installed)
  redirect('https://apps.apple.com/us/app/patreek/id6547858283');
}

// Required for static export - generate paths for common article IDs
export async function generateStaticParams() {
  // Generate paths for a range of article IDs (1-10000)
  // This allows static export to work. Universal Links will intercept before redirect.
  return Array.from({ length: 10000 }, (_, i) => ({
    id: String(i + 1),
  }));
}
