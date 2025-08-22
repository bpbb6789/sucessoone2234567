import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VideoCard } from "@/components/VideoCard";
import { CategoryChips } from "@/components/CategoryChips";
import { type VideoWithChannel } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: videos = [], isLoading, error } = useQuery<VideoWithChannel[]>({
    queryKey: ["/api/videos", selectedCategory !== "All" ? selectedCategory : undefined].filter(Boolean),
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load videos</h2>
          <p className="text-gray-500 dark:text-gray-400">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="page-home">
      <CategoryChips 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-3 animate-pulse" data-testid={`video-skeleton-${i}`}>
                <div className="bg-gray-200 dark:bg-gray-700 rounded-xl video-aspect"></div>
                <div className="flex space-x-3">
                  <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No videos found</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {selectedCategory !== "All" 
                ? `No videos found in the ${selectedCategory} category`
                : "No videos available at the moment"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => {
                  // TODO: Navigate to watch page
                  console.log("Video clicked:", video.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
