import ArticlePageClient from './ArticlePageClient';

// For static export with GitHub Pages, we need to generate at least one param
// For optional catch-all routes [[...id]], we need to return an object with id as an array
// All article IDs will be handled client-side via the ArticlePageClient component
export async function generateStaticParams() {
  // Return a single param with empty array to satisfy Next.js requirement for catch-all routes
  // This creates /article/index.html which will handle routing client-side
  // The actual article routing (/article/123) is handled via 404.html redirect
  return [{ id: [] }];
}

export default function ArticlePage() {
  return <ArticlePageClient />;
}
