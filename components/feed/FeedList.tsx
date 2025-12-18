import useSWRInfinite from 'swr/infinite';
import { useEffect, useMemo, useRef } from 'react';
import NewsCard from './NewsCard';

const PAGE_SIZE = 10;

interface PaginatedResponse<T> {
  content: T[];
  totalPages?: number;
  number?: number;
}

interface FeedListProps {
  fetchUrl: string;
  queryKey: string;
  requiresAuth?: boolean;
  onAuthWall?: (action: string) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to load feed page');
  }
  return res.json();
});

export default function FeedList({ fetchUrl, queryKey, requiresAuth = false, onAuthWall }: FeedListProps) {
  const getKey = (pageIndex: number, previousPageData: PaginatedResponse<any> | null) => {
    if (previousPageData && previousPageData.content.length === 0) {
      return null;
    }
    return [queryKey, `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}page=${pageIndex}&size=${PAGE_SIZE}`] as const;
  };

  const {
    data,
    size,
    setSize,
    error,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
  });

  const feeds = useMemo(
    () => data?.flatMap((page) => page?.content || []) ?? [],
    [data]
  );

  const isInitialLoading = !data && !error;
  const isLoadingMore = isValidating && size > 0;
  const isReachingEnd = data && data[data.length - 1] && data[data.length - 1].content.length < PAGE_SIZE;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loaderRef.current) {
      return undefined;
    }
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
          setSize((prev) => prev + 1);
        }
      },
      {
        rootMargin: '200px',
      }
    );
    observerRef.current.observe(loaderRef.current);
    return () => {
      observerRef.current?.disconnect();
    };
  }, [isLoadingMore, isReachingEnd, setSize, size]);

  if (error) {
    return <p style={{ color: '#ef4444' }}>Unable to load content.</p>;
  }

  if (isInitialLoading) {
    return <p>Loading stories…</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {feeds.map((feed: any) => (
        <NewsCard
          key={feed.id}
          title={feed.title}
          summary={feed.excerpt || feed.body}
          source={feed.source || feed.categoryName}
          createdAt={feed.createdAt || feed.publishedAt}
          patCount={feed.patCount ?? 0}
          thumbnailUrl={feed.imageUrl || feed.articleImageUrl || feed.authorAvatarUrl || feed.avatarUrl}
          isPattedByCurrentUser={feed.hasPatted}
          requiresAuth={requiresAuth}
          onAuthWall={onAuthWall}
        />
      ))}

      <div ref={loaderRef} />

      {isLoadingMore && <p>Loading more…</p>}

      {isReachingEnd && feeds.length > 0 && <p style={{ color: '#6b7280' }}>You’ve reached the latest posts.</p>}
    </div>
  );
}
