import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, RefreshCw } from "lucide-react";
import type { Upgrade, User } from "@shared/schema";


interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgrades: Upgrade[];
  user: User;
}

export default function UpgradeModal({ isOpen, onClose, upgrades, user }: UpgradeModalProps) {
  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const response = await apiRequest("POST", "/api/upgrade/purchase", {
        userId: user.id,
        upgradeId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades", user.id] });
      toast({
        title: "Upgrade Successful!",
        description: "Your upgrade has been purchased!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Not enough points!",
        variant: "destructive",
      });
    },
  });

  const canAfford = (upgrade: Upgrade) => user.points >= upgrade.cost;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Upgrades & Shop
          </DialogTitle>
          <DialogDescription>
            Purchase upgrades to boost your clicking power and earn more LP per hour!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="upgrades" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
              <TabsTrigger value="create">Create Upgrade</TabsTrigger>
              <TabsTrigger value="manage">Manage</TabsTrigger>
            </TabsList>

            <TabsContent value="upgrades" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="grid gap-4 md:grid-cols-2 pb-4">
                {upgrades.map((upgrade) => (
                  <div
                    key={upgrade.id}
                    className={`bg-black/20 rounded-xl p-4 border-2 ${
                      canAfford(upgrade) ? 'border-green-400/50' : 'border-gray-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">⭐</span>
                          <h3 className="font-bold text-white">{upgrade.name}</h3>
                        </div>

                        <p className="text-sm text-white/80 mb-2">{upgrade.description}</p>

                        {/* Stats */}
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/70">Level:</span>
                            <span className="text-green-400 font-bold">Lv.{upgrade.level}</span>
                          </div>

                          {upgrade.hourlyBonus > 0 && (
                            <div className="flex justify-between">
                              <span className="text-white/70">Sugar per Hour:</span>
                              <span className="text-pink-400 font-bold">+{formatNumber(upgrade.hourlyBonus)}</span>
                            </div>
                          )}

                          {upgrade.tapBonus > 0 && (
                            <div className="flex justify-between">
                              <span className="text-white/70">Tap Bonus:</span>
                              <span className="text-blue-400 font-bold">+{formatNumber(upgrade.tapBonus)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost and Buy Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">💰</span>
                        <span className={`font-bold ${canAfford(upgrade) ? 'text-yellow-400' : 'text-red-400'}`}>
                          {formatNumber(upgrade.cost)}
                        </span>
                      </div>

                      <Button
                        onClick={() => upgradeMutation.mutate(upgrade.id)}
                        disabled={!canAfford(upgrade) || upgradeMutation.isPending}
                        className={`px-4 py-2 rounded-full font-bold text-sm ${
                          canAfford(upgrade)
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                        data-testid={`button-upgrade-${upgrade.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {upgrade.level >= upgrade.maxLevel ? 'MAX' : canAfford(upgrade) ? 'BUY' : 'LOCKED'}
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    {upgrade.maxLevel > 1 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-white/70 mb-1">
                          <span>Progress</span>
                          <span>{upgrade.level}/{upgrade.maxLevel}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {upgrades.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">⬆️</div>
                    <div className="text-white/70">No upgrades available</div>
                    <div className="text-sm text-white/50 mt-2">Check back later!</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Upgrade</CardTitle>
                    <CardDescription>Design a new upgrade for players to purchase</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Form fields for creating an upgrade will go here */}
                    <div className="text-white/50">Upgrade creation form coming soon!</div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

            <TabsContent value="manage" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4 pb-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Manage Existing Upgrades</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/upgrades'] })}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="grid gap-4">
                  {/* Existing upgrade management UI will go here */}
                  <div className="text-white/50">Upgrade management coming soon!</div>
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