import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  Share,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreVertical,
  ArrowLeft,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useCreatorCoins } from "@/hooks/useCreatorCoins";
import TradingModal from "@/components/TradingModal";

interface FeedItem {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  video: {
    url: string;
    thumbnail: string;
  };
  description: string;
  music: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
}

interface ContentReel {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  creator: {
    address: string;
    name: string;
    avatar?: string;
  };
  coinSymbol: string;
  marketCap: string;
  price: string;
  change24h: string;
  holders: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

// Mock data for the feed
const mockFeedData: FeedItem[] = [
  {
    id: "1",
    user: {
      name: "Creator One",
      username: "@creator1",
      avatar: "/images/tv.jpeg",
    },
    video: {
      url: "",
      thumbnail: "/images/tv.jpeg",
    },
    description:
      "Check out this amazing content! #viral #trending #contentcoin",
    music: "Original Sound - Creator One",
    likes: 12400,
    comments: 847,
    shares: 234,
    isLiked: false,
  },
  {
    id: "2",
    user: {
      name: "Digital Artist",
      username: "@digitalart",
      avatar: "/nfts/1.jpeg",
    },
    video: {
      url: "",
      thumbnail: "/nfts/1.jpeg",
    },
    description: "New NFT drop coming soon! What do you think? 🎨✨",
    music: "Trending Audio - Digital Vibes",
    likes: 8900,
    comments: 423,
    shares: 156,
    isLiked: true,
  },
  {
    id: "3",
    user: {
      name: "Crypto Guru",
      username: "@cryptoguru",
      avatar: "/nfts/2.jpeg",
    },
    video: {
      url: "",
      thumbnail: "/nfts/2.jpeg",
    },
    description:
      "Trading tips that changed my life 💰 #crypto #trading #finance",
    music: "Motivational Beat - Success Sounds",
    likes: 15600,
    comments: 1200,
    shares: 445,
    isLiked: false,
  },
  {
    id: "4",
    user: {
      name: "Tech Reviewer",
      username: "@techreview",
      avatar: "/nfts/3.jpeg",
    },
    video: {
      url: "",
      thumbnail: "/nfts/3.jpeg",
    },
    description: "Latest blockchain technology explained in 60 seconds! 🚀",
    music: "Tech Beats - Innovation Sound",
    likes: 9800,
    comments: 567,
    shares: 289,
    isLiked: true,
  },
  {
    id: "5",
    user: {
      name: "Content Creator",
      username: "@content_king",
      avatar: "/nfts/4.jpeg",
    },
    video: {
      url: "",
      thumbnail: "/nfts/4.jpeg",
    },
    description: "Behind the scenes of my content creation process 📹",
    music: "Creative Flow - Studio Sessions",
    likes: 7300,
    comments: 298,
    shares: 134,
    isLiked: false,
  },
];

const ContentReelCard: React.FC<{
  item: ContentReel;
  isActive: boolean;
  onLike: (id: string) => void;
}> = ({ item, isActive, onLike }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num < 0.001) {
      return `$${num.toFixed(6)}`;
    }
    return `$${num.toFixed(4)}`;
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center snap-start">
      {/* Content Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.imageUri})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* Play/Pause Overlay */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        {!isPlaying && (
          <Play className="w-16 h-16 text-white opacity-80 fill-white" />
        )}
      </button>

      {/* Content Info - Left Side */}
      <div className="absolute bottom-0 left-0 p-3 text-white z-20 max-w-[70%]">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-10 h-10 border-2 border-white/20">
            <AvatarImage src={item.creator.avatar || `/nfts/${Math.floor(Math.random() * 9) + 1}.jpeg`} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
              {item.creator.name ? item.creator.name[0] : (item.creator.address ? item.creator.address.slice(2, 4).toUpperCase() : 'CC')}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">
              {item.creator.name || (item.creator.address ? `${item.creator.address.slice(0, 6)}...${item.creator.address.slice(-4)}` : 'Unknown Creator')}
            </p>
            <p className="text-xs text-gray-300">{item.coinSymbol}</p>
          </div>
          <TradingModal
            coinAddress={item.creator.address}
            coinName={item.title}
            ticker={item.coinSymbol}
            currentPrice={item.price}
            marketCap={item.marketCap}
          >
            <Button
              size="sm"
              className="ml-2 bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-1 text-xs h-7 font-bold"
            >
              BUY
            </Button>
          </TradingModal>
        </div>

        <div className="mb-3">
          <h3 className="font-bold text-lg mb-1">{item.title}</h3>
          <p className="text-sm leading-tight opacity-90">{item.description}</p>
        </div>

        {/* Token Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{formatPrice(item.price)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{formatCount(item.holders)} holders</span>
          </div>
          <div className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm">
            <span className={cn(
              "text-xs font-medium",
              item.change24h.startsWith('+') ? "text-green-400" : "text-red-400"
            )}>
              {item.change24h}
            </span>
          </div>
        </div>
      </div>

      {/* Actions - Right Side */}
      <div className="absolute bottom-0 right-0 p-3 z-20">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => onLike(item.id)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.likes)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.comments)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
              <Share className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.shares)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.holders)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
              <MoreVertical className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedVideoCard: React.FC<{
  item: FeedItem;
  isActive: boolean;
  onLike: (id: string) => void;
}> = ({ item, isActive, onLike }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive, isPlaying]);

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="relative w-full h-screen bg-black flex items-center justify-center snap-start">
      {/* Video Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${item.video.thumbnail})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      </div>

      {/* Play/Pause Overlay */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute inset-0 z-10 flex items-center justify-center"
      >
        {!isPlaying && (
          <Play className="w-16 h-16 text-white opacity-80 fill-white" />
        )}
      </button>

      {/* User Info - Left Side */}
      <div className="absolute bottom-0 left-0 p-3 text-white z-20 max-w-[70%]">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={item.user.avatar} />
            <AvatarFallback>{item.user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-xs">{item.user.name}</p>
            <p className="text-xs text-gray-400">{item.user.username}</p>
          </div>
          <TradingModal
            coinAddress={item.user.avatar}
            coinName={item.user.name}
            ticker="COIN"
            currentPrice="0.001"
            marketCap="100K"
          >
            <Button
              size="sm"
              className="ml-1 bg-green-500 hover:bg-green-600 text-white rounded-full px-3 py-0.5 text-xs h-6 font-bold"
            >
              BUY
            </Button>
          </TradingModal>
        </div>

        <p className="text-xs mb-1 leading-tight">{item.description}</p>

        <div className="flex items-center gap-1 text-xs">
          <Volume2 className="w-3 h-3" />
          <span className="truncate">{item.music}</span>
        </div>
      </div>

      {/* Actions - Right Side */}
      <div className="absolute bottom-0 right-0 p-3 z-20">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => onLike(item.id)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                item.isLiked ? "bg-red-500" : "bg-gray-800/50",
              )}
            >
              <Heart
                className={cn(
                  "w-5 h-5",
                  item.isLiked ? "text-white fill-white" : "text-white",
                )}
              />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.likes)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.comments)}
            </span>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center">
              <Share className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-medium">
              {formatCount(item.shares)}
            </span>
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </div>
          </button>

          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center">
              <MoreVertical className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedTabs: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  onBack: () => void;
}> = ({ activeTab, onTabChange, onBack }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between pt-12 pb-3 px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => onTabChange("channels")}
            className={cn(
              "px-2 py-1 text-sm transition-all duration-200",
              activeTab === "channels"
                ? "text-white font-bold"
                : "text-gray-400 font-normal hover:text-gray-300",
            )}
          >
            Channels
          </button>
          <button
            onClick={() => onTabChange("contents")}
            className={cn(
              "px-2 py-1 text-sm transition-all duration-200",
              activeTab === "contents"
                ? "text-white font-bold"
                : "text-gray-400 font-normal hover:text-gray-300",
            )}
          >
            Contents
          </button>
          <button
            onClick={() => onTabChange("music")}
            className={cn(
              "px-2 py-1 text-sm transition-all duration-200",
              activeTab === "music"
                ? "text-white font-bold"
                : "text-gray-400 font-normal hover:text-gray-300",
            )}
          >
            Music
          </button>
          <button
            onClick={() => onTabChange("subscribed")}
            className={cn(
              "px-2 py-1 text-sm transition-all duration-200",
              activeTab === "subscribed"
                ? "text-white font-bold"
                : "text-gray-400 font-normal hover:text-gray-300",
            )}
          >
            All
          </button>
        </div>

        {/* Empty space for balance */}
        <div className="w-8"></div>
      </div>
    </div>
  );
};

