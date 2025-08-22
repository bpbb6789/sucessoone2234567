"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

interface ReelCardProps {
  title: string;
  author: string;
  thumbnail: string;
  likes: number;
  comments: number;
  shares: number;
  tokenSymbol: string;
  tokenAddress: string;
}

export function ReelCard({
  title,
  author,
  thumbnail,
  likes,
  comments,
  shares,
  tokenSymbol,
  tokenAddress,
}: ReelCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/token/?address=${tokenAddress}`}>
      <Card 
        className="relative overflow-hidden rounded-xl group cursor-pointer bg-zinc-900 border-zinc-800"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-[9/16] relative">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
          
          {/* Play Button Overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>

          {/* Token Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm text-white border-0"
          >
            ${tokenSymbol}
          </Badge>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <h3 className="text-white font-medium line-clamp-2">{title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">@{author}</span>
              <div className="flex items-center gap-3 text-white/80">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{comments}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">{shares}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
