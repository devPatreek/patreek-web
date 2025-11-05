import ArticlePageClient from './ArticlePageClient';

// Required for static export - Next.js needs at least one param
// We return a minimal param to satisfy the requirement, but the page
// handles all article IDs dynamically via client-side routing
export async function generateStaticParams() {
  // Return minimal param to satisfy Next.js static export requirement
  // The actual article is fetched dynamically in the browser
  return [{ id: [] }];
}

export default function ArticlePage() {
  return <ArticlePageClient />;
}
