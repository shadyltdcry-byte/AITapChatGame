import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const { toast } = useToast();

  // Fetch user data to get current NSFW setting
  const { data: user } = useQuery({
    queryKey: ["/api/user", userId],
    enabled: isOpen,
  });

  // Fetch game settings
  const { data: gameSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: isOpen,
  });

  const toggleNsfwMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/settings/toggle-nsfw/${userId}`, {});
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
      toast({
        title: "Settings Updated",
        description: `NSFW content ${data.nsfwEnabled ? 'enabled' : 'disabled'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleNsfwToggle = () => {
    toggleNsfwMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white border-none max-w-md p-0 rounded-3xl overflow-hidden">
        <DialogTitle className="sr-only">Game Settings</DialogTitle>
        
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚙️</span>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/20 p-1 h-8 w-8 rounded-full"
              data-testid="button-close-settings"
            >
              ✕
            </Button>
          </div>
          <p className="text-white/80 text-sm">Configure your game preferences</p>
        </div>

        {/* Settings Content */}
        <div className="px-6 pb-6 space-y-6">
          
          {/* Content Settings */}
          <div className="bg-black/20 rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <span>🔞</span>
              <span>Content Settings</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">NSFW Content</h4>
                  <p className="text-sm text-white/70">Enable mature content and characters</p>
                </div>
                <Switch
                  checked={(user as any)?.nsfwEnabled || false}
                  onCheckedChange={handleNsfwToggle}
                  disabled={toggleNsfwMutation.isPending}
                  data-testid="switch-nsfw"
                />
              </div>
            </div>
          </div>

          {/* Chat Settings */}
          <div className="bg-black/20 rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <span>💬</span>
              <span>Chat Settings</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Random Chat Percentage</h4>
                  <p className="text-sm text-white/70">
                    {(gameSettings as any)?.chatRandomPercentage || 15}% chance for random messages
                  </p>
                </div>
                <div className="bg-purple-500/20 px-3 py-1 rounded-full text-sm">
                  {(gameSettings as any)?.chatRandomPercentage || 15}%
                </div>
              </div>
            </div>
          </div>

          {/* Level Requirements */}
          <div className="bg-black/20 rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <span>📈</span>
              <span>Level Requirements</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(gameSettings as any)?.levelRequirements?.slice(0, 6).map((level: any, index: number) => (
                <div key={index} className="flex justify-between bg-black/30 rounded-lg p-2">
                  <span>Level {level.level}</span>
                  <span>{level.pointsRequired.toLocaleString()} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* VIP Benefits */}
          <div className="bg-black/20 rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <span>👑</span>
              <span>VIP Benefits</span>
            </h3>
            
            <div className="space-y-2">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Daily VIP:</span>
                  <span className="text-blue-400">2x Points, +50% Energy</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly VIP:</span>
                  <span className="text-purple-400">3x Points, +100% Energy</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly VIP:</span>
                  <span className="text-yellow-400">5x Points, +200% Energy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-black/20 rounded-xl p-4">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <span>👤</span>
              <span>Account Info</span>
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Username:</span>
                <span className="font-medium">{(user as any)?.username}</span>
              </div>
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="font-medium">{(user as any)?.level}/10</span>
              </div>
              <div className="flex justify-between">
                <span>Points:</span>
                <span className="font-medium">{(user as any)?.points?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Energy:</span>
                <span className="font-medium">{(user as any)?.energy}/{(user as any)?.maxEnergy}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => {
                toast({
                  title: "Game Data",
                  description: "All progress is saved automatically!",
                });
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
              data-testid="button-save-game"
            >
              💾 Game Auto-Saved
            </Button>
            
            <Button
              onClick={() => {
                toast({
                  title: "Reset Confirmation",
                  description: "Contact support to reset your progress",
                  variant: "destructive",
                });
              }}
              variant="outline"
              className="w-full border-red-500 text-red-400 hover:bg-red-500/20 font-bold py-3"
              data-testid="button-reset-progress"
            >
              🔄 Reset Progress
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}