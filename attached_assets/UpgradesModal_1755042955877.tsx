import { X, ArrowUp, Zap, Star, Coins, Gift, Headphones, Heart, ChefHat, Dumbbell, Palette, Home } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import type { UpgradeWithLevel } from "@/types/game";

// Placeholder functions - these would need actual implementation based on game logic
const getIcon = (id: string) => {
  switch (id) {
    case 'special-talent': return Star;
    case 'gift-selection': return Gift;
    case 'active-listening': return Headphones;
    case 'date-experience': return Heart;
    case 'cooking-mastery': return ChefHat;
    case 'athleticism': return Dumbbell;
    case 'artistic-talent': return Palette;
    case 'home-care': return Home;
    default: return Zap; // Default icon
  }
};

const getRequirement = (id: string, upgrades: UpgradeWithLevel[]) => {
  if (id === 'cooking-mastery') {
    const specialTalent = upgrades.find(u => u.id === 'special-talent');
    return specialTalent && specialTalent.level < 13 ? `Special Talent Lv.13` : null;
  }
  if (id === 'athleticism') {
    // Assuming 'Creativity' is another upgrade ID, replace if different
    const creativityUpgrade = upgrades.find(u => u.id === 'creativity');
    return creativityUpgrade && creativityUpgrade.level < 15 ? `Creativity Lv.15` : null;
  }
  // Add other requirements here
  return null;
};

const calculateCost = (baseCost: number, level: number): number => {
  // Example cost calculation: exponential increase
  return Math.floor(baseCost * Math.pow(1.15, level));
};

const calculateHourlyBonus = (baseBonus: number, level: number): number => {
  // Example bonus calculation: linear increase
  return Math.floor(baseBonus + (baseBonus * 0.1 * level));
};

interface UpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: UpgradeWithLevel[];
  userPoints: number;
}