export default function Feed() {
  const [feedData, setFeedData] = useState<FeedItem[]>(mockFeedData);
  const [contentsData, setContentsData] = useState<ContentReel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contents");
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  
  // Fetch content coins data
  const { data: creatorCoins, isLoading: coinsLoading } = useCreatorCoins();

  // Transform creator coins into content reels
  useEffect(() => {
    if (creatorCoins && creatorCoins.length > 0) {
      const reels: ContentReel[] = creatorCoins.map((coin, index) => ({
        id: coin.id,
        title: coin.title || `${coin.coinSymbol} Content Coin`,
        description: coin.description || coin.title || `${coin.coinSymbol} Content`,
        imageUri: coin.mediaCid ? `https://gateway.pinata.cloud/ipfs/${coin.mediaCid}` : `/nfts/${(index % 9) + 1}.jpeg`,
        creator: {
          address: coin.creatorAddress,
          name: '', // No creator name field in schema
          avatar: coin.thumbnailCid ? `https://gateway.pinata.cloud/ipfs/${coin.thumbnailCid}` : `/nfts/${(index % 9) + 1}.jpeg`
        },
        coinSymbol: coin.coinSymbol,
        marketCap: coin.marketCap || `$${(Math.random() * 1000 + 100).toFixed(0)}K`,
        price: coin.currentPrice || `${(Math.random() * 0.01 + 0.001).toFixed(6)}`,
        change24h: Math.random() > 0.5 ? `+${(Math.random() * 50).toFixed(1)}%` : `-${(Math.random() * 20).toFixed(1)}%`,
        holders: coin.holders || Math.floor(Math.random() * 1000) + 50,
        likes: coin.likes || Math.floor(Math.random() * 5000) + 100,
        comments: coin.comments || Math.floor(Math.random() * 500) + 20,
        shares: coin.shares || Math.floor(Math.random() * 200) + 10,
        views: Math.floor(Math.random() * 50000) + 1000,
      }));
      setContentsData(reels);
    }
  }, [creatorCoins]);

  const handleBack = () => {
    setLocation("/");
  };

  const handleLike = useCallback((id: string) => {
    setFeedData((prevData) =>
      prevData.map((item) =>
        item.id === id
          ? {
              ...item,
              isLiked: !item.isLiked,
              likes: item.isLiked ? item.likes - 1 : item.likes + 1,
            }
          : item,
      ),
    );
  }, []);

  const loadMoreContent = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newItems = mockFeedData.map((item, index) => ({
        ...item,
        id: `${item.id}_${Date.now()}_${index}`,
      }));

      setFeedData((prevData) => [...prevData, ...newItems]);
      setIsLoading(false);
    }, 1000);
  }, [isLoading]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const scrollPercentage = scrollTop / (scrollHeight - clientHeight);

      // Calculate current video index based on scroll position
      const newIndex = Math.round(scrollPercentage * (feedData.length - 1));
      setCurrentIndex(newIndex);

      // Load more content when near bottom
      if (scrollPercentage > 0.8) {
        loadMoreContent();
      }
    },
    [feedData.length, loadMoreContent],
  );

  return (
    <div className="min-h-screen bg-black relative">
      {/* TikTok-style tabs - only on mobile */}
      {isMobile && (
        <FeedTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onBack={handleBack}
        />
      )}

      {/* Desktop tabs - for larger screens */}
      {!isMobile && (
        <div className="sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Back Button for Desktop */}
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-800/70 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              {/* Tabs */}
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("channels")}
                  className={cn(
                    "px-2 py-1 text-sm transition-all duration-200",
                    activeTab === "channels"
                      ? "text-white font-bold"
                      : "text-gray-400 font-normal hover:text-gray-300",
                  )}
                >
                  Channels
                </button>
                <button
                  onClick={() => setActiveTab("contents")}
                  className={cn(
                    "px-2 py-1 text-sm transition-all duration-200",
                    activeTab === "contents"
                      ? "text-white font-bold"
                      : "text-gray-400 font-normal hover:text-gray-300",
                  )}
                >
                  Contents
                </button>
                <button
                  onClick={() => setActiveTab("music")}
                  className={cn(
                    "px-2 py-1 text-sm transition-all duration-200",
                    activeTab === "music"
                      ? "text-white font-bold"
                      : "text-gray-400 font-normal hover:text-gray-300",
                  )}
                >
                  Music
                </button>
                <button
                  onClick={() => setActiveTab("subscribed")}
                  className={cn(
                    "px-2 py-1 text-sm transition-all duration-200",
                    activeTab === "subscribed"
                      ? "text-white font-bold"
                      : "text-gray-400 font-normal hover:text-gray-300",
                  )}
                >
                  Subscribed
                </button>
              </div>

              {/* Empty space for balance */}
              <div className="w-8"></div>
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn(
          "overflow-y-auto snap-y snap-mandatory scrollbar-hide",
          isMobile ? "h-screen" : "h-[calc(100vh-4rem)]",
        )}
        onScroll={handleScroll}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {activeTab === "contents" ? (
          // Render Contents as reels
          <>
            {coinsLoading ? (
              <div className="h-screen flex items-center justify-center bg-black">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading content reels...</p>
                </div>
              </div>
            ) : contentsData.length > 0 ? (
              contentsData.map((item, index) => (
                <ContentReelCard
                  key={item.id}
                  item={item}
                  isActive={index === currentIndex}
                  onLike={handleLike}
                />
              ))
            ) : (
              <div className="h-screen flex items-center justify-center bg-black">
                <div className="text-white text-center">
                  <p className="text-xl mb-2">No content reels yet</p>
                  <p className="text-gray-400">Create your first content coin to get started!</p>
                </div>
              </div>
            )}
          </>
        ) : (
          // Render regular feed for other tabs
          feedData.map((item, index) => (
            <FeedVideoCard
              key={item.id}
              item={item}
              isActive={index === currentIndex}
              onLike={handleLike}
            />
          ))
        )}

        {isLoading && activeTab !== "contents" && (
          <div className="h-screen flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading more content...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}