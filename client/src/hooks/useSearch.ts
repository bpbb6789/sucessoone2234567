import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type VideoWithChannel, type ShortsWithChannel, type Channel } from "@shared/schema";

interface SearchResults {
  videos?: VideoWithChannel[];
  shorts?: ShortsWithChannel[];
  channels?: Channel[];
}

export function useSearch() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "videos" | "shorts" | "channels">("all");

  const { data: results, isLoading, error } = useQuery<SearchResults>({
    queryKey: ["/api/search", query, searchType],
    enabled: query.length > 2,
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        ...(searchType !== "all" && { type: searchType })
      });
      
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      return response.json();
    },
    staleTime: 30000, // Cache results for 30 seconds
  });

  return {
    query,
    setQuery,
    searchType,
    setSearchType,
    results: results || {},
    isLoading,
    error,
    hasResults: !!(results && (results.videos?.length || results.shorts?.length || results.channels?.length))
  };
}