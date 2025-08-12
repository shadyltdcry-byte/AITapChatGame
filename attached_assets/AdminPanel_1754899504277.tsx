import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Download, Upload, BarChart3, Gamepad2, Palette, Layout, Users, Image, Settings, FileText, Bot, MessageCircle, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { GameSettings, UICustomization } from "@/types/game";

// Dummy data for character AI personalities - replace with actual data fetching
const characters = [
  { id: 1, name: "Yuki", personality: "Friendly Shrine Maiden", chatStyle: "Polite" },
  { id: 2, name: "Naomi", personality: "Passionate Fire Mage", chatStyle: "Energetic" },
  { id: 3, name: "Kaito", personality: "Stoic Swordsman", chatStyle: "Concise" },
];

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');

  // Fetch game settings
  const { data: gameSettings, isLoading: settingsLoading } = useQuery<GameSettings>({
    queryKey: ['/api/admin/settings'],
  });

  // Fetch UI customization settings
  const { data: uiSettings, isLoading: uiLoading } = useQuery<UICustomization>({
    queryKey: ['/api/admin/ui-settings'],
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (settings: Partial<GameSettings>) =>
      apiRequest('PUT', '/api/admin/settings', settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Settings Updated",
        description: "Game settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: () => apiRequest('GET', '/api/admin/export'),
    onSuccess: (data: any) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `classiklust-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Game data has been exported successfully.",
      });
    },
  });

  const handleGoBack = () => {
    setLocation('/');
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    updateSettingsMutation.mutate(newSettings);
  };

  if (settingsLoading || uiLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 text-white">
      <div className="container mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              onClick={handleGoBack}
              variant="ghost"
              className="mr-4 text-white hover:bg-purple-700/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-300">Manage your game content and settings</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => exportDataMutation.mutate()}
              disabled={exportDataMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Main Admin Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {/* Overview */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-none cursor-pointer hover:from-blue-500 hover:to-blue-600 transition-all"
                onClick={() => setActiveTab('overview')}>
            <CardContent className="p-6 text-center">
              <Layout className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">📊 Overview</h3>
            </CardContent>
          </Card>

          {/* Image Manager */}
          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-none cursor-pointer hover:from-green-500 hover:to-green-600 transition-all"
                onClick={() => setActiveTab('media')}>
            <CardContent className="p-6 text-center">
              <Image className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">📷 Image Manager</h3>
            </CardContent>
          </Card>

          {/* AI Management */}
          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-none cursor-pointer hover:from-purple-500 hover:to-purple-600 transition-all"
                onClick={() => setActiveTab('chat')}>
            <CardContent className="p-6 text-center">
              <Bot className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">🤖 AI Management</h3>
            </CardContent>
          </Card>

          {/* Character Manager */}
          <Card className="bg-gradient-to-br from-cyan-600 to-cyan-700 border-none cursor-pointer hover:from-cyan-500 hover:to-cyan-600 transition-all"
                onClick={() => setActiveTab('characters')}>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">👥 Character Manager</h3>
            </CardContent>
          </Card>

          {/* Rewards */}
          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-none cursor-pointer hover:from-orange-500 hover:to-orange-600 transition-all"
                onClick={() => setActiveTab('game-settings')}>
            <CardContent className="p-6 text-center">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">🎁 Rewards</h3>
            </CardContent>
          </Card>

          {/* Moderation */}
          <Card className="bg-gradient-to-br from-red-600 to-red-700 border-none cursor-pointer hover:from-red-500 hover:to-red-600 transition-all"
                onClick={() => setActiveTab('users')}>
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">🛡️ Moderation</h3>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="bg-gradient-to-br from-teal-600 to-teal-700 border-none cursor-pointer hover:from-teal-500 hover:to-teal-600 transition-all"
                onClick={() => setActiveTab('logs')}>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">📊 Analytics</h3>
            </CardContent>
          </Card>

          {/* Changelog */}
          <Card className="bg-gradient-to-br from-yellow-600 to-yellow-700 border-none cursor-pointer hover:from-yellow-500 hover:to-yellow-600 transition-all"
                onClick={() => setActiveTab('game-settings')}>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">📋 Changelog</h3>
            </CardContent>
          </Card>

          {/* GUI Editor */}
          <Card className="bg-gradient-to-br from-pink-600 to-pink-700 border-none cursor-pointer hover:from-pink-500 hover:to-pink-600 transition-all"
                onClick={() => setActiveTab('gui')}>
            <CardContent className="p-6 text-center">
              <Palette className="w-8 h-8 mx-auto mb-2 text-white" />
              <h3 className="text-white font-semibold">🎨 GUI Editor</h3>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-blue-400">
                    <Users className="w-5 h-5 mr-2" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-400">
                    {systemStats?.totalUsers || 0}
                  </div>
                  <p className="text-sm text-gray-400">Active players</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-green-400">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Daily Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400">
                    {systemStats?.dailyActiveUsers || 0}
                  </div>
                  <p className="text-sm text-gray-400">Last 24 hours</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-purple-400">
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Total Taps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-400">
                    {systemStats?.totalTaps ? (systemStats.totalTaps / 1000000).toFixed(1) + 'M' : '0'}
                  </div>
                  <p className="text-sm text-gray-400">All time</p>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center text-yellow-400">
                    <Image className="w-5 h-5 mr-2" />
                    Media Files
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-400">
                    {systemStats?.totalMediaFiles || 0}
                  </div>
                  <p className="text-sm text-gray-400">Images & videos</p>
                </CardContent>
              </Card>
            </div>

            {/* System Logs Card */}
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-400">
                  <FileText className="w-5 h-5 mr-2" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 rounded p-4 h-96 overflow-y-auto font-mono text-sm space-y-1">
                  <div className="text-green-400">[2024-01-10 15:30:25] INFO: Server started on port 5000</div>
                  <div className="text-blue-400">[2024-01-10 15:30:30] AUTH: User login successful - ShadyLTD</div>
                  <div className="text-green-400">[2024-01-10 15:31:00] GAME: Character selected - Yuki</div>
                  <div className="text-yellow-400">[2024-01-10 15:31:15] PURCHASE: Upgrade purchased - Special Talent Lv.8</div>
                  <div className="text-purple-400">[2024-01-10 15:31:30] LEVEL: User leveled up to level 5</div>
                  <div className="text-red-400">[2024-01-10 15:32:00] ERROR: Chat API timeout - retrying...</div>
                  <div className="text-green-400">[2024-01-10 15:32:30] WHEEL: Daily spin completed - reward: +500 coins</div>
                  <div className="text-blue-400">[2024-01-10 15:33:00] UNLOCK: Character unlocked - Sakura</div>
                  <div className="text-green-400">[2024-01-10 15:33:15] ACHIEVEMENT: First Upgrade completed</div>
                  <div className="text-yellow-400">[2024-01-10 15:34:00] SAVE: Game state saved for user ShadyLTD</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Game Settings Tab */}
          <TabsContent value="game-settings" className="space-y-6">
            {/* Upgrade Management */}
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-green-400">
                    <Settings className="w-5 h-5 mr-2" />
                    Upgrade Management
                  </span>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Add Upgrade
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Upgrade Name</Label>
                        <Input className="bg-purple-900/50 border-purple-500/50 text-white" placeholder="Special Talent" />
                      </div>
                      <div>
                        <Label>Base Cost</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white" placeholder="100" />
                      </div>
                      <div>
                        <Label>Hourly Bonus</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white" placeholder="50" />
                      </div>
                      <div>
                        <Label>Max Level</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white" placeholder="50" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Description</Label>
                      <Textarea className="bg-purple-900/50 border-purple-500/50 text-white" placeholder="Increases hourly income..." />
                    </div>
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-600">Save</Button>
                      <Button variant="outline" size="sm" className="text-red-400 border-red-400">Delete</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-400">
                    <Settings className="w-5 h-5 mr-2" />
                    Economy Settings
                  </CardTitle>
                  <CardDescription>Configure game economy and rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="energy-regen">Energy Regeneration Rate (per minute)</Label>
                    <Input
                      id="energy-regen"
                      type="number"
                      defaultValue={gameSettings?.energyRegenRate || 1}
                      className="bg-purple-900/50 border-purple-500/50 text-white"
                      onChange={(e) => handleUpdateSettings({ energyRegenRate: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max-energy">Maximum Energy Bonus</Label>
                    <Input
                      id="max-energy"
                      type="number"
                      defaultValue={gameSettings?.maxEnergyBonus || 0}
                      className="bg-purple-900/50 border-purple-500/50 text-white"
                      onChange={(e) => handleUpdateSettings({ maxEnergyBonus: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="base-tap-reward">Base Tap Reward</Label>
                    <Input
                      id="base-tap-reward"
                      type="number"
                      defaultValue={10}
                      className="bg-purple-900/50 border-purple-500/50 text-white"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-400">
                    <Palette className="w-5 h-5 mr-2" />
                    UI Customization
                  </CardTitle>
                  <CardDescription>Customize the game interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-gray-400">Use dark theme</p>
                    </div>
                    <Switch defaultChecked={uiSettings?.theme === 'dark'} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Animations</Label>
                      <p className="text-sm text-gray-400">Enable UI animations</p>
                    </div>
                    <Switch defaultChecked={uiSettings?.animations} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sound Effects</Label>
                      <p className="text-sm text-gray-400">Play sound effects</p>
                    </div>
                    <Switch defaultChecked={uiSettings?.soundEffects} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wheel Rewards Configuration */}
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-yellow-400">
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Daily Wheel Rewards
                  </span>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Add Reward
                  </Button>
                </CardTitle>
                <CardDescription>Configure possible rewards for the daily spin wheel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Existing Rewards */}
                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-yellow-400">Coins Reward</h4>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-400">Delete</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <Label className="text-xs">Min Amount</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="100" />
                      </div>
                      <div>
                        <Label className="text-xs">Max Amount</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="1000" />
                      </div>
                      <div>
                        <Label className="text-xs">Probability (%)</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="40" />
                      </div>
                      <div>
                        <Label className="text-xs">Rarity</Label>
                        <select className="w-full bg-purple-900/50 border border-purple-500/50 rounded px-2 py-1 text-sm text-white">
                          <option>Common</option>
                          <option>Rare</option>
                          <option>Epic</option>
                          <option>Legendary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-blue-400">Energy Reward</h4>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-400">Delete</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <Label className="text-xs">Min Amount</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="100" />
                      </div>
                      <div>
                        <Label className="text-xs">Max Amount</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="500" />
                      </div>
                      <div>
                        <Label className="text-xs">Probability (%)</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="30" />
                      </div>
                      <div>
                        <Label className="text-xs">Rarity</Label>
                        <select className="w-full bg-purple-900/50 border border-purple-500/50 rounded px-2 py-1 text-sm text-white">
                          <option>Common</option>
                          <option>Rare</option>
                          <option>Epic</option>
                          <option>Legendary</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-purple-400">Character Unlock</h4>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-400">Delete</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <Label className="text-xs">Character Pool</Label>
                        <select className="w-full bg-purple-900/50 border border-purple-500/50 rounded px-2 py-1 text-sm text-white">
                          <option>All Available</option>
                          <option>Event Only</option>
                          <option>VIP Only</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Level Required</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="1" />
                      </div>
                      <div>
                        <Label className="text-xs">Probability (%)</Label>
                        <Input type="number" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="10" />
                      </div>
                      <div>
                        <Label className="text-xs">Rarity</Label>
                        <select className="w-full bg-purple-900/50 border border-purple-500/50 rounded px-2 py-1 text-sm text-white">
                          <option>Common</option>
                          <option>Rare</option>
                          <option selected>Epic</option>
                          <option>Legendary</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total Probability: 80%</span>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Save All Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Management */}
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-pink-400">
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Event Management
                  </span>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    Create Event
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="font-semibold text-pink-400">Valentine's Special</h4>
                        <p className="text-sm text-gray-400">Feb 10 - Feb 16, 2024</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs">Active</span>
                        <Button variant="outline" size="sm" className="border-gray-600">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-400">End</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs">Reward Multiplier</Label>
                        <Input type="number" step="0.1" className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="2.0" />
                      </div>
                      <div>
                        <Label className="text-xs">Special Characters</Label>
                        <Input className="bg-purple-900/50 border-purple-500/50 text-white h-8" defaultValue="Cupid, Angel" />
                      </div>
                      <div>
                        <Label className="text-xs">Event Type</Label>
                        <select className="w-full bg-purple-900/50 border border-purple-500/50 rounded px-2 py-1 text-sm text-white">
                          <option>Double Rewards</option>
                          <option>Character Unlock</option>
                          <option>Special Wheel</option>
                          <option>Limited Upgrades</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Characters Tab */}
          <TabsContent value="characters" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-cyan-400">
                    <Users className="w-5 h-5 mr-2" />
                    Character Management
                  </span>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Add Character
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center text-2xl">
                          👩
                        </div>
                        <div>
                          <h3 className="font-semibold">Yuki</h3>
                          <p className="text-sm text-gray-400">Shrine Maiden</p>
                          <p className="text-xs text-green-400">Active</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-400">Delete</Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-2xl">
                          👩‍🦰
                        </div>
                        <div>
                          <h3 className="font-semibold">Naomi</h3>
                          <p className="text-sm text-gray-400">Fire Mage</p>
                          <p className="text-xs text-yellow-400">Locked</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-600">Edit</Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-400">Delete</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-green-400">
                    <Image className="w-5 h-5 mr-2" />
                    Media Management
                  </span>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="relative group cursor-pointer">
                    <img
                      src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400"
                      alt="Character"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button size="sm" variant="outline" className="border-gray-600">Edit</Button>
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-purple-500/50 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-gray-500">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center text-red-400">
                  <Users className="w-5 h-5 mr-2" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm border-purple-500/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                        S
                      </div>
                      <div>
                        <h3 className="font-semibold">ShadyLTD</h3>
                        <p className="text-sm text-gray-400">Level 4 • 2,140 coins</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-600">View</Button>
                      <Button variant="outline" size="sm" className="text-red-400 border-red-400">Ban</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center text-teal-400">
                  <FileText className="w-5 h-5 mr-2" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 rounded p-4 h-96 overflow-y-auto font-mono text-sm space-y-1">
                  <div className="text-green-400">[2024-01-10 15:30:25] INFO: Server started on port 5000</div>
                  <div className="text-blue-400">[2024-01-10 15:30:30] AUTH: User login successful - ShadyLTD</div>
                  <div className="text-green-400">[2024-01-10 15:31:00] GAME: Character selected - Yuki</div>
                  <div className="text-yellow-400">[2024-01-10 15:31:15] PURCHASE: Upgrade purchased - Special Talent Lv.8</div>
                  <div className="text-purple-400">[2024-01-10 15:31:30] LEVEL: User leveled up to level 5</div>
                  <div className="text-red-400">[2024-01-10 15:32:00] ERROR: Chat API timeout - retrying...</div>
                  <div className="text-green-400">[2024-01-10 15:32:30] WHEEL: Daily spin completed - reward: +500 coins</div>
                  <div className="text-blue-400">[2024-01-10 15:33:00] UNLOCK: Character unlocked - Sakura</div>
                  <div className="text-green-400">[2024-01-10 15:33:15] ACHIEVEMENT: First Upgrade completed</div>
                  <div className="text-yellow-400">[2024-01-10 15:34:00] SAVE: Game state saved for user ShadyLTD</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Chat Management Tab */}
          <TabsContent value="chat">
            <div className="grid gap-6">
              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-400">
                    <Bot className="w-5 h-5 mr-2" />
                    AI Chat Management
                  </CardTitle>
                  <CardDescription>Manage AI personalities and chat settings globally</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Global AI Settings</Label>
                      <div className="space-y-4 mt-2">
                        <div className="flex items-center justify-between p-3 bg-purple-900/50 rounded">
                          <span>Enable AI Chat</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-900/50 rounded">
                          <span>Allow NSFW Responses</span>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-900/50 rounded">
                          <span>Memory Persistence</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Response Limits</Label>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label className="text-sm">Max Response Length</Label>
                          <Input type="number" defaultValue="500" className="bg-purple-900/50 border-purple-500/50 text-white" />
                        </div>
                        <div>
                          <Label className="text-sm">Rate Limit (per hour)</Label>
                          <Input type="number" defaultValue="100" className="bg-purple-900/50 border-purple-500/50 text-white" />
                        </div>
                        <div>
                          <Label className="text-sm">Context Memory (messages)</Label>
                          <Input type="number" defaultValue="20" className="bg-purple-900/50 border-purple-500/50 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Global AI Personality Template</Label>
                    <Textarea
                      className="bg-purple-900/50 border-purple-500/50 text-white min-h-[100px] mt-2"
                      placeholder="Enter default AI personality prompt that applies to all characters..."
                      defaultValue="You are a helpful, friendly AI companion in an anime-style game. Be engaging, supportive, and maintain character consistency. Keep responses appropriate to the character's personality and background."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Button variant="outline" className="border-gray-600">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Test AI Response
                    </Button>
                    <Button variant="outline" className="border-gray-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Chat Logs
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save AI Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-purple-500/30 mt-6">
                <CardHeader>
                  <CardTitle>Character AI Personalities</CardTitle>
                  <CardDescription>Quick overview of character AI settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {characters.map(character => (
                      <div key={character.id} className="flex items-center justify-between p-3 bg-purple-900/50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{character.name}</div>
                            <div className="text-sm text-gray-400 capitalize">
                              {character.personality} • {character.chatStyle}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/admin/character/edit/${character.id}`)}
                            className="border-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Test character AI
                              toast({
                                title: "AI Test",
                                description: `Testing ${character.name}'s AI response...`
                              });
                            }}
                            className="border-gray-600"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}