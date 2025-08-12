
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
import ImageManager from "./ImageManager";
import CharacterEditor from "./CharacterEditor";
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
  Image
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

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Debug logging
  console.log('AdminPanel rendering, isOpen:', isOpen, 'activeTab:', activeTab);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showCharacterEditor, setShowCharacterEditor] = useState(false);
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
    isVip: false,
    isEvent: false,
    isWheelReward: false
  });

  const { toast } = useToast();

  // Data fetching
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isOpen,
  });

  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ["/api/admin/characters"],
    enabled: isOpen,
  });

  const { data: wheelPrizes = [], isLoading: prizesLoading } = useQuery({
    queryKey: ["/api/admin/wheel-prizes"],
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
        isVip: false,
        isEvent: false,
        isWheelReward: false
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
          <div className="text-slate-300">
            Comprehensive game administration and management dashboard
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800/50 border border-slate-600">
            <TabsTrigger value="dashboard" className="text-white data-[state=active]:bg-blue-600">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="characters" className="text-white data-[state=active]:bg-green-600">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Characters
            </TabsTrigger>
            <TabsTrigger value="wheel" className="text-white data-[state=active]:bg-orange-600">
              <Coins className="w-4 h-4 mr-2" />
              Wheel
            </TabsTrigger>
            <TabsTrigger value="media" className="text-white data-[state=active]:bg-pink-600">
              <Image className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-white data-[state=active]:bg-cyan-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-red-600">
              <Settings className="w-4 h-4 mr-2" />
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
                        <li>✓ Image Management</li>
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
                              <div className="flex gap-1 flex-wrap">
                                {character.isNsfw && <Badge className="bg-red-500 text-xs">NSFW</Badge>}
                                {character.isVip && <Badge className="bg-yellow-500 text-xs">VIP</Badge>}
                                {character.isEvent && <Badge className="bg-purple-500 text-xs">Event</Badge>}
                                {character.isWheelReward && <Badge className="bg-orange-500 text-xs">Wheel</Badge>}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                                  onClick={() => {
                                    setEditingCharacter(character);
                                    setShowCharacterEditor(true);
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                              </div>
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
                    <div className="text-center p-6">
                      <Button 
                        onClick={() => {
                          setEditingCharacter(null);
                          setShowCharacterEditor(true);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-3"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Open Character Editor
                      </Button>
                      <p className="text-sm text-slate-400 mt-2">
                        Use the full character editor with all advanced options
                      </p>
                    </div>
                    <Separator className="bg-slate-600" />
                    <div className="text-sm text-slate-500 text-center">Or use quick create below:</div>
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
                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="event"
                          checked={newCharacter.isEvent || false}
                          onCheckedChange={(checked) => setNewCharacter({...newCharacter, isEvent: checked})}
                        />
                        <Label htmlFor="event" className="text-white">Event</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="wheel"
                          checked={newCharacter.isWheelReward || false}
                          onCheckedChange={(checked) => setNewCharacter({...newCharacter, isWheelReward: checked})}
                        />
                        <Label htmlFor="wheel" className="text-white">Wheel Reward</Label>
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

            {/* Media Tab - Image Manager */}
            <TabsContent value="media" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Media Management System
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ImageManager isOpen={true} onClose={() => {}} />
                </CardContent>
              </Card>
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div>
                          <Label className="text-white font-medium">NSFW Content</Label>
                          <p className="text-sm text-slate-400">Allow adult content in the game</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div>
                          <Label className="text-white font-medium">Chat Random Responses</Label>
                          <p className="text-sm text-slate-400">Enable random AI-generated messages</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div>
                          <Label className="text-white font-medium">Wheel Game</Label>
                          <p className="text-sm text-slate-400">Enable fortune wheel feature</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div>
                          <Label className="text-white font-medium">VIP System</Label>
                          <p className="text-sm text-slate-400">Enable VIP character access and features</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div>
                          <Label className="text-white font-medium">Event Characters</Label>
                          <p className="text-sm text-slate-400">Enable special event character system</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div>
                          <Label className="text-white font-medium">Auto Picture Sending</Label>
                          <p className="text-sm text-slate-400">Allow characters to send pictures automatically</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-slate-600" />
                  <div>
                    <h4 className="font-semibold text-white mb-3">Advanced Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Chat Response Delay (ms)</Label>
                        <Input 
                          type="number"
                          defaultValue="2000"
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Response delay in milliseconds"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Picture Send Chance (%)</Label>
                        <Input 
                          type="number"
                          defaultValue="5"
                          min="0"
                          max="100"
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Chance to send pictures"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Points Per Tap</Label>
                        <Input 
                          type="number"
                          defaultValue="125"
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Points awarded per tap"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Level Up Requirement</Label>
                        <Input 
                          type="number"
                          defaultValue="1000"
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Points needed to level up"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator className="bg-slate-600" />
                  <div>
                    <h4 className="font-semibold text-white mb-3">Database Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                      >
                        <Database className="w-4 h-4 mr-2" />
                        Backup Data
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-green-400 border-green-400 hover:bg-green-400/10"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Reset Energy
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Reset Levels
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
      
      {/* Character Editor Modal */}
      {showCharacterEditor && (
        <Dialog open={showCharacterEditor} onOpenChange={(open) => {
          setShowCharacterEditor(open);
          if (!open) {
            setEditingCharacter(null);
          }
        }}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">
                {editingCharacter ? `Edit Character: ${editingCharacter.name}` : 'Create New Character'}
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[80vh]">
              <CharacterEditor
                character={editingCharacter}
                isEditing={!!editingCharacter}
                onSuccess={() => {
                  setShowCharacterEditor(false);
                  setEditingCharacter(null);
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
                  toast({ title: "Success", description: "Character saved successfully!" });
                }}
                onCancel={() => {
                  setShowCharacterEditor(false);
                  setEditingCharacter(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
