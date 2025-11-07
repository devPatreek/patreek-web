import PublicPatsPageClient from './ArticlePageClient';

// For static export with GitHub Pages, we need to generate at least one param
// For optional catch-all routes [[...id]], we need to return an object with id as an array
// This handles both /public/pats/ (homepage) and /public/pats/{id} (article) routes
export async function generateStaticParams() {
  // Return a single param with empty array to satisfy Next.js requirement for catch-all routes
  // This creates /public/pats/index.html which will handle routing client-side
  // The actual article routing (/public/pats/123) is handled via 404.html redirect
  return [{ id: [] }];
}

export default function PublicPatsPage() {
  return <PublicPatsPageClient />;
}

