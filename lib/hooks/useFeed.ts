'use client';

import useSWRInfinite, {
  SWRInfiniteConfiguration,
  SWRInfiniteKeyLoader,
} from 'swr/infinite';

const DEFAULT_DEDUPING_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useFeed<Data = any, Error = any>(
  getKey: SWRInfiniteKeyLoader<Data, Error>,
  fetcher: (...args: any[]) => Promise<Data>,
  config?: SWRInfiniteConfiguration<Data, Error>
) {
  return useSWRInfinite<Data, Error>(getKey, fetcher, {
    dedupingInterval: DEFAULT_DEDUPING_INTERVAL,
    revalidateOnFocus: false,
    ...config,
  });
}
