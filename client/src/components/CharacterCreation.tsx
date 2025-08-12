import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { insertCharacterSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { apiRequest } from "@/lib/queryClient";

// Extended character creation schema
const characterCreationSchema = insertCharacterSchema.extend({
  level: z.number().min(1).max(100).default(1),
  moodDistribution: z.object({
    normal: z.number().min(0).max(100).default(70),
    happy: z.number().min(0).max(100).default(20),
    flirty: z.number().min(0).max(100).default(10),
    playful: z.number().min(0).max(100).default(0),
    mysterious: z.number().min(0).max(100).default(0),
    shy: z.number().min(0).max(100).default(0),
  }).default({
    normal: 70,
    happy: 20,
    flirty: 10,
    playful: 0,
    mysterious: 0,
    shy: 0,
  }),
  customTriggerWords: z.array(z.string()).default([]),
  customGreetings: z.array(z.string()).default([]),
  customResponses: z.array(z.string()).default([]),
});

type CharacterCreationForm = z.infer<typeof characterCreationSchema>;

export default function CharacterCreation() {
  const [activeTab, setActiveTab] = useState("basic");
  const [customGreeting, setCustomGreeting] = useState("");
  const [customResponse, setCustomResponse] = useState("");
  const [triggerWord, setTriggerWord] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch media files for avatars
  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["/api/media"],
  });

  const form = useForm<CharacterCreationForm>({
    resolver: zodResolver(characterCreationSchema),
    defaultValues: {
      name: "",
      bio: "",
      backstory: "",
      interests: "",
      quirks: "",
      description: "",
      imageUrl: "",
      avatarUrl: "",
      personality: "friendly",
      personalityStyle: "Sweet & Caring",
      chatStyle: "casual",
      likes: "",
      dislikes: "",
      requiredLevel: 1,
      level: 1,
      responseTimeMin: 1,
      responseTimeMax: 3,
      responseTimeMs: 2000,
      pictureSendChance: 5,
      isNsfw: false,
      isVip: false,
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
      customGreetings: [],
      customResponses: [],
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: CharacterCreationForm) => {
      try {
        const response = await apiRequest("POST", "/api/characters", data);
        return await response.json();
      } catch (error) {
        console.error("Character creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Character created successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/characters"] });
      form.reset();
    },
    onError: (error: any) => {
      toast.error("Failed to create character: " + (error.message || "Unknown error"));
      console.error("Character creation error:", error);
    },
  });

  const onSubmit = (data: CharacterCreationForm) => {
    createCharacterMutation.mutate(data);
  };

  const addCustomGreeting = () => {
    if (customGreeting.trim()) {
      const currentGreetings = form.getValues("customGreetings") || [];
      form.setValue("customGreetings", [...currentGreetings, customGreeting.trim()]);
      setCustomGreeting("");
    }
  };

  const addCustomResponse = () => {
    if (customResponse.trim()) {
      const currentResponses = form.getValues("customResponses") || [];
      form.setValue("customResponses", [...currentResponses, customResponse.trim()]);
      setCustomResponse("");
    }
  };

  const addTriggerWord = () => {
    if (triggerWord.trim()) {
      const currentTriggers = form.getValues("customTriggerWords") || [];
      form.setValue("customTriggerWords", [...currentTriggers, triggerWord.trim()]);
      setTriggerWord("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Character</h1>
        <p className="text-gray-400">Design your perfect AI companion with detailed personality traits</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" data-testid="tab-basic">Basic Info</TabsTrigger>
              <TabsTrigger value="personality" data-testid="tab-personality">Personality</TabsTrigger>
              <TabsTrigger value="advanced" data-testid="tab-advanced">Advanced</TabsTrigger>
              <TabsTrigger value="custom" data-testid="tab-custom">Custom</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Character Information</CardTitle>
                  <CardDescription>
                    Essential details about your character
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Character Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter character name"
                              data-testid="input-character-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiredLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Level</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-required-level"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            value={field.value || ""} 
                            placeholder="Brief description of the character"
                            data-testid="textarea-bio"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field}
                            value={field.value || ""} 
                            placeholder="Detailed character description"
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Image</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-main-image">
                                <SelectValue placeholder="Select main image" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Select image</SelectItem>
                              {Array.isArray(mediaFiles) && mediaFiles.map((file: any) => (
                                <SelectItem key={file.id} value={file.url}>
                                  {file.originalName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar Image</FormLabel>
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-avatar">
                                <SelectValue placeholder="Select avatar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Select avatar</SelectItem>
                              {Array.isArray(mediaFiles) && mediaFiles.map((file: any) => (
                                <SelectItem key={file.id} value={file.url}>
                                  {file.originalName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personality Tab */}
            <TabsContent value="personality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personality Configuration</CardTitle>
                  <CardDescription>
                    Define mood distribution and personality traits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="personalityStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Personality Style</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-personality-style">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Sweet & Caring">Sweet & Caring</SelectItem>
                              <SelectItem value="Mysterious">Mysterious</SelectItem>
                              <SelectItem value="Playful">Playful</SelectItem>
                              <SelectItem value="Confident">Confident</SelectItem>
                              <SelectItem value="Shy">Shy</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chatStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chat Style</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-chat-style">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="formal">Formal</SelectItem>
                              <SelectItem value="flirty">Flirty</SelectItem>
                              <SelectItem value="mysterious">Mysterious</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Mood Distribution</h3>
                    {Object.entries(form.watch("moodDistribution") || {}).map(([mood, value]) => (
                      <FormField
                        key={mood}
                        control={form.control}
                        name={`moodDistribution.${mood}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="capitalize">{mood}</FormLabel>
                              <span className="text-sm text-gray-400">{value}%</span>
                            </div>
                            <FormControl>
                              <Slider
                                min={0}
                                max={100}
                                step={1}
                                value={[field.value]}
                                onValueChange={(values) => field.onChange(values[0])}
                                data-testid={`slider-mood-${mood}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="likes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Likes</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              value={field.value || ""} 
                              placeholder="Things the character likes"
                              data-testid="textarea-likes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dislikes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dislikes</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              value={field.value || ""} 
                              placeholder="Things the character dislikes"
                              data-testid="textarea-dislikes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Fine-tune response behavior and special features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="responseTimeMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Response Time (s)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-response-time-min"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responseTimeMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Response Time (s)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-response-time-max"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pictureSendChance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Picture Send Chance (%)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="0"
                              max="100"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-picture-chance"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="randomPictureSending"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-random-pictures"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Random Picture Sending</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="isNsfw"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-nsfw"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>NSFW Content</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="isVip"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-vip"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>VIP Exclusive</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Responses Tab */}
            <TabsContent value="custom" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Responses & Triggers</CardTitle>
                  <CardDescription>
                    Add personalized greetings, responses, and trigger words
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-greeting">Custom Greetings</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="custom-greeting"
                          value={customGreeting}
                          onChange={(e) => setCustomGreeting(e.target.value)}
                          placeholder="Add a custom greeting"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomGreeting())}
                          data-testid="input-custom-greeting"
                        />
                        <Button 
                          type="button" 
                          onClick={addCustomGreeting}
                          variant="outline"
                          data-testid="button-add-greeting"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.watch("customGreetings")?.map((greeting, index) => (
                          <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                            {greeting}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="custom-response">Custom Responses</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="custom-response"
                          value={customResponse}
                          onChange={(e) => setCustomResponse(e.target.value)}
                          placeholder="Add a custom response"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomResponse())}
                          data-testid="input-custom-response"
                        />
                        <Button 
                          type="button" 
                          onClick={addCustomResponse}
                          variant="outline"
                          data-testid="button-add-response"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.watch("customResponses")?.map((response, index) => (
                          <span key={index} className="bg-green-600 text-white px-2 py-1 rounded text-sm">
                            {response}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="trigger-word">Trigger Words</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="trigger-word"
                          value={triggerWord}
                          onChange={(e) => setTriggerWord(e.target.value)}
                          placeholder="Add a trigger word"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTriggerWord())}
                          data-testid="input-trigger-word"
                        />
                        <Button 
                          type="button" 
                          onClick={addTriggerWord}
                          variant="outline"
                          data-testid="button-add-trigger"
                        >
                          Add
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.watch("customTriggerWords")?.map((word, index) => (
                          <span key={index} className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => form.reset()}
              data-testid="button-reset"
            >
              Reset Form
            </Button>
            <Button 
              type="submit" 
              disabled={createCharacterMutation.isPending}
              data-testid="button-create-character"
            >
              {createCharacterMutation.isPending ? "Creating..." : "Create Character"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}