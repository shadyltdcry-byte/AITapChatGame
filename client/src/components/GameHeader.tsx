import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import CharacterGallery from "./CharacterGallery";
import type { User } from "@shared/schema";

interface GameHeaderProps {
  user: User;
}

export default function GameHeader({ user }: GameHeaderProps) {
  const [showGallery, setShowGallery] = useState(false);

  return (
    <>
      <header className="relative z-50 flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm border-b border-pink-500/30">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="p-2 hover:bg-purple-700/30 rounded-full transition-all hover:scale-105"
            onClick={() => setShowGallery(true)}
            title="Character Gallery">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              👤
            </div>
          </Button>
          
          {/* New Layout: Level on left, Lust Points in center box, LP per Hour on right */}
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-gray-300">LV.</span>
              <span className="ml-1 font-bold text-pink-400 text-lg">{user.level}</span>
            </div>
            
            {/* Lust Points in framed box */}
            <div className="bg-gradient-to-r from-purple-700/50 to-pink-700/50 border border-pink-500/30 rounded-lg px-4 py-2">
              <div className="text-sm text-center">
                <span className="text-gray-300">💰</span>
                <span className="ml-1 font-bold text-yellow-400">{user.points.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="text-sm">
              <span className="text-gray-300">LP/Hr</span>
              <span className="ml-1 font-bold text-green-400">{user.pointsPerSecond * 3600}</span>
            </div>
          </div>
        </div>
        
        {/* Energy moved to right side, under the top box */}
        <div className="flex flex-col items-end space-y-1">
          <div className="flex items-center space-x-3">
            {user.isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-red-400 hover:bg-red-900/50 hover:text-red-300 p-2 rounded-lg transition-colors"
                  title="Admin Panel"
                >
                  🛡️
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              className="text-white hover:bg-purple-700/50 p-2 rounded-lg transition-colors"
            >
              ⚙️
            </Button>
          </div>
          
          {/* Energy display moved here */}
          <div className="text-sm">
            <span className="text-gray-300">⚡</span>
            <span className="ml-1 font-bold text-blue-400">{user.energy}/{user.maxEnergy}</span>
          </div>
        </div>


    </header>

    <CharacterGallery 
      isOpen={showGallery}
      onClose={() => setShowGallery(false)}
      userId={user.id}
    />
  </>
  );
}
