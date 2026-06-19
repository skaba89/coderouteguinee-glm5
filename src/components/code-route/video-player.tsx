'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Video as VideoIcon } from 'lucide-react';

// ─── Real HTML5 Video Player Component ─────────────────────────
// Used in:
//   - courses-page.tsx (video lessons)
//   - exam-taking.tsx (video questions)
//
// Features:
//   - Real <video> element with MP4 source
//   - Poster image (scenarioImage) shown before play
//   - Custom controls (play/pause, mute, fullscreen, restart)
//   - Guinea-branded UI (red/yellow/green accent)
//   - Responsive 16:9

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  compact?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  title = 'Vidéo — Code de la route',
  className = '',
  autoPlay = false,
  loop = false,
  compact = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // Hide controls timeout
  useEffect(() => {
    if (!isPlaying || !showControls) return;
    const t = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(t);
  }, [isPlaying, showControls, progress]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
      setHasStarted(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const restart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play();
    setIsPlaying(true);
    setHasStarted(true);
  };

  const goFullscreen = () => {
    const c = containerRef.current;
    if (!c) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      c.requestFullscreen();
    }
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const onLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    v.currentTime = x * v.duration;
    setProgress(x * 100);
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden border-2 border-white/10 shadow-lg bg-gray-900 group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video object-cover bg-black"
        onClick={togglePlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay={autoPlay}
        loop={loop}
        preload="metadata"
        playsInline
      />

      {/* Video badge */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <Badge className="text-[10px] px-2 py-0.5 bg-red-600 text-white border-0 shadow-md">
          <VideoIcon className="w-3 h-3 mr-1" />
          {compact ? 'VIDÉO' : 'SCÉNARIO VIDÉO'}
        </Badge>
      </div>

      {/* Title overlay (top right) */}
      {!compact && title && (
        <div
          className={`absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-md px-2.5 py-1 text-white text-xs font-medium transition-opacity ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {title}
        </div>
      )}

      {/* Big play button overlay (when paused, before first play) */}
      {!isPlaying && (
        <button
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
          onClick={togglePlay}
          aria-label="Lire la vidéo"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm border-2 border-white/40 hover:bg-white/30 hover:scale-110 transition-all shadow-xl">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-white/20 cursor-pointer hover:h-1.5 transition-all"
          onClick={seek}
        >
          <div
            className="h-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: progress >= 100 ? '#009460' : '#CE1126',
            }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-3 py-2">
          <button
            className="text-white hover:text-green-400 transition-colors"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            className="text-white hover:text-green-400 transition-colors"
            onClick={restart}
            aria-label="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="text-white hover:text-green-400 transition-colors"
            onClick={toggleMute}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-xs text-gray-300 font-mono ml-1">
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </span>
          <div className="flex-1" />
          <button
            className="text-white hover:text-green-400 transition-colors"
            onClick={goFullscreen}
            aria-label="Plein écran"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* "Click to play" hint when first loaded */}
      {!hasStarted && !isPlaying && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Cliquez sur la vidéo pour la lire
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;
