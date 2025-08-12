import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Edit3, 
  Trash2, 
  Plus, 
  Users, 
  Gamepad2, 
  Settings, 
  Database, 
  BarChart3,
  DollarSign,
  Zap,
  Gift,
  MessageCircle,
  Image,
  Layers,
  Monitor
} from "lucide-react";
import TriggerWordManager from "@/components/TriggerWordManager";
import type { User, Character, Upgrade, GameStats, MediaFile } from "@shared/schema";

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminDashboard({ isOpen, onClose }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingUpgrade, setEditingUpgrade] = useState<any>(null);
  const [editingCharacter, setEditingCharacter] = useState<any>(null);
  const [newTriggerWord, setNewTriggerWord] = useState("");
  const [triggerResponse, setTriggerResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin data
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isOpen,
  });

  const { data: characters = [] } = useQuery<Character[]>({
    queryKey: ["/api/admin/characters"],
    enabled: isOpen,
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: isOpen,
  });

  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
    enabled: isOpen,
  });

  const { data: wheelPrizes = [] } = useQuery({
    queryKey: ["/api/admin/wheel-prizes"],
    enabled: isOpen,
  });

  // Overview stats
  const stats = {
    totalUsers: users.length,
    totalCharacters: characters.length,
    totalUpgrades: upgrades.length,
    activeWheelPrizes: wheelPrizes.length
  };

  // Update upgrade mutation
  const updateUpgradeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/admin/upgrades/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      setEditingUpgrade(null);
      toast({ title: "Upgrade updated successfully" });
    },
  });

  // Delete upgrade mutation
  const deleteUpgradeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/upgrades/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      toast({ title: "Upgrade deleted successfully" });
    },
  });

  // Create wheel prize mutation
  const createWheelPrizeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/wheel-prizes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wheel-prizes"] });
      toast({ title: "Wheel prize created successfully" });
    },
  });

  // Save trigger word mutation
  const saveTriggerWordMutation = useMutation({
    mutationFn: async (data: { word: string; response: string; characterId?: string }) => {
      const response = await apiRequest("POST", "/api/admin/trigger-words", data);
      return response.json();
    },
    onSuccess: () => {
      setNewTriggerWord("");
      setTriggerResponse("");
      toast({ title: "Trigger word saved successfully" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ClassikLust Admin Dashboard
          </DialogTitle>
          <DialogDescription className="text-center text-slate-300">
            Comprehensive management system for users, characters, economy, and game settings
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-blue-600">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-green-600">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center gap-2 data-[state=active]:bg-purple-600">
              <Gamepad2 className="w-4 h-4" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="economy" className="flex items-center gap-2 data-[state=active]:bg-yellow-600">
              <DollarSign className="w-4 h-4" />
              Economy
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-pink-600">
              <MessageCircle className="w-4 h-4" />
              Chat & AI
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-red-600">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-sm font-medium">Total Users</p>
                        <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 border-purple-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-200 text-sm font-medium">Characters</p>
                        <p className="text-3xl font-bold text-white">{stats.totalCharacters}</p>
                      </div>
                      <Gamepad2 className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border-yellow-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-200 text-sm font-medium">Upgrades</p>
                        <p className="text-3xl font-bold text-white">{stats.totalUpgrades}</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-600/20 to-green-700/20 border-green-500/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-200 text-sm font-medium">Wheel Prizes</p>
                        <p className="text-3xl font-bold text-white">{stats.activeWheelPrizes}</p>
                      </div>
                      <Gift className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-slate-300">Database</span>
                      <Badge className="bg-green-600 text-white">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-slate-300">Energy System</span>
                      <Badge className="bg-green-600 text-white">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <span className="text-slate-300">Wheel Game</span>
                      <Badge className="bg-green-600 text-white">Operational</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Monitor and manage user accounts, levels, and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.username}</p>
                            <p className="text-sm text-slate-300">
                              Level {user.level} • {user.points?.toLocaleString()} LP • {user.energy}/4500 Energy
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.isAdmin && <Badge className="bg-red-600">Admin</Badge>}
                          {user.isVip && <Badge className="bg-yellow-600">VIP</Badge>}
                          <Button size="sm" variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-600">
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Economy Tab */}
            <TabsContent value="economy" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upgrades Management */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Upgrade Management
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                          Configure upgrade costs, bonuses, and requirements
                        </CardDescription>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Upgrade
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {upgrades.map((upgrade) => (
                          <div key={upgrade.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-white">{upgrade.name}</h3>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setEditingUpgrade(upgrade)}
                                  className="border-slate-500 text-slate-300 hover:bg-slate-600"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteUpgradeMutation.mutate(upgrade.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                              <p>Cost: <span className="text-yellow-400">{upgrade.cost} LP</span></p>
                              <p>Level: <span className="text-blue-400">{upgrade.level}/{upgrade.maxLevel}</span></p>
                              <p>Tap Bonus: <span className="text-green-400">+{upgrade.tapBonus}</span></p>
                              <p>Hourly: <span className="text-purple-400">+{upgrade.hourlyBonus}</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Wheel Prizes */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Gift className="w-5 h-5" />
                          Wheel Prize Management
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                          Configure wheel spin rewards and probabilities
                        </CardDescription>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Prize
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {wheelPrizes.map((prize: any) => (
                          <div key={prize.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-white">{prize.label}</h3>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="border-slate-500 text-slate-300 hover:bg-slate-600">
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                              <p>Type: <span className="text-blue-400">{prize.type}</span></p>
                              <p>Range: <span className="text-yellow-400">{prize.min}-{prize.max}</span></p>
                              <p>Probability: <span className="text-green-400">{(prize.probability * 100).toFixed(1)}%</span></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Chat & AI Tab */}
            <TabsContent value="chat" className="space-y-6">
              <TriggerWordManager />
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Global Chat Settings
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Configure system-wide conversation settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">AI Behavior</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <Label htmlFor="auto-responses" className="text-slate-300">Enable Auto Responses</Label>
                          <Switch id="auto-responses" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <Label htmlFor="conversation-memory" className="text-slate-300">Save Conversation Snippets</Label>
                          <Switch id="conversation-memory" />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                          <Label htmlFor="mood-system" className="text-slate-300">Dynamic Mood System</Label>
                          <Switch id="mood-system" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Response Settings</h3>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-slate-300">Response Delay (ms)</Label>
                          <Input 
                            type="number" 
                            placeholder="1000" 
                            className="bg-slate-700 border-slate-600 text-white"
                            defaultValue={1000}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-slate-300">Max Response Length</Label>
                          <Input 
                            type="number" 
                            placeholder="200" 
                            className="bg-slate-700 border-slate-600 text-white"
                            defaultValue={200}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Game Economy Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-slate-300">Global Point Multiplier</Label>
                      <Input 
                        type="number" 
                        placeholder="1.0" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue={settings?.globalMultiplier || 1}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-300">Energy Regeneration Rate</Label>
                      <Input 
                        type="number" 
                        placeholder="3" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue={settings?.energyRegenRate || 3}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-300">Max Energy</Label>
                      <Input 
                        type="number" 
                        placeholder="4500" 
                        className="bg-slate-700 border-slate-600 text-white"
                        defaultValue={settings?.maxEnergy || 4500}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">UI & Display Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <Label className="text-slate-300">Dark Mode</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <Label className="text-slate-300">NSFW Content</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <Label className="text-slate-300">Floating Animations</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <Label className="text-slate-300">Sound Effects</Label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}