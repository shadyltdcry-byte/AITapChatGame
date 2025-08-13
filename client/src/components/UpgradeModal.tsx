
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { toast } from "react-hot-toast";
import { Heart, Star, Gift, Zap, Plus, Trash2, ArrowUp, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User, Upgrade } from "@shared/schema";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: Upgrade[];
  user: User;
}

const getUpgradeIcon = (id: string) => {
  switch (id) {
    case 'love-making': return Heart;
    case 'seduction': return Star;
    case 'romance': return Gift;
    case 'charm': return Crown;
    case 'passion': return Zap;
    default: return ArrowUp;
  }
};

const calculateCost = (baseCost: number, level: number): number => {
  return Math.floor(baseCost * Math.pow(1.5, level));
};

const calculateHourlyBonus = (baseBonus: number, level: number): number => {
  return Math.floor(baseBonus + (baseBonus * 0.15 * level));
};

export default function UpgradeModal({ isOpen, onClose, upgrades, user }: UpgradeModalProps) {
  const [activeTab, setActiveTab] = useState("upgrades");
  const [newUpgrade, setNewUpgrade] = useState({
    name: "",
    description: "",
    cost: 1500,
    hourlyBonus: 155,
    tapBonus: 0,
    maxLevel: 25,
    requiredLevel: 1,
    requiredUpgrades: {}
  });

  const queryClient = useQueryClient();

  // Purchase upgrade mutation
  const purchaseUpgradeMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const response = await apiRequest("POST", "/api/upgrade/purchase", {
        userId: user.id,
        upgradeId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", user.id] });
      toast.success("Upgrade purchased successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Not enough Lust Points!");
    },
  });

  // Create upgrade mutation (admin only)
  const createUpgradeMutation = useMutation({
    mutationFn: async (upgradeData: any) => {
      const response = await apiRequest("POST", "/api/admin/upgrades", upgradeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades", user.id] });
      toast.success("Upgrade created successfully!");
      setNewUpgrade({
        name: "",
        description: "",
        cost: 1500,
        hourlyBonus: 155,
        tapBonus: 0,
        maxLevel: 25,
        requiredLevel: 1,
        requiredUpgrades: {}
      });
    },
    onError: (error: any) => {
      toast.error("Failed to create upgrade: " + error.message);
    },
  });

  // Delete upgrade mutation (admin only)
  const deleteUpgradeMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/upgrades/${upgradeId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades", user.id] });
      toast.success("Upgrade deleted successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to delete upgrade: " + error.message);
    },
  });

  const canAfford = (upgrade: any) => {
    const cost = calculateCost(upgrade.cost, upgrade.level || 0);
    return user.points >= cost;
  };

  const meetsRequirements = (upgrade: any) => {
    // Check level requirement
    if (upgrade.requiredLevel && user.level < upgrade.requiredLevel) {
      return false;
    }

    // Check upgrade requirements
    if (upgrade.requiredUpgrades && typeof upgrade.requiredUpgrades === 'object') {
      for (const [requiredUpgradeId, requiredLevel] of Object.entries(upgrade.requiredUpgrades)) {
        const requiredUpgrade = upgrades.find(u => u.id === requiredUpgradeId);
        if (!requiredUpgrade || requiredUpgrade.level < (requiredLevel as number)) {
          return false;
        }
      }
    }

    return true;
  };

  const getRequirementText = (upgrade: any) => {
    const requirements = [];

    if (upgrade.requiredLevel && user.level < upgrade.requiredLevel) {
      requirements.push(`Level ${upgrade.requiredLevel}`);
    }

    if (upgrade.requiredUpgrades && typeof upgrade.requiredUpgrades === 'object') {
      for (const [requiredUpgradeId, requiredLevel] of Object.entries(upgrade.requiredUpgrades)) {
        const requiredUpgrade = upgrades.find(u => u.id === requiredUpgradeId);
        if (!requiredUpgrade || requiredUpgrade.level < (requiredLevel as number)) {
          requirements.push(`${requiredUpgrade?.name || requiredUpgradeId} Lv.${requiredLevel}`);
        }
      }
    }

    return requirements.join(", ");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handlePurchase = (upgradeId: string) => {
    purchaseUpgradeMutation.mutate(upgradeId);
  };

  const handleCreateUpgrade = () => {
    createUpgradeMutation.mutate({
      ...newUpgrade,
      userId: user.id
    });
  };

  const handleDeleteUpgrade = (upgradeId: string) => {
    if (confirm("Are you sure you want to delete this upgrade?")) {
      deleteUpgradeMutation.mutate(upgradeId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5" />
            LP Per Hour Upgrades
          </DialogTitle>
          <DialogDescription>
            Purchase upgrades to increase your Lust Points per hour! Upgrade all to unlock higher levels.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="upgrades">LP/Hour Upgrades</TabsTrigger>
              <TabsTrigger value="create">Create New Upgrade</TabsTrigger>
              <TabsTrigger value="manage">Admin Management</TabsTrigger>
            </TabsList>

            <TabsContent value="upgrades" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="grid gap-4 md:grid-cols-2 pb-4">
                  {upgrades.map((upgrade: any) => {
                    const Icon = getUpgradeIcon(upgrade.id);
                    const cost = calculateCost(upgrade.cost, upgrade.level || 0);
                    const hourlyBonus = calculateHourlyBonus(upgrade.hourlyBonus || 155, upgrade.level || 0);
                    const isMaxLevel = (upgrade.level || 0) >= (upgrade.maxLevel || 25);
                    const affordable = canAfford(upgrade);
                    const meetsReqs = meetsRequirements(upgrade);
                    const requirementText = getRequirementText(upgrade);

                    return (
                      <Card
                        key={upgrade.id}
                        className={`bg-gradient-to-br ${
                          affordable && meetsReqs && !isMaxLevel
                            ? 'from-pink-500/20 to-purple-500/20 border-pink-400/50'
                            : 'from-gray-400/20 to-gray-600/20 border-gray-500/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-white">{upgrade.name}</h3>
                                <p className="text-sm text-gray-300">{upgrade.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded">
                                Lv.{upgrade.level || 0}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 text-sm mb-3">
                            <div className="flex justify-between">
                              <span className="text-gray-300">LP per Hour:</span>
                              <span className="text-pink-400 font-bold">+{formatNumber(hourlyBonus)} LP/h</span>
                            </div>
                            {upgrade.tapBonus > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-300">Tap Bonus:</span>
                                <span className="text-blue-400 font-bold">+{formatNumber(upgrade.tapBonus)}</span>
                              </div>
                            )}
                          </div>

                          {isMaxLevel ? (
                            <div className="bg-yellow-600 text-white text-center py-2 rounded font-bold">
                              MAX LEVEL
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-yellow-400 font-bold">💰 {formatNumber(cost)} LP</span>
                                <Button
                                  onClick={() => handlePurchase(upgrade.id)}
                                  disabled={!affordable || !meetsReqs || purchaseUpgradeMutation.isPending}
                                  className={`${
                                    affordable && meetsReqs
                                      ? 'bg-pink-500 hover:bg-pink-600'
                                      : 'bg-gray-600 cursor-not-allowed'
                                  }`}
                                >
                                  {!meetsReqs ? 'LOCKED' : !affordable ? 'INSUFFICIENT LP' : 'UPGRADE'}
                                </Button>
                              </div>
                              {!meetsReqs && requirementText && (
                                <p className="text-xs text-red-400">
                                  Requires: {requirementText}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{upgrade.level || 0}/{upgrade.maxLevel || 25}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-pink-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((upgrade.level || 0) / (upgrade.maxLevel || 25)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {upgrades.length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <ArrowUp className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <div className="text-gray-400">No upgrades available</div>
                      <div className="text-sm text-gray-500 mt-2">Check back later!</div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Upgrade</CardTitle>
                    <CardDescription>Design a new upgrade for LP per hour generation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="upgrade-name">Name</Label>
                        <Input
                          id="upgrade-name"
                          value={newUpgrade.name}
                          onChange={(e) => setNewUpgrade({ ...newUpgrade, name: e.target.value })}
                          placeholder="e.g., Love Making"
                        />
                      </div>
                      <div>
                        <Label htmlFor="base-cost">Base Cost (LP)</Label>
                        <Input
                          id="base-cost"
                          type="number"
                          value={newUpgrade.cost}
                          onChange={(e) => setNewUpgrade({ ...newUpgrade, cost: parseInt(e.target.value) || 1500 })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="upgrade-description">Description</Label>
                      <Textarea
                        id="upgrade-description"
                        value={newUpgrade.description}
                        onChange={(e) => setNewUpgrade({ ...newUpgrade, description: e.target.value })}
                        placeholder="Upgrade description"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="hourly-bonus">LP per Hour Bonus</Label>
                        <Input
                          id="hourly-bonus"
                          type="number"
                          value={newUpgrade.hourlyBonus}
                          onChange={(e) => setNewUpgrade({ ...newUpgrade, hourlyBonus: parseInt(e.target.value) || 155 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-level">Max Level</Label>
                        <Input
                          id="max-level"
                          type="number"
                          value={newUpgrade.maxLevel}
                          onChange={(e) => setNewUpgrade({ ...newUpgrade, maxLevel: parseInt(e.target.value) || 25 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="required-level">Required Player Level</Label>
                        <Input
                          id="required-level"
                          type="number"
                          value={newUpgrade.requiredLevel}
                          onChange={(e) => setNewUpgrade({ ...newUpgrade, requiredLevel: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateUpgrade}
                      disabled={!newUpgrade.name || !newUpgrade.description || createUpgradeMutation.isPending}
                      className="w-full"
                    >
                      {createUpgradeMutation.isPending ? "Creating..." : "Create Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="manage" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Manage Existing Upgrades</h3>
                  </div>

                  <div className="grid gap-4">
                    {upgrades.map((upgrade: any) => (
                      <Card key={upgrade.id} className="bg-gray-800/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{upgrade.name}</h4>
                              <p className="text-sm text-gray-400">{upgrade.description}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                Cost: {upgrade.cost} LP | Hourly: +{upgrade.hourlyBonus} LP/h | Max Lv: {upgrade.maxLevel}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteUpgrade(upgrade.id)}
                              variant="destructive"
                              size="sm"
                              disabled={deleteUpgradeMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
