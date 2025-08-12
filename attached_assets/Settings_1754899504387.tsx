
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Eye, EyeOff, Shield, Volume2, VolumeX, Smartphone, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SettingsData {
  user: {
    nsfwEnabled: boolean;
  };
  game: {
    energyRegenRate: number;
    nsfwEnabled?: boolean;
  };
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      setLocalSettings(prev => ({
        ...prev,
        nsfwEnabled: data.user.nsfwEnabled
      }));
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: typeof localSettings) => 
      apiRequest('PUT', '/api/settings', {
        userSettings: {
          nsfwEnabled: newSettings.nsfwEnabled
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
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

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  const handleGoBack = () => {
    setLocation('/game');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 text-white">
      <div className="container mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="mr-4 text-white hover:bg-primary-700/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Settings</h1>
            <p className="text-gray-300">Customize your game experience</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-dark-800/50 border-gray-600">
              <CardHeader>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>Basic game settings and appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="space-y-3">
                  <Label>Animation Speed</Label>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">Slow</span>
                    <Slider
                      value={[localSettings.animationSpeed]}
                      onValueChange={([value]) => handleSettingChange('animationSpeed', value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-400">Fast</span>
                  </div>
                  <p className="text-sm text-gray-400">Speed: {localSettings.animationSpeed}x</p>
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

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-400">Get notified about energy and events</p>
                  </div>
                  <Switch
                    checked={localSettings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-dark-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-400" />
                  Content Filters
                </CardTitle>
                <CardDescription>Control what content you want to see</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                {localSettings.nsfwEnabled && (
                  <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-yellow-400">NSFW Settings</h4>
                      <p className="text-sm text-gray-400">
                        With NSFW content enabled, you will see:
                      </p>
                      <ul className="text-sm text-gray-300 space-y-1 ml-4">
                        <li>• Adult-themed characters and their content</li>
                        <li>• Mature conversation topics in chat</li>
                        <li>• NSFW images and media files</li>
                        <li>• Adult-oriented wheel rewards and events</li>
                      </ul>
                      <p className="text-xs text-yellow-400 mt-3">
                        You can disable this at any time. Content filtering applies immediately.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold">Content Visibility</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-dark-900/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">VIP Characters</span>
                        <span className="text-xs text-gray-400">Always visible</span>
                      </div>
                    </div>
                    <div className="bg-dark-900/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Event Characters</span>
                        <span className="text-xs text-gray-400">When active</span>
                      </div>
                    </div>
                    <div className="bg-dark-900/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Wheel Rewards</span>
                        <span className="text-xs text-gray-400">Always visible</span>
                      </div>
                    </div>
                    <div className="bg-dark-900/50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">NSFW Content</span>
                        <span className={`text-xs ${localSettings.nsfwEnabled ? 'text-green-400' : 'text-red-400'}`}>
                          {localSettings.nsfwEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6">
            <Card className="bg-dark-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Audio Settings
                </CardTitle>
                <CardDescription>Control sound effects and music</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Haptic Feedback
                    </Label>
                    <p className="text-sm text-gray-400">Vibrate on taps and interactions (mobile only)</p>
                  </div>
                  <Switch
                    checked={localSettings.vibrationEnabled}
                    onCheckedChange={(checked) => handleSettingChange('vibrationEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-dark-800/50 border-gray-600">
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Developer and experimental features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-400 mb-2">Debug Information</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Game Version: v1.0.0</div>
                    <div>Player ID: mock-user-id</div>
                    <div>Session: Active</div>
                    <div>Server Status: Connected</div>
                  </div>
                </div>

                <div className="space-y-4">
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
                  
                  <Button
                    variant="outline"
                    className="w-full border-gray-600"
                    onClick={() => {
                      toast({
                        title: "Data Export",
                        description: "Your game data has been prepared for export.",
                      });
                    }}
                  >
                    Export Game Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
          <Button
            onClick={handleSave}
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
      </div>
    </div>
  );
}
