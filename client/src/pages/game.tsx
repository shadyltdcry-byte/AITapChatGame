import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import CharacterDisplay from "@/components/CharacterDisplay";
import UpgradeModal from "@/components/UpgradeModal";
//import ChatModal from "@/components/ChatModal";
import EnhancedChatModal from "@/components/EnhancedChatModal";
import AdminPanelFull from "@/components/AdminPanelFull";
import WheelModal from "@/components/WheelModal";
import AchievementsModal from "@/components/AchievementsModal";
import VIPModal from "@/components/VIPModal";
import FloatingHearts from "@/components/FloatingHearts";
import InGameAIControls from "@/components/InGameAIControls";
import MistralDebugger from "@/components/MistralDebugger";
import { 
  Settings, 
  Heart, 
  Gem, 
  Zap, 
  Target, 
  Star, 
  ArrowUp, 
  ShoppingBag, 
  MessageCircle, 
  ListChecks,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Shield,
  Eye,
  Save,
  BarChart3,
  Brain
} from "lucide-react";
import type { User, Character, Upgrade, GameStats } from "@shared/schema";

const MOCK_USER_ID = "default-player";

// Check if user is admin (you can modify this logic based on your needs)
const isCurrentUserAdmin = (user: User | undefined) => {
  return user?.isAdmin || user?.username === "ShadowGoddess";
};

