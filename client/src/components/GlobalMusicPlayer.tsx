import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useMusicPlayer } from '@/contexts/MusicPlayerContext';

export function GlobalMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isRepeat,
    isShuffle,
    play,
    pause,
    skipNext,
    skipPrevious,
    seekTo,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    toggleLike
  } = useMusicPlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(volume);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleProgressChange = (value: number[]) => {
    seekTo(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (newVolume > 0) {
      setPreviousVolume(newVolume);
    }
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 p-4 z-50">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Layout */}
        <div className="md:hidden flex items-center gap-3">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl.startsWith('baf') 
                    ? `https://gateway.pinata.cloud/ipfs/${currentTrack.coverUrl}` 
                    : currentTrack.coverUrl
                  }
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{currentTrack.title.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-semibold text-sm truncate">{currentTrack.title}</h4>
              <p className="text-gray-400 text-xs truncate">{currentTrack.creator}</p>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={isPlaying ? pause : play}
              className="bg-white hover:bg-gray-200 text-black rounded-full w-8 h-8 p-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={skipNext}
              className="p-1 hover:bg-gray-700 text-gray-400"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl.startsWith('baf') 
                    ? `https://gateway.pinata.cloud/ipfs/${currentTrack.coverUrl}` 
                    : currentTrack.coverUrl
                  }
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{currentTrack.title.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-semibold text-sm truncate">{currentTrack.title}</h4>
              <p className="text-gray-400 text-xs truncate">{currentTrack.creator}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleLike(currentTrack.id)}
              className={`p-1 hover:bg-gray-700 ${currentTrack.isLiked ? 'text-red-500' : 'text-gray-400'}`}
            >
              <Heart className={`w-4 h-4 ${currentTrack.isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleShuffle}
                className={`p-2 hover:bg-gray-700 ${isShuffle ? 'text-green-500' : 'text-gray-400'}`}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={skipPrevious}
                className="p-2 hover:bg-gray-700 text-gray-400"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={isPlaying ? pause : play}
                className="bg-white hover:bg-gray-200 text-black rounded-full w-10 h-10 p-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={skipNext}
                className="p-2 hover:bg-gray-700 text-gray-400"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleRepeat}
                className={`p-2 hover:bg-gray-700 ${isRepeat ? 'text-green-500' : 'text-gray-400'}`}
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleProgressChange}
                className="flex-1"
              />
              <span className="text-xs text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Additional Controls */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="flex items-center gap-2 max-w-32">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleVolumeToggle}
                className="p-2 hover:bg-gray-700 text-gray-400"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              className="p-2 hover:bg-gray-700 text-gray-400"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}