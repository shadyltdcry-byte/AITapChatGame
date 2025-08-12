import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  Gamepad2, 
  Settings, 
  Plus, 
  Trash2, 
  Edit, 
  Coins,
  Zap,
  Crown,
  Heart,
  Star,
  Sparkles,
  Database,
  Activity,
  MessageSquare,
  Shield,
  ImageIcon,
  Upload,
  Eye
} from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  username: string;
  level: number;
  points: number;
  energy: number;
  maxEnergy: number;
  isAdmin: boolean;
  nsfwEnabled: boolean;
  lustGems: number;
  createdAt: string;
}

interface Character {
  id: string;
  name: string;
  bio: string;
  personality: string;
  requiredLevel: number;
  isNsfw: boolean;
  isVip: boolean;
  isEvent: boolean;
  isWheelReward: boolean;
}

interface WheelPrize {
  id: string;
  type: string;
  min: number;
  max: number;
  probability: number;
  label: string;
}

export default function AdminPanelFull({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [newPrize, setNewPrize] = useState({
    type: "points",
    min: 10,
    max: 100,
    probability: 0.2,
    label: "Points"
  });
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    bio: "",
    personality: "friendly",
    requiredLevel: 1,
    isNsfw: false,
    isVip: false
  });

  const { toast } = useToast();

  // Data fetching
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isOpen,
  });

  const { data: characters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ["/api/admin/characters"],
    enabled: isOpen,
  });

  const { data: wheelPrizes = [], isLoading: prizesLoading } = useQuery<WheelPrize[]>({
    queryKey: ["/api/admin/wheel-prizes"],
    enabled: isOpen,
  });

  const { data: mediaFiles = [], isLoading: mediaLoading } = useQuery<MediaFile[]>({
    queryKey: ["/api/media"],
    enabled: isOpen,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isOpen,
  });

  // Mutations
  const createPrizeMutation = useMutation({
    mutationFn: async (data: typeof newPrize) => {
      const response = await apiRequest("POST", "/api/admin/wheel-prizes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wheel-prizes"] });
      toast({ title: "Success", description: "Prize added successfully!" });
      setNewPrize({ type: "points", min: 10, max: 100, probability: 0.2, label: "Points" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add prize", variant: "destructive" });
    }
  });

  const deletePrizeMutation = useMutation({
    mutationFn: async (prizeId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/wheel-prizes/${prizeId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wheel-prizes"] });
      toast({ title: "Success", description: "Prize deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete prize", variant: "destructive" });
    }
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: any) => {
      const characterData = {
        ...data,
        backstory: data.bio,
        interests: "Gaming, Anime",
        quirks: "Unique personality",
        description: data.bio,
        imageUrl: "/default-character.jpg",
        avatarUrl: "/default-avatar.jpg",
        personalityStyle: "Sweet & Caring",
        chatStyle: "casual",
        likes: "Adventures",
        dislikes: "Rudeness",
        level: 1,
        responseTimeMin: 1,
        responseTimeMax: 3,
        responseTimeMs: 2000,
        pictureSendChance: 5,
        isEvent: false,
        isWheelReward: false,
        randomPictureSending: false,
        moodDistribution: {
          normal: 70,
          happy: 20,
          flirty: 10,
          playful: 0,
          mysterious: 0,
          shy: 0,
        },
        customTriggerWords: [],
        customGreetings: [`Hello! I'm ${data.name}, nice to meet you!`],
        customResponses: [],
      };
      const response = await apiRequest("POST", "/api/admin/characters", characterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      toast({ title: "Success", description: "Character created successfully!" });
      setNewCharacter({
        name: "",
        bio: "",
        personality: "friendly",
        requiredLevel: 1,
        isNsfw: false,
        isVip: false
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create character", variant: "destructive" });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            Admin Control Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800/50 border border-slate-600">
            <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-blue-600">
              <Activity className="w-4 h-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="characters" className="text-white data-[state=active]:bg-green-600">
              <Gamepad2 className="w-4 h-4 mr-1" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="images" className="text-white data-[state=active]:bg-indigo-600">
              <ImageIcon className="w-4 h-4 mr-1" />
              Images
            </TabsTrigger>
            <TabsTrigger value="wheel" className="text-white data-[state=active]:bg-orange-600">
              <Coins className="w-4 h-4 mr-1" />
              Wheel
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-white data-[state=active]:bg-pink-600">
              <MessageSquare className="w-4 h-4 mr-1" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-red-600">
              <Settings className="w-4 h-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(95vh-200px)] mt-6">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-blue-400/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-blue-200 text-sm">
                      <Users className="w-4 h-4" />
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">{users.length}</div>
                    <p className="text-xs text-blue-300 mt-1">Registered players</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 border-purple-400/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-purple-200 text-sm">
                      <Gamepad2 className="w-4 h-4" />
                      Characters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-100">{characters.length}</div>
                    <p className="text-xs text-purple-300 mt-1">Available characters</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/20 to-green-600/30 border-green-400/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-green-200 text-sm">
                      <Coins className="w-4 h-4" />
                      Wheel Prizes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-100">{wheelPrizes.length}</div>
                    <p className="text-xs text-green-300 mt-1">Active rewards</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/30 border-orange-400/30 backdrop-blur">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-orange-200 text-sm">
                      <Database className="w-4 h-4" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">Online</div>
                    <p className="text-xs text-orange-300 mt-1">All systems operational</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-2">Active Features</h4>
                      <ul className="space-y-1 text-slate-300">
                        <li>✓ AI Chat System (Mistral AI)</li>
                        <li>✓ Character Management</li>
                        <li>✓ User Administration</li>
                        <li>✓ Energy System</li>
                        <li>✓ Level Progression</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-300 mb-2">Database Status</h4>
                      <ul className="space-y-1 text-slate-300">
                        <li>✓ In-Memory Storage Active</li>
                        <li>✓ Auto-Save Enabled</li>
                        <li>✓ Energy Regeneration Active</li>
                        <li>✓ Session Management Active</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300">Username</TableHead>
                        <TableHead className="text-slate-300">Level</TableHead>
                        <TableHead className="text-slate-300">Points</TableHead>
                        <TableHead className="text-slate-300">Energy</TableHead>
                        <TableHead className="text-slate-300">Gems</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id} className="border-slate-600">
                          <TableCell className="text-white font-medium">{user.username}</TableCell>
                          <TableCell className="text-slate-300">{user.level}</TableCell>
                          <TableCell className="text-slate-300">{user.points.toLocaleString()}</TableCell>
                          <TableCell className="text-slate-300">{user.energy}/{user.maxEnergy}</TableCell>
                          <TableCell className="text-slate-300">{user.lustGems}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.isAdmin && <Badge className="bg-red-500 text-xs">Admin</Badge>}
                              {user.nsfwEnabled && <Badge className="bg-orange-500 text-xs">NSFW</Badge>}
                              <Badge className="bg-green-500 text-xs">Active</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Characters Tab */}
            <TabsContent value="characters" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Character List */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Gamepad2 className="w-5 h-5" />
                      Character Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {characters.map((character: Character) => (
                        <div key={character.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{character.name}</h4>
                              <p className="text-sm text-slate-400">{character.personality} • Level {character.requiredLevel}</p>
                              <p className="text-xs text-slate-500 mt-1">{character.bio}</p>
                            </div>
                            <div className="flex gap-2 flex-col items-end">
                              <div className="flex gap-1">
                                {character.isNsfw && <Badge className="bg-red-500 text-xs">NSFW</Badge>}
                                {character.isVip && <Badge className="bg-yellow-500 text-xs">VIP</Badge>}
                                {character.isEvent && <Badge className="bg-purple-500 text-xs">Event</Badge>}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
                                onClick={() => setSelectedCharacter(character)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Create Character */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create New Character
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Name</Label>
                      <Input 
                        value={newCharacter.name}
                        onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Character name"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Bio</Label>
                      <Textarea 
                        value={newCharacter.bio}
                        onChange={(e) => setNewCharacter({...newCharacter, bio: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="Character description and personality"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Personality</Label>
                        <select 
                          value={newCharacter.personality}
                          onChange={(e) => setNewCharacter({...newCharacter, personality: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        >
                          <option value="friendly">Friendly</option>
                          <option value="flirty">Flirty</option>
                          <option value="mysterious">Mysterious</option>
                          <option value="playful">Playful</option>
                          <option value="shy">Shy</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-white">Required Level</Label>
                        <Input 
                          type="number"
                          value={newCharacter.requiredLevel}
                          onChange={(e) => setNewCharacter({...newCharacter, requiredLevel: parseInt(e.target.value)})}
                          className="bg-slate-700 border-slate-600 text-white"
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="nsfw"
                          checked={newCharacter.isNsfw}
                          onCheckedChange={(checked) => setNewCharacter({...newCharacter, isNsfw: checked})}
                        />
                        <Label htmlFor="nsfw" className="text-white">NSFW</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="vip"
                          checked={newCharacter.isVip}
                          onCheckedChange={(checked) => setNewCharacter({...newCharacter, isVip: checked})}
                        />
                        <Label htmlFor="vip" className="text-white">VIP</Label>
                      </div>
                    </div>
                    <Button 
                      onClick={() => createCharacterMutation.mutate(newCharacter)}
                      disabled={createCharacterMutation.isPending || !newCharacter.name || !newCharacter.bio}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Character
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Image Library */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Image Library ({mediaFiles.length} files)
                      </div>
                      <Button 
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) {
                              const formData = new FormData();
                              for (let i = 0; i < files.length; i++) {
                                formData.append('images', files[i]);
                              }
                              try {
                                const response = await fetch('/api/media/upload', {
                                  method: 'POST',
                                  body: formData
                                });
                                if (response.ok) {
                                  queryClient.invalidateQueries({ queryKey: ["/api/media"] });
                                  toast({ title: "Success", description: `${files.length} files uploaded successfully!` });
                                }
                              } catch (error) {
                                toast({ title: "Error", description: "Upload failed", variant: "destructive" });
                              }
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Images
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mediaLoading ? (
                      <div className="text-center py-8 text-slate-400">Loading images...</div>
                    ) : mediaFiles.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No images uploaded yet. Click "Upload Images" to get started.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {mediaFiles.map((file: MediaFile) => (
                          <div key={file.id} className="group relative">
                            <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                              <img 
                                src={file.url} 
                                alt={file.originalName || file.filename}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/api/placeholder-image';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    className="h-8 w-8 p-0"
                                    onClick={() => window.open(file.url, '_blank')}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="h-8 w-8 p-0"
                                    onClick={async () => {
                                      if (confirm('Delete this image?')) {
                                        try {
                                          await apiRequest("DELETE", `/api/media/${file.id}`);
                                          queryClient.invalidateQueries({ queryKey: ["/api/media"] });
                                          toast({ title: "Success", description: "Image deleted successfully!" });
                                        } catch (error) {
                                          toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
                                        }
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-400 truncate">
                              {file.originalName || file.filename}
                            </div>
                            {file.characterId && (
                              <Badge className="mt-1 bg-purple-600 text-xs">
                                Assigned to Character
                              </Badge>
                            )}
                            <div className="text-xs text-slate-500 mt-1">
                              {(file.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Wheel Tab */}
            <TabsContent value="wheel" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Prize List */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Coins className="w-5 h-5" />
                      Current Prizes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {wheelPrizes.map((prize: WheelPrize) => (
                        <div key={prize.id} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{prize.label}</h4>
                              <p className="text-sm text-slate-400">
                                Type: {prize.type} • Range: {prize.min}-{prize.max}
                              </p>
                              <p className="text-xs text-slate-500">
                                Probability: {(prize.probability * 100).toFixed(1)}%
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePrizeMutation.mutate(prize.id)}
                              disabled={deletePrizeMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Add Prize */}
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Prize
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Prize Type</Label>
                      <select 
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
                        value={newPrize.type}
                        onChange={(e) => setNewPrize({ ...newPrize, type: e.target.value })}
                      >
                        <option value="points">Points</option>
                        <option value="energy">Energy</option>
                        <option value="gems">Gems</option>
                        <option value="character">Character</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-white">Min Value</Label>
                        <Input 
                          type="number"
                          value={newPrize.min}
                          onChange={(e) => setNewPrize({ ...newPrize, min: parseInt(e.target.value) })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Max Value</Label>
                        <Input 
                          type="number"
                          value={newPrize.max}
                          onChange={(e) => setNewPrize({ ...newPrize, max: parseInt(e.target.value) })}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-white">Probability (0-1)</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={newPrize.probability}
                        onChange={(e) => setNewPrize({ ...newPrize, probability: parseFloat(e.target.value) })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Display Label</Label>
                      <Input 
                        value={newPrize.label}
                        onChange={(e) => setNewPrize({ ...newPrize, label: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="e.g., '100 Points'"
                      />
                    </div>
                    <Button 
                      onClick={() => createPrizeMutation.mutate(newPrize)}
                      disabled={createPrizeMutation.isPending}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prize
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Chat Tab */}
            <TabsContent value="chat" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    AI Chat System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <h4 className="font-semibold text-green-400 mb-2">Mistral AI Status</h4>
                      <p className="text-sm text-green-200">✓ Connected and operational</p>
                      <p className="text-xs text-green-300 mt-1">Using fine-tuned models for character responses</p>
                    </div>
                    <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <h4 className="font-semibold text-blue-400 mb-2">Active Models</h4>
                      <p className="text-xs text-blue-200">Chat: ft:open-mistral-7b:0834440f:20250812:43c81adb</p>
                      <p className="text-xs text-blue-200">Debug: ft:ministral-3b-latest:0834440f:20250812:63a294f4</p>
                    </div>
                  </div>
                  <Separator className="bg-slate-600" />
                  <div>
                    <h4 className="font-semibold text-white mb-3">Chat System Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <ul className="space-y-1 text-slate-300">
                          <li>✓ Real-time AI responses</li>
                          <li>✓ Character personality integration</li>
                          <li>✓ Conversation history</li>
                          <li>✓ Custom greetings</li>
                        </ul>
                      </div>
                      <div>
                        <ul className="space-y-1 text-slate-300">
                          <li>✓ Mood-based responses</li>
                          <li>✓ NSFW content filtering</li>
                          <li>✓ Response timing controls</li>
                          <li>✓ Multi-character support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Game Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Energy Regen Rate</Label>
                        <Input 
                          type="number"
                          defaultValue="1"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Max Energy Bonus</Label>
                        <Input 
                          type="number"
                          defaultValue="0"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-slate-600" />
                  <div>
                    <h4 className="font-semibold text-white mb-3">Feature Toggles</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">NSFW Content</Label>
                          <p className="text-sm text-slate-400">Allow adult content in the game</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Chat Random Responses</Label>
                          <p className="text-sm text-slate-400">Enable random AI-generated messages</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Wheel Game</Label>
                          <p className="text-sm text-slate-400">Enable fortune wheel feature</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}