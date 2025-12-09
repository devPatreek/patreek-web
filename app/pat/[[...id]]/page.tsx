import PatPageClient from './ArticlePageClient';

// For static export with GitHub Pages, we need to generate at least one param
// For optional catch-all routes [[...id]], we need to return an object with id as an array
// This handles both /pat/ (homepage) and /pat/{id} (article) routes
export async function generateStaticParams() {
  return [];
}

export const revalidate = 60;

export default function PatPage() {
  return <PatPageClient />;
}
