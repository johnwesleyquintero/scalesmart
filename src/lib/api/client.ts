/**
 * Generic fetcher function for client-side data fetching.
 * @param url - The URL to fetch.
 * @param options - Request options.
 * @returns The parsed JSON response.
 * @throws Error if the network response is not ok.
 */
export async function fetcher<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An unknown error occurred');
  }

  return response.json();
}

// Example usage (can be removed or modified as needed)
// import useSWR from 'swr';
// function MyComponent() {
//   const { data, error } = useSWR('/api/some-endpoint', fetcher);
//   if (error) return <div>Failed to load</div>;
//   if (!data) return <div>Loading...</div>;
//   return <div>{data.message}</div>;
// }