export default function Game() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showVIPModal, setShowVIPModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAIControls, setShowAIControls] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  const [heartTriggers, setHeartTriggers] = useState<Array<{ amount: number; x: number; y: number }>>([]);
  const { toast } = useToast();

  // Settings state
  const [localSettings, setLocalSettings] = useState({
    nsfwEnabled: false,
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    darkMode: true,
    fontSize: 16,
    animationSpeed: 1,
    autoSave: true,
    notifications: true
  });

  // Initialize user first
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user/init"],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/user/init');
      return await response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch selected character
  const { data: character, isLoading: characterLoading } = useQuery<Character>({
    queryKey: ["/api/character/selected", MOCK_USER_ID],
    enabled: !!user,
  });

  // Fetch user upgrades
  const { data: upgrades } = useQuery<Upgrade[]>({
    queryKey: ["/api/upgrades", MOCK_USER_ID],
    enabled: !!user,
  });

  // Fetch user stats
  const { data: stats } = useQuery<GameStats>({
    queryKey: ["/api/stats", MOCK_USER_ID],
    enabled: !!user,
  });

  // Fetch current settings and sync with user data
  useQuery({
    queryKey: ['/api/settings', MOCK_USER_ID],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings');
      return await response.json();
    },
    enabled: !!user
  });

  // Update local settings when user data changes
  useEffect(() => {
    if (user) {
      setLocalSettings(prev => ({
        ...prev,
        nsfwEnabled: user.nsfwEnabled || false
      }));
    }
  }, [user]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: typeof localSettings) => {
      // Update user NSFW setting
      if (newSettings.nsfwEnabled !== localSettings.nsfwEnabled) {
        const response = await apiRequest('POST', `/api/settings/toggle-nsfw/${MOCK_USER_ID}`);
        return await response.json();
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    },
  });

  // Tap mutation
  const tapMutation = useMutation({
    mutationFn: async (coords?: { x: number; y: number }) => {
      const response = await apiRequest("POST", "/api/tap", { userId: user?.id || MOCK_USER_ID });
      const data = await response.json();

      // Trigger floating heart animation if coordinates provided
      if (coords) {
        setHeartTriggers(prev => [...prev, { 
          amount: data.pointsEarned || 1, 
          x: coords.x, 
          y: coords.y 
        }]);

        // Clear triggers after animation
        setTimeout(() => {
          setHeartTriggers([]);
        }, 100);
      }

      return data;
    },
    onSuccess: (data) => {
      // Force refresh user data to get updated points
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", MOCK_USER_ID] });
      queryClient.invalidateQueries({ queryKey: ["/api/upgrades", MOCK_USER_ID] });

      // Removed toast notification as requested - using floating hearts instead
    },
    onError: (error: any) => {
      toast({
        title: "Tap Failed",
        description: error.message || "Not enough energy!",
        variant: "destructive",
      });
    },
  });

  // Handle tap with floating hearts
  const handleTap = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    tapMutation.mutate({ x, y });
  };

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  // Energy regeneration effect
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/init"] });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (userLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading ClassikLust...</div>
      </div>
    );
  }

  if (!user || !character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Game data not available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ff69b4%27 fill-opacity=%270.05%27%3E%3Ccircle cx=%2730%27 cy=%2730%27 r=%272%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>

      {/* Main Game Interface */}
      <div className="relative z-10 min-h-screen">
        {/* Top Status Bar */}
        <div className="flex justify-between items-start p-4">
          {/* Top-Left Block */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-red-500 bg-red-500/20">
                <img 
                  src={character.imageUrl} 
                  alt="Character Avatar"
                  className="w-full h-full object-cover"
                />
                <Button
                  onClick={() => setShowSettingsModal(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 p-0"
                >
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-4">
                <span className="text-white font-bold">{user.username || "Guest"}</span>
                <span className="text-white font-bold">Level: {user.level}/50</span>
              </div>
              <div className="flex items-center space-x-1 mt-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-white">LP {stats?.totalPoints?.toLocaleString() || "1500"}</span>
              </div>
            </div>
          </div>

          {/* Top-Right Block */}
          <div className="text-center relative">
            <div className="text-white">
              <div className="text-sm font-bold">LP per Hour:</div>
              <div className="text-lg font-bold text-green-400">+{user?.hourlyRate?.toLocaleString() || "0"}</div>
            </div>
            <div className="flex items-center justify-end space-x-4 mt-2">
              <div className="flex items-center space-x-1">
                <Gem className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm">Lust Gems: </span>
                <span className="text-white font-bold">{user?.lustGems || "0"}</span>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-1 mt-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">Energy: </span>
              <span className="text-white font-bold">{stats?.currentEnergy || "1500"}/{stats?.maxEnergy || "4500"}</span>
            </div>

            {/* Admin Buttons - Only visible to admin users */}
            {isCurrentUserAdmin(user) && (
              <div className="absolute -top-2 -right-2 flex gap-1">

                <Button
                  onClick={() => setShowAdminPanel(true)}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center p-0"
                  title="Admin Panel"
                >
                  <Shield className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setShowDebugger(true)}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center p-0"
                  title="AI Debugger"
                >
                  <Brain className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Event Block */}
        <div className="mx-4 mb-4">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl text-center">
            <span className="font-bold text-lg">EVENT NEWS</span>
          </div>
        </div>

        {/* Main Character Display */}
        <div className="flex-1 relative px-4">
          <CharacterDisplay 
            character={character}
            user={user}
            stats={stats}
            onTap={handleTap}
            isTapping={tapMutation.isPending}
          />
        </div>

        {/* Right-Side Action Buttons */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 space-y-3 z-20">
          <Button
            onClick={() => setShowWheelModal(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg flex flex-col items-center justify-center"
          >
            <Target className="w-6 h-6" />
            <span className="text-xs mt-1">Wheel</span>
          </Button>

          <Button
            onClick={() => setShowUpgradeModal(true)}
            className="w-16 h-20 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg flex flex-col items-center justify-center"
          >
            <Star className="w-6 h-6" />
            <span className="text-xs mt-1">Power Up</span>
          </Button>

          {/* AI Control Panel Button */}
          <Button
            onClick={() => setShowAIControls(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg flex flex-col items-center justify-center"
            title="AI Controls"
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs mt-1">AI</span>
          </Button>
        </div>

        {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10 p-4 pb-6">
            <div className="flex justify-around items-center max-w-md mx-auto">
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="flex flex-col items-center space-y-1 bg-transparent hover:bg-white/10 text-white p-3 rounded-lg"
              >
                <ArrowUp className="w-6 h-6 text-pink-400" />
                <span className="text-xs">Upgrade</span>
              </Button>

              <Button
                onClick={() => setShowAchievementsModal(true)}
                className="flex flex-col items-center space-y-1 bg-transparent hover:bg-white/10 text-white p-3 rounded-lg"
              >
                <ListChecks className="w-6 h-6 text-blue-400" />
                <span className="text-xs">Task</span>
              </Button>

              <Button
                onClick={() => toast({ title: "Shop", description: "Coming soon!" })}
                className="flex flex-col items-center space-y-1 bg-transparent hover:bg-white/10 text-white p-3 rounded-lg"
              >
                <ShoppingBag className="w-6 h-6 text-green-400" />
                <span className="text-xs">Shop</span>
              </Button>

              <Button
                onClick={() => setShowChatModal(true)}
                className="flex flex-col items-center space-y-1 bg-transparent hover:bg-white/10 text-white p-3 rounded-lg"
              >
                <MessageCircle className="w-6 h-6 text-purple-400" />
                <span className="text-xs">Chat</span>
              </Button>
            </div>
          </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 text-white border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold gradient-text">Settings</DialogTitle>
            <DialogDescription className="text-white/70">Adjust your game preferences and appearance.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full max-w-md bg-dark-800/50">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="flex items-center">
                        {localSettings.darkMode ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                        Dark Mode
                      </Label>
                      <p className="text-sm text-gray-400">Use dark theme for better night gaming</p>
                    </div>
                    <Switch
                      checked={localSettings.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Font Size</Label>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-400">Small</span>
                      <Slider
                        value={[localSettings.fontSize]}
                        onValueChange={([value]) => handleSettingChange('fontSize', value)}
                        min={12}
                        max={24}
                        step={2}
                        className="flex-1"
                      />
                      <span className="text-sm text-gray-400">Large</span>
                    </div>
                    <p className="text-sm text-gray-400">Current size: {localSettings.fontSize}px</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto-Save Progress</Label>
                      <p className="text-sm text-gray-400">Automatically save your progress</p>
                    </div>
                    <Switch
                      checked={localSettings.autoSave}
                      onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="flex items-center text-red-400">
                          <Eye className="w-4 h-4 mr-2" />
                          Enable NSFW Content
                        </Label>
                        <p className="text-sm text-gray-400">
                          Show adult-oriented content including characters, images, and interactions
                        </p>
                        <p className="text-xs text-red-400">
                          ⚠️ You must be 18+ to enable this setting
                        </p>
                      </div>
                      <Switch
                        checked={localSettings.nsfwEnabled}
                        onCheckedChange={(checked) => handleSettingChange('nsfwEnabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audio" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="flex items-center">
                        {localSettings.soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                        Sound Effects
                      </Label>
                      <p className="text-sm text-gray-400">Play tap sounds, notifications, and UI sounds</p>
                    </div>
                    <Switch
                      checked={localSettings.soundEnabled}
                      onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Background Music</Label>
                      <p className="text-sm text-gray-400">Play ambient background music</p>
                    </div>
                    <Switch
                      checked={localSettings.musicEnabled}
                      onCheckedChange={(checked) => handleSettingChange('musicEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card className="bg-gray-800/80 border-gray-600">
                <CardContent className="space-y-6 pt-6">
                  <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Debug Information</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>Game Version: v1.0.0</div>
                      <div>Player ID: {MOCK_USER_ID}</div>
                      <div>Session: Active</div>
                      <div>Server Status: Connected</div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-gray-600"
                    onClick={() => {
                      toast({
                        title: "Cache Cleared",
                        description: "Game cache has been cleared successfully.",
                      });
                    }}
                  >
                    Clear Cache
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
            <Button
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
              className="bg-gradient-to-r from-secondary-500 to-accent-500 hover:from-secondary-600 hover:to-accent-600"
            >
              {saveSettingsMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        upgrades={upgrades || []}
        user={user}
      />

      <EnhancedChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        characterId={character?.id || ""}
        characterName={character?.name || "Character"}
        user={user}
      />

      <AdminPanelFull
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
      />

      <MistralDebugger 
        isOpen={showDebugger} 
        onClose={() => setShowDebugger(false)} 
      />

      <WheelModal
        isOpen={showWheelModal}
        onClose={() => setShowWheelModal(false)}
        userId={MOCK_USER_ID}
      />

      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        userId={MOCK_USER_ID}
      />

      <VIPModal
        isOpen={showVIPModal}
        onClose={() => setShowVIPModal(false)}
        userId={MOCK_USER_ID}
      />

      <InGameAIControls
        isOpen={showAIControls}
        onClose={() => setShowAIControls(false)}
      />

      {/* Floating Hearts Animation */}
      <FloatingHearts triggers={heartTriggers} />
    </div>
  );
}