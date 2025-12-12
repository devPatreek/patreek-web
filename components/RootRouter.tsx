'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const ArticlePageClient = dynamic(() => import('@/app/article/[[...id]]/ArticlePageClient'), { ssr: false });
const UserProfileClient = dynamic(() => import('@/app/u/[username]/UserProfileClient'), { ssr: false });
const LinksHomePage = dynamic(() => import('@/app/page'), { ssr: false });

/**
 * Root router component that handles client-side routing for GitHub Pages
 * Since GitHub Pages serves 404.html (which is a copy of index.html) for unknown routes,
 * we need to check the pathname and render the appropriate component
 */
export default function RootRouter() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Get the actual pathname from window.location (works even with 404.html redirect)
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  // Update current path when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, [pathname]);

  // Use window.location.pathname as the source of truth since it works with 404.html redirects
  const articleMatch = mounted && currentPath ? currentPath.match(/^\/article\/(\d+)/) : null;
  const profileMatch = mounted && currentPath ? currentPath.match(/^\/u\/([^/]+)/) : null;

  if (articleMatch) {
    return <ArticlePageClient />;
  }

  if (profileMatch) {
    return <UserProfileClient params={{ username: decodeURIComponent(profileMatch[1]) }} />;
  }

  return <LinksHomePage />;
}
