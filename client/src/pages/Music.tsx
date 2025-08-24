import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Heart, MoreHorizontal, Shuffle, SkipBack, SkipForward, Volume2, ArrowLeft, Plus, Share } from "lucide-react";
import { type MusicAlbum, type MusicTrack } from "@shared/schema";
import { cn } from "@/lib/utils";

interface MusicPlayerState {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface ViewState {
  view: 'home' | 'album' | 'nowplaying';
  selectedAlbum?: MusicAlbum;
}

export default function Music() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewState, setViewState] = useState<ViewState>({ view: 'home' });
  const [player, setPlayer] = useState<MusicPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: albums = [], isLoading: albumsLoading } = useQuery<MusicAlbum[]>({
    queryKey: ["/api/music/albums"],
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery<MusicTrack[]>({
    queryKey: ["/api/music/tracks"],
  });

  const isLoading = albumsLoading || tracksLoading;

  const categories = ["All", "Music", "Podcasts"];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlayer(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setPlayer(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      setPlayer(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (player.isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [player.isPlaying]);

  const playTrack = (track: MusicTrack) => {
    setPlayer({
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.duration,
    });
    setViewState({ view: 'nowplaying' });

    // Set audio source - using a demo audio file since the track doesn't have real audio URLs
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl || "https://www.soundjay.com/misc/sounds/cash-register-02.mp3";
      audioRef.current.load();
    }
  };

  const togglePlayPause = () => {
    setPlayer(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const openAlbum = (album: MusicAlbum) => {
    setViewState({ view: 'album', selectedAlbum: album });
  };

  const goBack = () => {
    if (viewState.view === 'album') {
      setViewState({ view: 'home' });
    } else if (viewState.view === 'nowplaying') {
      setViewState({ view: 'home' });
    }
  };

  const albumTracks = tracks.filter(track => track.albumId === viewState.selectedAlbum?.id);

  // Now Playing View
  if (viewState.view === 'nowplaying' && player.currentTrack) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-4 md:p-8" data-testid="now-playing-view">
        <button 
          onClick={goBack}
          className="absolute top-4 left-4 md:top-6 md:left-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Waveform Visualization */}
        <div className="w-full max-w-sm md:w-80 aspect-square bg-gradient-to-br from-green-900 to-black rounded-lg mb-6 md:mb-8 flex items-center justify-center">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-white rounded-full",
                  player.isPlaying ? "animate-pulse" : ""
                )}
                style={{
                  width: '3px',
                  height: `${Math.random() * 80 + 20}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Track Info */}
        <h1 className="text-2xl md:text-4xl font-bold mb-2 text-center px-4">{player.currentTrack.title}</h1>
        <p className="text-lg md:text-xl text-gray-400 mb-6 md:mb-8 text-center px-4">{player.currentTrack.artist}</p>

        {/* Progress Bar */}
        <div className="w-full max-w-sm md:w-80 mb-6 md:mb-8 px-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{formatDuration(player.currentTime)}</span>
            <span>{formatDuration(player.duration)}</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full" 
              style={{ width: `${(player.currentTime / player.duration) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4 md:space-x-8">
          <Heart className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
          <SkipBack className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {player.isPlaying ? (
              <Pause className="w-6 h-6 md:w-8 md:h-8 text-black" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 md:w-8 md:h-8 text-black ml-1" fill="currentColor" />
            )}
          </button>
          <SkipForward className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
          <MoreHorizontal className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
        </div>
      </div>
    );
  }

  // Album Detail View
  if (viewState.view === 'album' && viewState.selectedAlbum) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black text-white" data-testid="album-detail-view">
        <div className="p-4 md:p-6">
          <button 
            onClick={goBack}
            className="mb-4 md:mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Album Header */}
          <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6 mb-6 md:mb-8">
            <img
              src={viewState.selectedAlbum.coverUrl}
              alt={viewState.selectedAlbum.title}
              className="w-48 h-48 md:w-64 md:h-64 rounded-lg object-cover mx-auto md:mx-0"
            />
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">{viewState.selectedAlbum.title}</h1>
              <p className="text-lg md:text-xl text-gray-300 mb-1 md:mb-2">{viewState.selectedAlbum.artist}</p>
              <p className="text-gray-400 mb-4 md:mb-6">
                {viewState.selectedAlbum.releaseYear} • {viewState.selectedAlbum.trackCount} tracks
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4">
                <button 
                  onClick={() => albumTracks.length > 0 && playTrack(albumTracks[0])}
                  className="bg-green-500 text-black px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold hover:bg-green-400 flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                  <span>Play</span>
                </button>
                <button className="border border-gray-600 px-4 md:px-6 py-2 md:py-3 rounded-full hover:bg-gray-800 flex items-center space-x-2">
                  <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Shuffle</span>
                </button>
                <Heart className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
                <Share className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
                <MoreHorizontal className="w-6 h-6 md:w-8 md:h-8 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Track List */}
          <div className="mb-8">
            {/* Desktop Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 text-gray-400 text-sm mb-4 px-4">
              <div className="col-span-1">#</div>
              <div className="col-span-5">TITLE</div>
              <div className="col-span-3">ARTIST</div>
              <div className="col-span-2">DATE ADDED</div>
              <div className="col-span-1">TIME</div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    {/* Mobile skeleton */}
                    <div className="md:hidden flex items-center space-x-4 p-4">
                      <div className="w-12 h-12 bg-gray-700 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                      </div>
                      <div className="h-4 bg-gray-700 rounded w-12"></div>
                    </div>
                    {/* Desktop skeleton */}
                    <div className="hidden md:grid grid-cols-12 gap-4 p-4">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="col-span-5 h-4 bg-gray-700 rounded"></div>
                      <div className="col-span-3 h-4 bg-gray-700 rounded"></div>
                      <div className="col-span-2 h-4 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {albumTracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="p-4 rounded-lg hover:bg-white/10 group cursor-pointer"
                    onClick={() => playTrack(track)}
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden flex items-center space-x-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-8">
                        <span className="group-hover:hidden text-gray-400 text-sm">{index + 1}</span>
                        <Play className="w-4 h-4 hidden group-hover:block text-white" fill="currentColor" />
                      </div>
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{track.artist}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
                        <Heart className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-12 gap-4">
                      <div className="col-span-1 text-gray-400 flex items-center">
                        <span className="group-hover:hidden">{index + 1}</span>
                        <Play className="w-4 h-4 hidden group-hover:block" fill="currentColor" />
                      </div>
                      <div className="col-span-5 flex items-center space-x-3">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div>
                          <h3 className="font-medium">{track.title}</h3>
                          <p className="text-sm text-gray-400">{track.artist}</p>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center text-gray-400">
                        {track.artist}
                      </div>
                      <div className="col-span-2 flex items-center text-gray-400 text-sm">
                        Last month
                      </div>
                      <div className="col-span-1 flex items-center justify-between">
                        <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
                        <Heart className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900/20 to-black text-white" data-testid="page-music">
      {/* Hidden Audio Element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Header */}
      <div className="p-4 md:p-6">
        <div className="flex items-center space-x-2 md:space-x-4 mb-6 md:mb-8 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 md:px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                selectedCategory === category
                  ? "bg-green-500 text-black"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              )}
              data-testid={`music-category-${category.toLowerCase()}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Jump back in section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Jump back in</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-700 rounded-lg aspect-square mb-2 md:mb-3"></div>
                  <div className="h-3 md:h-4 bg-gray-700 rounded mb-1 md:mb-2"></div>
                  <div className="h-2 md:h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {albums.slice(0, 6).map((album) => (
                <div
                  key={album.id}
                  className="group cursor-pointer"
                  onClick={() => openAlbum(album)}
                  data-testid={`jump-back-album-${album.id}`}
                >
                  <div className="relative mb-2 md:mb-3">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Play className="w-8 h-8 md:w-12 md:h-12 text-green-500" fill="currentColor" />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm md:text-base mb-1 truncate">{album.title}</h3>
                  <p className="text-xs md:text-sm text-gray-400 truncate">{album.artist}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* More of what you like */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">More of what you like</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-700 rounded-lg aspect-square mb-2 md:mb-3"></div>
                  <div className="h-3 md:h-4 bg-gray-700 rounded mb-1 md:mb-2"></div>
                  <div className="h-2 md:h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {albums.slice(2, 8).map((album) => (
                <div
                  key={album.id}
                  className="group cursor-pointer"
                  onClick={() => openAlbum(album)}
                  data-testid={`more-like-album-${album.id}`}
                >
                  <div className="relative mb-2 md:mb-3">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full aspect-square object-cover rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Play className="w-8 h-8 md:w-12 md:h-12 text-green-500" fill="currentColor" />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm md:text-base mb-1 truncate">{album.title}</h3>
                  <p className="text-xs md:text-sm text-gray-400 truncate">{album.artist}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mini Music Player */}
      {player.currentTrack && viewState.view !== 'nowplaying' && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 cursor-pointer" 
          data-testid="mini-music-player"
          onClick={() => setViewState({ view: 'nowplaying' })}
        >
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <img
                src={player.currentTrack.coverUrl}
                alt={player.currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-medium truncate">{player.currentTrack.title}</h4>
                <p className="text-xs text-gray-400 truncate">{player.currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <SkipBack className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {player.isPlaying ? (
                  <Pause className="w-4 h-4 text-black" fill="currentColor" />
                ) : (
                  <Play className="w-4 h-4 text-black ml-0.5" fill="currentColor" />
                )}
              </button>
              <SkipForward className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>

            <div className="flex items-center space-x-3 flex-1 justify-end">
              <Volume2 className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}