import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface FloatingHeart {
  id: number;
  amount: number;
  x: number;
  y: number;
  timestamp: number;
}

interface FloatingHeartsProps {
  triggers: Array<{ amount: number; x: number; y: number }>;
}

export default function FloatingHearts({ triggers }: FloatingHeartsProps) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    if (triggers.length > 0) {
      const newHearts = triggers.map((trigger, index) => ({
        id: Date.now() + index,
        amount: trigger.amount,
        x: trigger.x,
        y: trigger.y,
        timestamp: Date.now(),
      }));
      
      setHearts(prev => [...prev, ...newHearts]);

      // Remove hearts after animation completes
      const timer = setTimeout(() => {
        setHearts(prev => prev.filter(heart => 
          !newHearts.some(newHeart => newHeart.id === heart.id)
        ));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [triggers]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute animate-float-up"
          style={{
            left: heart.x - 50,
            top: heart.y - 20,
            animation: "float-up 2s ease-out forwards",
          }}
        >
          <div className="flex items-center gap-1 text-pink-400 font-bold text-lg drop-shadow-lg">
            <Heart className="w-5 h-5 fill-current animate-pulse" />
            <span className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
              +{heart.amount}
            </span>
          </div>
        </div>
      ))}
      
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-30px) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.8);
          }
        }
        
        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}}></style>
    </div>
  );
}