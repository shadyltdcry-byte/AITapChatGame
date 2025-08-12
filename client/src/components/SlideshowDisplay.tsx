import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw,
  Settings,
  ImageIcon
} from "lucide-react";

interface SlideshowDisplayProps {
  characterId?: string;
  className?: string;
  autoStart?: boolean;
}

export default function SlideshowDisplay({ characterId, className = "", autoStart = false }: SlideshowDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(5000); // 5 seconds default
  const [showControls, setShowControls] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch character images
  const { data: images = [] } = useQuery({
    queryKey: ['/api/media', characterId],
    queryFn: () => {
      if (!characterId) return [];
      return fetch(`/api/media?characterId=${characterId}&category=character`).then(res => res.json());
    },
    enabled: !!characterId
  });

  // Slideshow logic
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, speed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, images.length, speed]);

  const nextImage = () => {
    if (images.length > 0) {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetSlideshow = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  if (images.length === 0) {
    return (
      <div className={`relative bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images available for slideshow</p>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div 
      className={`relative group bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Main Image Display */}
      <div className="aspect-video relative">
        <img
          src={currentImage?.url || currentImage?.path}
          alt={currentImage?.originalName || `Image ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/api/placeholder-image';
          }}
        />
        
        {/* Image Overlay Info */}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-black/70 text-white">
            {currentIndex + 1} / {images.length}
          </Badge>
        </div>

        {/* Controls Overlay */}
        <div className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center gap-2 bg-black/70 rounded-full px-4 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={prevImage}
              className="text-white hover:bg-white/20"
              disabled={images.length <= 1}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
              disabled={images.length <= 1}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={nextImage}
              className="text-white hover:bg-white/20"
              disabled={images.length <= 1}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={resetSlideshow}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Speed Control (Bottom Right) */}
      {showControls && images.length > 1 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1">
          <Settings className="w-3 h-3 text-white" />
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-transparent text-white text-xs border-none outline-none"
          >
            <option value={2000} className="text-black">2s</option>
            <option value={3000} className="text-black">3s</option>
            <option value={5000} className="text-black">5s</option>
            <option value={7000} className="text-black">7s</option>
            <option value={10000} className="text-black">10s</option>
          </select>
        </div>
      )}

      {/* Progress Bar */}
      {isPlaying && images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % speed) / speed) * 100}%`
            }}
          />
        </div>
      )}

      {/* Thumbnail Strip (Bottom) */}
      {showControls && images.length > 1 && (
        <div className="absolute -bottom-16 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {images.slice(0, 8).map((img: any, index: number) => (
              <button
                key={img.id || index}
                className={`flex-shrink-0 w-12 h-8 rounded border-2 transition-all ${
                  index === currentIndex 
                    ? 'border-purple-400 scale-110' 
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={img.url || img.path}
                  alt={`Thumb ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/placeholder-image';
                  }}
                />
              </button>
            ))}
            {images.length > 8 && (
              <div className="flex-shrink-0 w-12 h-8 rounded bg-black/50 flex items-center justify-center text-xs text-white">
                +{images.length - 8}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}