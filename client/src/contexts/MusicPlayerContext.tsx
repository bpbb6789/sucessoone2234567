import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';

export interface Track {
  id: string;
  title: string;
  creator: string;
  audioUrl: string;
  coverUrl?: string;
  duration?: number;
  isLiked?: boolean;
}

interface MusicPlayerContextType {
  // Current state
  currentTrack: Track | null;
  playlist: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isRepeat: boolean;
  isShuffle: boolean;

  // Player actions
  loadTrack: (track: Track) => void;
  loadPlaylist: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleLike: (trackId: string) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70); // 0-100
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    // Audio event listeners
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
      } else {
        skipNext();
      }
    };
    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    // Set initial volume
    audio.volume = volume / 100;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = currentTrack.audioUrl;
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrack]);

  const loadTrack = (track: Track) => {
    setCurrentTrack(track);
    setPlaylist([track]);
    setCurrentIndex(0);
    setIsPlaying(true);
  };

  const loadPlaylist = (tracks: Track[], startIndex = 0) => {
    setPlaylist(tracks);
    setCurrentIndex(startIndex);
    setCurrentTrack(tracks[startIndex] || null);
    setIsPlaying(true);
  };

  const play = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.play().catch(console.error);
    setIsPlaying(true);
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsPlaying(false);
  };

  const skipNext = () => {
    if (playlist.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      // Random track
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    setCurrentIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
    setIsPlaying(true);
  };

  const skipPrevious = () => {
    if (playlist.length === 0) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
    setIsPlaying(true);
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    audio.volume = clampedVolume / 100;
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const toggleLike = (trackId: string) => {
    setCurrentTrack(prev => {
      if (!prev || prev.id !== trackId) return prev;
      return { ...prev, isLiked: !prev.isLiked };
    });

    setPlaylist(prev => 
      prev.map(track => 
        track.id === trackId 
          ? { ...track, isLiked: !track.isLiked }
          : track
      )
    );
  };

  const value: MusicPlayerContextType = {
    currentTrack,
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isRepeat,
    isShuffle,
    loadTrack,
    loadPlaylist,
    play,
    pause,
    skipNext,
    skipPrevious,
    seekTo,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    toggleLike,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}