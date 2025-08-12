import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, MessageCircle, Save } from "lucide-react";

interface TriggerWordManagerProps {
  characterId?: string;
}

interface TriggerWord {
  id: string;
  word: string;
  response?: string;
  saveSnippet: boolean;
  characterId?: string;
  isGlobal: boolean;
}

export default function TriggerWordManager({ characterId }: TriggerWordManagerProps) {
  const [newWord, setNewWord] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [saveSnippet, setSaveSnippet] = useState(false);
  const { toast } = useToast();

  // Fetch existing trigger words
  const { data: triggerWords = [] } = useQuery<TriggerWord[]>({
    queryKey: ["/api/admin/trigger-words", characterId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/admin/trigger-words${characterId ? `?characterId=${characterId}` : ""}`);
      return response.json();
    }
  });

  // Create trigger word mutation
  const createTriggerMutation = useMutation({
    mutationFn: async (data: { word: string; response?: string; saveSnippet: boolean; characterId?: string }) => {
      const response = await apiRequest("POST", "/api/admin/trigger-words", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trigger-words"] });
      setNewWord("");
      setNewResponse("");
      setSaveSnippet(false);
      toast({
        title: "Trigger Word Created",
        description: "Successfully added new trigger word configuration.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create trigger word. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete trigger word mutation
  const deleteTriggerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/trigger-words/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trigger-words"] });
      toast({
        title: "Trigger Word Deleted",
        description: "Trigger word configuration removed successfully.",
      });
    }
  });

  const handleSubmit = () => {
    if (!newWord.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a trigger word.",
        variant: "destructive",
      });
      return;
    }

    if (!saveSnippet && !newResponse.trim()) {
      toast({
        title: "Missing Response",
        description: "Please provide a response or enable snippet saving.",
        variant: "destructive",
      });
      return;
    }

    createTriggerMutation.mutate({
      word: newWord.trim(),
      response: saveSnippet ? undefined : newResponse.trim(),
      saveSnippet,
      characterId
    });
  };

  return (
    <div className="space-y-6">
      {/* Create New Trigger Word */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Trigger Word
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trigger-word" className="text-slate-300">Trigger Word</Label>
            <Input
              id="trigger-word"
              placeholder="e.g., 'hello', 'love', 'kiss'..."
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div>
              <Label htmlFor="save-snippet" className="text-slate-300 font-medium">
                Save Conversation Snippet
              </Label>
              <p className="text-sm text-slate-400 mt-1">
                When triggered, save the conversation context for later reference
              </p>
            </div>
            <Switch
              id="save-snippet"
              checked={saveSnippet}
              onCheckedChange={setSaveSnippet}
            />
          </div>

          {!saveSnippet && (
            <div className="space-y-2">
              <Label htmlFor="response" className="text-slate-300">Custom Response</Label>
              <Textarea
                id="response"
                placeholder="Enter the response when this word is triggered..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                rows={3}
              />
            </div>
          )}

          <Button 
            onClick={handleSubmit}
            disabled={createTriggerMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {createTriggerMutation.isPending ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Trigger Word
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Trigger Words */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Configured Trigger Words
          </CardTitle>
        </CardHeader>
        <CardContent>
          {triggerWords.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No trigger words configured yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {triggerWords.map((trigger) => (
                <div 
                  key={trigger.id} 
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {trigger.word}
                      </Badge>
                      {trigger.saveSnippet && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          Saves Snippet
                        </Badge>
                      )}
                      {trigger.isGlobal && (
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          Global
                        </Badge>
                      )}
                    </div>
                    {trigger.response && (
                      <p className="text-sm text-slate-300 mt-1">
                        Response: "{trigger.response}"
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTriggerMutation.mutate(trigger.id)}
                    disabled={deleteTriggerMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}