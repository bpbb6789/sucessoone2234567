import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { type MusicTrack, type MusicAlbum } from "@shared/schema";

interface MusicPlayerProps {
  currentTrack?: MusicTrack;
  currentAlbum?: MusicAlbum;
  onTrackChange?: (trackId: string) => void;
  className?: string;
}

export function MusicPlayer({ 
  currentTrack, 
  currentAlbum, 
  onTrackChange,
  className 
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isLiked, setIsLiked] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch tracks for the current album
  const { data: albumTracks = [] } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music/tracks", currentAlbum?.id],
    enabled: !!currentAlbum?.id,
    queryFn: async () => {
      const params = new URLSearchParams({ albumId: currentAlbum!.id });
      const response = await fetch(`/api/music/tracks?${params}`);
      return response.json();
    }
  });

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      handleNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [repeatMode, albumTracks, currentTrack]);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audioUrl || '';
    audio.volume = isMuted ? 0 : volume;
    
    if (isPlaying) {
      audio.play().catch(console.error);
    }
  }, [currentTrack, volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (values: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = values[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = !isMuted ? 0 : volume;
    }
  };

  const handlePrevious = () => {
    if (!currentTrack || !albumTracks.length || !onTrackChange) return;

    const currentIndex = albumTracks.findIndex(track => track.id === currentTrack.id);
    if (currentIndex > 0) {
      onTrackChange(albumTracks[currentIndex - 1].id);
    } else if (repeatMode === 'all') {
      onTrackChange(albumTracks[albumTracks.length - 1].id);
    }
  };

  const handleNext = () => {
    if (!currentTrack || !albumTracks.length || !onTrackChange) return;

    const currentIndex = albumTracks.findIndex(track => track.id === currentTrack.id);
    
    if (repeatMode === 'one') {
      // Repeat current track
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        if (isPlaying) audio.play();
      }
      return;
    }

    let nextIndex;
    if (isShuffled) {
      // Random track
      nextIndex = Math.floor(Math.random() * albumTracks.length);
    } else if (currentIndex < albumTracks.length - 1) {
      // Next track
      nextIndex = currentIndex + 1;
    } else if (repeatMode === 'all') {
      // Loop to first track
      nextIndex = 0;
    } else {
      // End of playlist
      setIsPlaying(false);
      return;
    }

    onTrackChange(albumTracks[nextIndex].id);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRepeat = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  if (!currentTrack) {
    return (
      <Card className={cn("p-4 text-center text-gray-500", className)}>
        <p>No track selected</p>
      </Card>
    );
  }

  return (
    <Card className={cn("p-4", className)} data-testid="music-player">
      <audio ref={audioRef} preload="metadata" />
      
      <div className="flex items-center gap-4">
        {/* Album Art & Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={currentAlbum?.coverUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop&crop=center"}
            alt={currentAlbum?.title || "Album cover"}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
            data-testid="album-art"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate" data-testid="track-title">
              {currentTrack.title}
            </p>
            <p className="text-xs text-gray-500 truncate" data-testid="track-artist">
              {currentAlbum?.artist || "Unknown Artist"}
            </p>
          </div>
          <Button
            onClick={() => setIsLiked(!isLiked)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            data-testid="button-heart-track"
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current text-red-500")} />
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsShuffled(!isShuffled)}
            variant="ghost"
            size="sm"
            className={cn(isShuffled && "text-blue-600")}
            data-testid="button-shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </Button>

          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="sm"
            data-testid="button-previous"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            onClick={togglePlay}
            variant="default"
            size="sm"
            className="w-8 h-8 p-0 rounded-full"
            data-testid={isPlaying ? "button-pause" : "button-play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            onClick={handleNext}
            variant="ghost"
            size="sm"
            data-testid="button-next"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            onClick={toggleRepeat}
            variant="ghost"
            size="sm"
            className={cn(repeatMode !== 'off' && "text-blue-600")}
            data-testid="button-repeat"
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-xs">1</span>
            )}
          </Button>
        </div>

        {/* Progress & Volume */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs text-gray-500 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="flex-1"
            data-testid="progress-slider"
          />
          
          <span className="text-xs text-gray-500 w-10">
            {formatTime(duration)}
          </span>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              data-testid="button-mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
              data-testid="volume-slider"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            data-testid="button-more-options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}