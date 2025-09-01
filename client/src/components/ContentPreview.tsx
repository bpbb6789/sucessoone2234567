import React, { useState, useRef, useEffect } from 'react';
import { Play } from "lucide-react";

interface ContentPreviewProps {
  mediaCid: string;
  thumbnailCid?: string | null;
  contentType: string;
  title: string;
  className?: string;
}

const getContentUrl = (mediaCid: string): string => {
  return `https://gateway.pinata.cloud/ipfs/${mediaCid}`;
};

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  mediaCid,
  thumbnailCid,
  contentType,
  title,
  className = ""
}) => {
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const contentUrl = getContentUrl(mediaCid);
  const thumbnailUrl = thumbnailCid ? getContentUrl(thumbnailCid) : null;

  const fallbackSvg = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#374151"/>
      <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="Arial" font-size="16">
        ${contentType.toUpperCase()}
      </text>
    </svg>
  `)}`;

  const handleLoadStart = () => setIsLoading(true);
  const handleLoadEnd = () => setIsLoading(false);
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  useEffect(() => {
    // For video content, preload metadata to get first frame
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', handleLoadEnd);
      videoRef.current.addEventListener('error', handleError);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadEnd);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [contentType]);

  // Render based on content type
  const renderContent = () => {
    if (hasError) {
      return (
        <img
          src={fallbackSvg}
          alt={title}
          className={`w-full h-full object-cover ${className}`}
        />
      );
    }

    switch (contentType.toLowerCase()) {
      case 'video':
        return (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={contentUrl}
              poster={thumbnailUrl || undefined}
              preload="metadata"
              muted
              className={`w-full h-full object-cover ${className}`}
              onLoadStart={handleLoadStart}
              onLoadedMetadata={handleLoadEnd}
              onError={handleError}
              onMouseEnter={() => setShowPlayButton(true)}
              onMouseLeave={() => setShowPlayButton(false)}
            />
            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
                <div className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        );

      case 'gif':
        return (
          <div className="relative w-full h-full">
            <img
              src={contentUrl}
              alt={title}
              className={`w-full h-full object-cover ${className}`}
              onLoad={handleLoadEnd}
              onError={handleError}
              onMouseEnter={() => setShowPlayButton(true)}
              onMouseLeave={() => setShowPlayButton(false)}
            />
            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
                <div className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-500">
            <audio
              ref={audioRef}
              src={contentUrl}
              preload="metadata"
              onLoadStart={handleLoadStart}
              onLoadedMetadata={handleLoadEnd}
              onError={handleError}
            />
            {/* Audio visualization background */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/60 rounded-full animate-pulse"
                    style={{
                      height: `${20 + (i % 3) * 10}px`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '1.5s'
                    }}
                  />
                ))}
              </div>
            </div>
            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
                <div className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}
            <div
              className="absolute inset-0 cursor-pointer"
              onMouseEnter={() => setShowPlayButton(true)}
              onMouseLeave={() => setShowPlayButton(false)}
            />
          </div>
        );

      case 'image':
      default:
        return (
          <img
            src={thumbnailUrl || contentUrl}
            alt={title}
            className={`w-full h-full object-cover ${className}`}
            onLoad={handleLoadEnd}
            onError={handleError}
          />
        );
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
      {renderContent()}
    </div>
  );
};