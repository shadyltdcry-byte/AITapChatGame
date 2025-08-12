import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GameHeader } from "@/components/GameHeader";
import { CharacterDisplay } from "@/components/CharacterDisplay";
import { GameStats } from "@/components/GameStats";
import { UpgradeSection } from "@/components/UpgradeSection";
import { FloatingActionButtons } from "@/components/FloatingActionButtons";
import { GameModals } from "@/components/GameModals";
import { LevelUpNotification } from "@/components/LevelUpNotification";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GameState } from "@/types/game";
import {
  Settings,
  Heart,
  Gem,
  Zap,
  User,
  Target,
  Star,
  ArrowUp,
  Trophy,
  ShoppingBag,
  Users,
  MessageCircle,
  ListChecks,
  Shield // Import Shield icon
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming Button is imported from here

// Mock setLocation and User context for demonstration
// In a real app, these would be provided by a router and auth context.
const setLocation = (path: string) => {
  console.log(`Navigating to: ${path}`);
  // In a real app, this would navigate the user to the specified path.
};

const currentUser = {
  isAdmin: true, // Set to true to see the admin icon, false otherwise
};

export default function Game() {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch game state
  const { data: gameState, isLoading } = useQuery<GameState>({
    queryKey: ['/api/game/state'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Tap mutation
  const tapMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/game/tap'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
    },
  });

  // Upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: (upgradeId: string) =>
      apiRequest('POST', '/api/game/upgrade', { upgradeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
      toast({
        title: "Upgrade Complete!",
        description: "Your upgrade has been applied successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Not enough points for this upgrade.",
        variant: "destructive",
      });
    },
  });

  const handleTap = (x: number, y: number) => {
    tapMutation.mutate();
  };

  const handleUpgrade = (upgradeId: string) => {
    upgradeMutation.mutate(upgradeId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
          <p className="text-gray-300">Please create a character first.</p>
        </div>
      </div>
    );
  }

  // Mock GameHeader component for demonstration purposes
  const MockGameHeader = ({ user, character, onSettingsClick }: { user: any, character: any, onSettingsClick: () => void }) => (
    <header className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm border-b border-pink-500/30">
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <span className="text-gray-300">LV.</span>
          <span className="ml-1 font-bold text-pink-400 text-lg">{user.level}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-300">💰</span>
          <span className="ml-1 font-bold text-yellow-400">{user.points.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Admin Access - Only for you */}
        {currentUser.isAdmin && (
          <Button
            onClick={() => setLocation('/admin')}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
            title="Admin Panel"
          >
            <Shield className="w-5 h-5" />
          </Button>
        )}

        <Button
          onClick={onSettingsClick}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-purple-700/50"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ff69b4%27 fill-opacity=%270.05%27%3E%3Ccircle cx=%2730%27 cy=%2730%27 r=%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      <div className="relative">
        {/* Header */}
        <MockGameHeader
          user={gameState.user}
          character={gameState.character}
          onSettingsClick={() => setActiveModal('settings')}
        />

        <main className="pb-24">
          {/* Event Banner */}
          <div className="m-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-center">
            <h3 className="text-white font-bold text-lg">EVENT NEWS</h3>
          </div>

          <CharacterDisplay
            character={gameState.character}
            onTap={handleTap}
            energy={gameState.user.energy}
            maxEnergy={gameState.user.maxEnergy}
          />

          <GameStats stats={gameState.stats} />
        </main>

        <FloatingActionButtons
          onWheelClick={() => setActiveModal('wheel')}
          onPowerUpClick={() => setActiveModal('powerups')}
        />

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-sm border-t border-primary-700/30 z-40">
          <div className="grid grid-cols-5 gap-1 p-2">
            <button
              onClick={() => setActiveModal('upgrades')}
              className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-primary-700/50 transition-colors"
            >
              <ArrowUp className="w-5 h-5 mb-1" />
              <span className="text-xs">Upgrade</span>
            </button>
            <button
              onClick={() => setActiveModal('tasks')}
              className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-primary-700/50 transition-colors"
            >
              <ListChecks className="w-5 h-5 mb-1" />
              <span className="text-xs">Task</span>
            </button>
            <button className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-primary-700/50 transition-colors">
              <ShoppingBag className="w-5 h-5 mb-1" />
              <span className="text-xs">Shop</span>
            </button>
            <button className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-primary-700/50 transition-colors">
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">Friends</span>
            </button>
            <button
              onClick={() => setActiveModal('chat')}
              className="flex flex-col items-center py-2 px-1 rounded-lg hover:bg-primary-700/50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Chat</span>
            </button>
          </div>
        </nav>

        <GameModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          gameState={gameState}
        />

        {showLevelUp && (
          <LevelUpNotification
            level={gameState.user.level}
            onClose={() => setShowLevelUp(false)}
          />
        )}
      </div>
    </div>
  );
}