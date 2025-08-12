
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Upload, Eye, EyeOff, Crown, Star, Gift, Zap, Bot, Heart, MessageCircle, Image, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { Character, MediaFile } from "@shared/schema";

export interface CharacterCreationProps {
  characterId?: string;
  onCharacterCreated?: (characterId: string) => void;
}

export default function CharacterCreation({ characterId, onCharacterCreated }: CharacterCreationProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    bio: "",
    imageUrl: "",
    requiredLevel: 1,

    // Extended Info
    backstory: "",
    interests: "",
    quirks: "",

    // Personality & AI
    personality: "friendly" as const,
    chatStyle: "casual" as const,
    aiPersonality: {
      creativity: 75,
      formality: 25,
      playfulness: 50,
      empathy: 80,
      intelligence: 70,
      humor: 60,
      flirtiness: 30,
      supportiveness: 85
    },
    customPrompt: "",
    responseStyle: "balanced",
    memoryLevel: "medium",

    // Toggles
    isNsfw: false,
    isVip: false,
    isEvent: false,
    isWheelReward: false,
  });

  // Fetch character data if editing
  const { data: existingCharacter, isLoading: isLoadingCharacter } = useQuery<Character>({
    queryKey: ['/api/characters', characterId],
    enabled: !!characterId,
  });

  // Fetch media files for character
  const { data: mediaFiles = [] } = useQuery<MediaFile[]>({
    queryKey: ['/api/media/files', characterId],
    enabled: !!characterId,
  });

  // Load existing character data
  useEffect(() => {
    if (existingCharacter) {
      setFormData({
        name: existingCharacter.name,
        bio: existingCharacter.bio || "",
        imageUrl: existingCharacter.imageUrl || "",
        requiredLevel: existingCharacter.requiredLevel,
        backstory: existingCharacter.backstory || "",
        interests: existingCharacter.interests || "",
        quirks: existingCharacter.quirks || "",
        personality: existingCharacter.personality,
        chatStyle: existingCharacter.chatStyle,
        aiPersonality: {
          creativity: 75,
          formality: existingCharacter.chatStyle === "formal" ? 90 : 25,
          playfulness: existingCharacter.personality === "playful" ? 90 : 50,
          empathy: existingCharacter.personality === "friendly" ? 85 : 60,
          intelligence: 70,
          humor: existingCharacter.personality === "playful" ? 85 : 60,
          flirtiness: existingCharacter.chatStyle === "flirty" ? 80 : 30,
          supportiveness: 85
        },
        customPrompt: "",
        responseStyle: "balanced",
        memoryLevel: "medium",
        isNsfw: existingCharacter.isNsfw,
        isVip: existingCharacter.isVip,
        isEvent: existingCharacter.isEvent,
        isWheelReward: existingCharacter.isWheelReward,
      });
      setImagePreview(existingCharacter.imageUrl || "");
    }
  }, [existingCharacter]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (characterId) {
        return apiRequest('PUT', `/api/characters/${characterId}`, data);
      } else {
        return apiRequest('POST', '/api/characters/create', data);
      }
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/characters'] });
      toast({
        title: characterId ? "Character Updated!" : "Character Created!",
        description: `${formData.name} has been ${characterId ? 'updated' : 'created'} successfully.`,
      });
      
      if (onCharacterCreated) {
        onCharacterCreated(response.id || characterId);
      } else {
        setLocation('/admin');
      }
    },
    onError: (error: any) => {
      toast({
        title: characterId ? "Update Failed" : "Creation Failed",
        description: error.message || `Failed to ${characterId ? 'update' : 'create'} character.`,
        variant: "destructive",
      });
    },
  });

  // Test AI response mutation
  const testAIMutation = useMutation({
    mutationFn: (testMessage: string) => 
      apiRequest('POST', '/api/characters/test-ai', {
        characterData: formData,
        testMessage
      }),
    onSuccess: (response) => {
      toast({
        title: "AI Test Response",
        description: response.response,
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('aiPersonality.')) {
      const trait = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        aiPersonality: {
          ...prev.aiPersonality,
          [trait]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (field === 'imageUrl') {
      setImagePreview(value as string);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('settings', JSON.stringify({
          characterId: characterId,
          isNsfw: formData.isNsfw,
          isVip: formData.isVip,
          isEvent: formData.isEvent,
          isWheelReward: formData.isWheelReward,
          requiredLevel: formData.requiredLevel
        }));

        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        
        const result = await response.json();
        if (i === 0) {
          // Set first uploaded image as character image
          handleInputChange('imageUrl', result.url);
        }
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: "Upload Complete!",
        description: `Successfully uploaded ${files.length} file(s).`
      });

      if (characterId) {
        queryClient.invalidateQueries({ queryKey: ['/api/media/files', characterId] });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDriveUpload = async (driveUrl: string) => {
    if (!driveUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid drive URL.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/media/upload-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: driveUrl,
          settings: {
            characterId: characterId,
            isNsfw: formData.isNsfw,
            isVip: formData.isVip,
            isEvent: formData.isEvent,
            isWheelReward: formData.isWheelReward,
            requiredLevel: formData.requiredLevel
          }
        })
      });

      if (!response.ok) throw new Error('Drive upload failed');
      
      const result = await response.json();
      handleInputChange('imageUrl', result.url);
      
      toast({
        title: "Drive Upload Complete!",
        description: "File successfully imported from drive."
      });

      if (characterId) {
        queryClient.invalidateQueries({ queryKey: ['/api/media/files', characterId] });
      }
    } catch (error: any) {
      toast({
        title: "Drive Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Character name is required.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.bio.trim()) {
      toast({
        title: "Validation Error", 
        description: "Character bio is required.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  const handleGoBack = () => {
    setLocation('/admin');
  };

  const personalityOptions = [
    { value: "friendly", label: "Friendly & Outgoing", desc: "Warm and welcoming personality" },
    { value: "shy", label: "Shy & Reserved", desc: "Gentle and introverted nature" },
    { value: "playful", label: "Playful & Teasing", desc: "Fun-loving and mischievous" },
    { value: "serious", label: "Serious & Professional", desc: "Mature and focused approach" },
    { value: "mysterious", label: "Mysterious & Enigmatic", desc: "Intriguing and secretive" },
  ];

  const chatStyleOptions = [
    { value: "casual", label: "Casual & Relaxed", desc: "Easy-going conversation style" },
    { value: "formal", label: "Formal & Polite", desc: "Professional and respectful tone" },
    { value: "flirty", label: "Flirty & Romantic", desc: "Charming and affectionate" },
    { value: "energetic", label: "Energetic & Enthusiastic", desc: "High-energy and excited" },
    { value: "wise", label: "Wise & Thoughtful", desc: "Deep and contemplative responses" },
  ];

  const responseStyleOptions = [
    { value: "short", label: "Short & Concise", desc: "Brief, to-the-point responses" },
    { value: "balanced", label: "Balanced Length", desc: "Moderate response length" },
    { value: "detailed", label: "Detailed & Rich", desc: "Comprehensive, descriptive responses" },
  ];

  if (isLoadingCharacter && characterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-secondary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading character...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-dark-900 to-primary-800 text-white">
      <div className="container mx-auto max-w-6xl p-6">
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
            <h1 className="text-3xl font-bold gradient-text">
              {characterId ? `Edit ${existingCharacter?.name || 'Character'}` : 'Create New Character'}
            </h1>
            <p className="text-gray-300">
              {characterId ? 'Update character details and AI personality' : 'Design your perfect anime companion with advanced AI'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="personality">Personality</TabsTrigger>
                  <TabsTrigger value="ai">AI Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <Card className="bg-dark-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-xl">Character Information</CardTitle>
                      <CardDescription>Core character details and appearance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Character Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter character name..."
                            className="bg-dark-900 border-gray-600"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="requiredLevel">Required Level to Unlock</Label>
                          <Input
                            id="requiredLevel"
                            type="number"
                            min="1"
                            max="100"
                            value={formData.requiredLevel}
                            onChange={(e) => handleInputChange('requiredLevel', parseInt(e.target.value))}
                            className="bg-dark-900 border-gray-600"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bio">Character Bio *</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          placeholder="Describe your character's background and personality..."
                          className="bg-dark-900 border-gray-600 min-h-[100px]"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="backstory">Detailed Backstory</Label>
                        <Textarea
                          id="backstory"
                          value={formData.backstory}
                          onChange={(e) => handleInputChange('backstory', e.target.value)}
                          placeholder="Add detailed backstory for richer AI conversations..."
                          className="bg-dark-900 border-gray-600 min-h-[120px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="interests">Interests & Hobbies</Label>
                          <Input
                            id="interests"
                            value={formData.interests}
                            onChange={(e) => handleInputChange('interests', e.target.value)}
                            placeholder="Music, art, cooking, reading..."
                            className="bg-dark-900 border-gray-600"
                          />
                        </div>

                        <div>
                          <Label htmlFor="quirks">Unique Quirks</Label>
                          <Input
                            id="quirks"
                            value={formData.quirks}
                            onChange={(e) => handleInputChange('quirks', e.target.value)}
                            placeholder="Cute mannerisms, speech patterns..."
                            className="bg-dark-900 border-gray-600"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="personality" className="space-y-6">
                  <Card className="bg-dark-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-xl">Personality & Behavior</CardTitle>
                      <CardDescription>Define how your character interacts and responds</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label>Base Personality Type</Label>
                          <Select 
                            value={formData.personality}
                            onValueChange={(value) => handleInputChange('personality', value)}
                          >
                            <SelectTrigger className="bg-dark-900 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {personalityOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-400">{option.desc}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Communication Style</Label>
                          <Select 
                            value={formData.chatStyle}
                            onValueChange={(value) => handleInputChange('chatStyle', value)}
                          >
                            <SelectTrigger className="bg-dark-900 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {chatStyleOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-400">{option.desc}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Feature Toggles */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                            <Label className="flex items-center text-red-400">
                              <Eye className="w-4 h-4 mr-2" />
                              NSFW Content
                            </Label>
                            <Switch
                              checked={formData.isNsfw}
                              onCheckedChange={(checked) => handleInputChange('isNsfw', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                            <Label className="flex items-center text-yellow-400">
                              <Crown className="w-4 h-4 mr-2" />
                              VIP Exclusive
                            </Label>
                            <Switch
                              checked={formData.isVip}
                              onCheckedChange={(checked) => handleInputChange('isVip', checked)}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                            <Label className="flex items-center text-purple-400">
                              <Star className="w-4 h-4 mr-2" />
                              Event Character
                            </Label>
                            <Switch
                              checked={formData.isEvent}
                              onCheckedChange={(checked) => handleInputChange('isEvent', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg">
                            <Label className="flex items-center text-green-400">
                              <Gift className="w-4 h-4 mr-2" />
                              Wheel Reward
                            </Label>
                            <Switch
                              checked={formData.isWheelReward}
                              onCheckedChange={(checked) => handleInputChange('isWheelReward', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ai" className="space-y-6">
                  <Card className="bg-dark-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bot className="w-5 h-5 mr-2 text-blue-400" />
                        AI Personality Configuration
                      </CardTitle>
                      <CardDescription>Fine-tune AI responses and behavior patterns</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* AI Personality Sliders */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Creativity</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.creativity}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.creativity]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.creativity', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How creative and imaginative responses should be</p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Formality</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.formality}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.formality]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.formality', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How formal or casual the character speaks</p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Playfulness</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.playfulness}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.playfulness]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.playfulness', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How playful and teasing the character is</p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Empathy</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.empathy}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.empathy]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.empathy', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How emotionally supportive and understanding</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Intelligence</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.intelligence}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.intelligence]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.intelligence', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How knowledgeable and insightful</p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Humor</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.humor}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.humor]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.humor', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How funny and witty the character is</p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Flirtiness</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.flirtiness}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.flirtiness]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.flirtiness', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How flirty and romantic responses are</p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <Label>Supportiveness</Label>
                              <span className="text-sm text-gray-400">{formData.aiPersonality.supportiveness}%</span>
                            </div>
                            <Slider
                              value={[formData.aiPersonality.supportiveness]}
                              onValueChange={([value]) => handleInputChange('aiPersonality.supportiveness', value)}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">How encouraging and helpful</p>
                          </div>
                        </div>
                      </div>

                      {/* Response Settings */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Response Style</Label>
                          <Select
                            value={formData.responseStyle}
                            onValueChange={(value) => handleInputChange('responseStyle', value)}
                          >
                            <SelectTrigger className="bg-dark-900 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {responseStyleOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-gray-400">{option.desc}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Memory Level</Label>
                          <Select
                            value={formData.memoryLevel}
                            onValueChange={(value) => handleInputChange('memoryLevel', value)}
                          >
                            <SelectTrigger className="bg-dark-900 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low - Recent messages only</SelectItem>
                              <SelectItem value="medium">Medium - Session context</SelectItem>
                              <SelectItem value="high">High - Long-term memory</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Custom AI Prompt */}
                      <div>
                        <Label htmlFor="customPrompt">Custom AI Prompt (Advanced)</Label>
                        <Textarea
                          id="customPrompt"
                          value={formData.customPrompt}
                          onChange={(e) => handleInputChange('customPrompt', e.target.value)}
                          placeholder="Override default AI prompt with custom instructions..."
                          className="bg-dark-900 border-gray-600 min-h-[80px]"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to use generated prompt based on personality settings
                        </p>
                      </div>

                      {/* Test AI Button */}
                      <div className="border-t border-gray-600 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => testAIMutation.mutate("Hi there! How are you doing today?")}
                          disabled={testAIMutation.isPending}
                          className="border-gray-600"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          {testAIMutation.isPending ? "Testing..." : "Test AI Response"}
                        </Button>
                        <p className="text-xs text-gray-500 mt-1">
                          Test how the character would respond with current settings
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <Card className="bg-dark-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle>Advanced Settings</CardTitle>
                      <CardDescription>Media assignments and other advanced options</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {characterId && mediaFiles.length > 0 && (
                        <div>
                          <Label>Assigned Media Files</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {mediaFiles.map(file => (
                              <div key={file.id} className="bg-dark-900/50 rounded-lg p-3">
                                <div className="flex items-center space-x-2">
                                  {file.fileType.startsWith('image/') ? 
                                    <Image className="w-4 h-4" /> : 
                                    <Video className="w-4 h-4" />
                                  }
                                  <span className="text-sm truncate">{file.originalName}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="imageUrl">Character Image URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="imageUrl"
                            value={formData.imageUrl}
                            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                            placeholder="https://example.com/image.jpg or Google Drive URL"
                            className="bg-dark-900 border-gray-600 flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (formData.imageUrl.includes('drive.google.com') || formData.imageUrl.includes('dropbox.com')) {
                                handleDriveUpload(formData.imageUrl);
                              } else {
                                setIsPreviewVisible(!isPreviewVisible);
                              }
                            }}
                            className="border-gray-600"
                          >
                            {formData.imageUrl.includes('drive.google.com') || formData.imageUrl.includes('dropbox.com') ? 
                              <Upload className="w-4 h-4" /> : 
                              (isPreviewVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />)
                            }
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Upload Local Files</Label>
                          <div className="mt-2">
                            <input
                              type="file"
                              id="file-upload"
                              multiple
                              accept="image/*,video/*"
                              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              disabled={isUploading}
                              className="w-full border-gray-600"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {isUploading ? `Uploading ${uploadProgress.toFixed(0)}%` : 'Upload Files'}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Import from Drive URL</Label>
                          <div className="mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const url = prompt("Enter Google Drive or Dropbox share URL:");
                                if (url) {
                                  handleInputChange('imageUrl', url);
                                  handleDriveUpload(url);
                                }
                              }}
                              className="w-full border-gray-600"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Import from Drive
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isUploading && (
                        <div className="w-full bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Preview & Stats */}
            <div className="space-y-6">
              <Card className="bg-dark-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle>Character Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPreviewVisible && imagePreview && (
                    <div className="relative rounded-lg overflow-hidden bg-dark-900/50">
                      <img
                        src={imagePreview}
                        alt="Character preview"
                        className="w-full h-64 object-cover"
                        onError={() => {
                          toast({
                            title: "Image Error",
                            description: "Failed to load image. Please check the URL.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span>{formData.name || "Unnamed Character"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Personality:</span>
                      <span className="capitalize">{formData.personality}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chat Style:</span>
                      <span className="capitalize">{formData.chatStyle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Required Level:</span>
                      <span>{formData.requiredLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-yellow-400">
                        {characterId ? "Editing" : "New Character"}
                      </span>
                    </div>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex flex-wrap gap-1">
                    {formData.isNsfw && (
                      <span className="px-2 py-1 text-xs bg-red-500 rounded">NSFW</span>
                    )}
                    {formData.isVip && (
                      <span className="px-2 py-1 text-xs bg-yellow-500 rounded">VIP</span>
                    )}
                    {formData.isEvent && (
                      <span className="px-2 py-1 text-xs bg-purple-500 rounded">Event</span>
                    )}
                    {formData.isWheelReward && (
                      <span className="px-2 py-1 text-xs bg-green-500 rounded">Wheel</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-800/50 border-gray-600">
                <CardHeader>
                  <CardTitle>AI Personality Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creativity:</span>
                    <div className="w-16 bg-dark-900 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${formData.aiPersonality.creativity}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Empathy:</span>
                    <div className="w-16 bg-dark-900 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${formData.aiPersonality.empathy}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Playfulness:</span>
                    <div className="w-16 bg-dark-900 rounded-full h-2">
                      <div 
                        className="bg-pink-500 h-2 rounded-full" 
                        style={{ width: `${formData.aiPersonality.playfulness}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intelligence:</span>
                    <div className="w-16 bg-dark-900 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${formData.aiPersonality.intelligence}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoBack}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-secondary-500 to-accent-500 hover:from-secondary-600 hover:to-accent-600"
            >
              {saveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                  {characterId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {characterId ? 'Update Character' : 'Create Character'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