export function UpgradesModal({ isOpen, onClose, upgrades, userPoints }: UpgradesModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gameState } = useQuery({
    queryKey: ['/api/game/state'],
    // This query fetches game state, which might include user points and current upgrade levels
    // For this component to work correctly, the `upgrades` prop should be derived from this state or similar source.
    // The initialUpgrades in the original code seems to be a static representation.
    // Assuming `upgrades` prop passed to this component is the dynamic, fetched data.
  });

  const upgradeMutation = useMutation({
    mutationFn: (upgradeId: string) =>
      apiRequest('POST', '/api/game/upgrade', { upgradeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game/state'] });
      toast({
        title: "Upgrade Successful!",
        description: "Your upgrade has been applied.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Not enough points or upgrade limit reached.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (upgradeId: string) => {
    upgradeMutation.mutate(upgradeId);
  };

  const canAfford = (upgrade: any) => gameState?.user?.points >= upgrade.cost;
  const meetsRequirements = (upgrade: any) => {
    if (!gameState?.user) return false;

    // Check level requirement
    if (upgrade.requiredLevel && gameState.user.level < upgrade.requiredLevel) {
      return false;
    }

    // Check upgrade requirements - all other upgrades must be at least level 4
    if (upgrade.requiredUpgrades) {
      for (const [upgradeId, requiredLevel] of Object.entries(upgrade.requiredUpgrades)) {
        const userUpgrade = gameState.upgrades?.find(u => u.id === upgradeId);
        if (!userUpgrade || userUpgrade.level < (requiredLevel as number)) {
          return false;
        }
      }
    }

    // For level upgrades, check if all upgrades are at required level
    if (upgrade.name === "Level Upgrade") {
      const allUpgrades = gameState.upgrades || [];
      const regularUpgrades = allUpgrades.filter(u => u.name !== "Level Upgrade");
      return regularUpgrades.every(u => u.level >= 4);
    }

    return true;
  };

  const getRequirementText = (upgrade: any) => {
    if (!gameState?.user) return "";

    const requirements = [];

    if (upgrade.requiredLevel && gameState.user.level < upgrade.requiredLevel) {
      requirements.push(`Level ${upgrade.requiredLevel}`);
    }

    if (upgrade.name === "Level Upgrade") {
      const allUpgrades = gameState.upgrades || [];
      const regularUpgrades = allUpgrades.filter(u => u.name !== "Level Upgrade");
      const unmetUpgrades = regularUpgrades.filter(u => u.level < 4);
      if (unmetUpgrades.length > 0) {
        requirements.push(`All upgrades to level 4`);
      }
    }

    if (upgrade.requiredUpgrades) {
      for (const [upgradeId, requiredLevel] of Object.entries(upgrade.requiredUpgrades)) {
        const userUpgrade = gameState.upgrades?.find(u => u.id === upgradeId);
        if (!userUpgrade || userUpgrade.level < (requiredLevel as number)) {
          const upgradeName = userUpgrade?.name || "Unknown Upgrade";
          requirements.push(`${upgradeName} level ${requiredLevel}`);
        }
      }
    }

    return requirements.length > 0 ? `Requires: ${requirements.join(", ")}` : "";
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-purple-900 via-pink-900 to-purple-800 border-pink-500/30">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            💝 UPGRADE
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 p-4">
          {upgrades.map((upgrade) => {
            const Icon = getIcon(upgrade.id);
            const requirement = getRequirement(upgrade.id, upgrades);
            const isLocked = requirement !== null;
            // Assuming upgrade object has maxLevel property, and cost is baseCost
            const nextCost = upgrade.level >= upgrade.maxLevel ? 0 : calculateCost(upgrade.cost, upgrade.level);
            const canAffordUpgrade = userPoints >= nextCost && !isLocked;
            const hourlyBonus = calculateHourlyBonus(upgrade.hourlyBonus, upgrade.level);
            const isMaxLevel = upgrade.level >= upgrade.maxLevel;

            return (
              <Card
                key={upgrade.id}
                className={`bg-gradient-to-br ${isLocked ? 'from-gray-400 to-gray-600' : 'from-pink-400 to-pink-600'} p-1 transition-all hover:scale-105 ${
                  isLocked ? 'opacity-60' : ''
                }`}
              >
                <div className="bg-black/40 rounded-lg p-3 h-full relative">
                  {/* Level Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-xs bg-dark-800/80 text-white px-2 py-1 rounded">
                      Lv.{upgrade.level}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mt-6 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Title and Description */}
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-white text-sm mb-1">{upgrade.name}</h3>
                    <p className="text-green-400 text-xs">{upgrade.description}</p>
                    <p className="text-yellow-400 text-xs font-bold">
                      💰 +{hourlyBonus}/hr
                    </p>
                  </div>

                  {/* Requirement or Price */}
                  {isLocked ? (
                    <div className="bg-blue-600 text-white text-xs py-1 px-2 rounded text-center">
                      {requirement}
                    </div>
                  ) : isMaxLevel ? (
                    <div className="bg-yellow-600 text-white text-xs py-1 px-2 rounded text-center">
                      MAX LEVEL
                    </div>
                  ) : (
                    <>
                      {!meetsRequirements(upgrade) && (
                        <p className="text-xs text-red-400 mb-2">
                          {getRequirementText(upgrade)}
                        </p>
                      )}

                      <Button
                        onClick={() => handleUpgrade(upgrade.id)}
                        disabled={!canAffordUpgrade || !meetsRequirements(upgrade) || upgrade.level >= upgrade.maxLevel}
                        className={`w-full ${
                          canAffordUpgrade && meetsRequirements(upgrade) && upgrade.level < upgrade.maxLevel
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {upgrade.level >= upgrade.maxLevel ? "MAX LEVEL" :
                         !meetsRequirements(upgrade) ? "LOCKED" :
                         !canAffordUpgrade ? "INSUFFICIENT FUNDS" :
                         `Upgrade - ${nextCost.toLocaleString()} coins`}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center p-4">
          <Button
            onClick={onClose}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-8 py-2 rounded-lg font-bold"
          >
            🔙 BACK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}