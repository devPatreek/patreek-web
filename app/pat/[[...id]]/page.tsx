import PatPageClient from './ArticlePageClient';

// For static export with GitHub Pages, we need to generate at least one param
// For optional catch-all routes [[...id]], we need to return an object with id as an array
// This handles both /pat/ (homepage) and /pat/{id} (article) routes
export async function generateStaticParams() {
  // Return a single param with empty array to satisfy Next.js requirement for catch-all routes
  // This creates /pat/index.html which will handle routing client-side
  // The actual article routing (/pat/123) is handled via 404.html redirect
  return [{ id: [] }];
}

export const revalidate = 60;

export default function PatPage() {
  return <PatPageClient />;
}
