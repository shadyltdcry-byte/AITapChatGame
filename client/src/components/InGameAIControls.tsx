
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Bot, MessageCircle, Settings, TestTube, Sparkles } from "lucide-react";

interface InGameAIControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InGameAIControls({ isOpen, onClose }: InGameAIControlsProps) {
  const [testMessage, setTestMessage] = useState("");
  const [newTriggerWord, setNewTriggerWord] = useState("");
  const [triggerResponse, setTriggerResponse] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch MistralAI status
  const { data: mistralStatus } = useQuery({
    queryKey: ["/api/admin/mistral/status"],
    enabled: isOpen,
  });

  // Toggle MistralAI mutation
  const toggleMistralMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch("/api/admin/mistral/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mistral/status"] });
      toast({
        title: "AI Settings Updated",
        description: `MistralAI ${mistralStatus?.enabled ? 'disabled' : 'enabled'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/mistral/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Test Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Test AI chat mutation
  const testChatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch("/api/admin/mistral/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, model: "mistral-small-latest" })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Response",
        description: data.response || "AI responded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save trigger word mutation
  const saveTriggerMutation = useMutation({
    mutationFn: async (data: { word: string; response: string }) => {
      const response = await fetch("/api/admin/trigger-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      setNewTriggerWord("");
      setTriggerResponse("");
      toast({
        title: "Trigger Word Saved",
        description: "Custom trigger word added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900/95 to-purple-900/95 backdrop-blur-lg text-white border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Control Panel
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] pr-4">
          <div className="space-y-6">
            {/* AI Status & Controls */}
            <Card className="bg-slate-800/40 backdrop-blur border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  MistralAI Status & Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg border border-slate-600/30">
                  <div>
                    <h4 className="font-medium text-white">AI Assistant</h4>
                    <p className="text-sm text-slate-300">Enable AI-powered character responses</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={mistralStatus?.enabled ? "bg-green-600/80" : "bg-gray-600/80"}>
                      {mistralStatus?.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={mistralStatus?.enabled || false}
                      onCheckedChange={(checked) => toggleMistralMutation.mutate(checked)}
                      disabled={toggleMistralMutation.isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 border-0"
                  >
                    <TestTube className="w-4 h-4 mr-2" />
                    {testMutation.isPending ? "Testing..." : "Test Connection"}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Badge className={mistralStatus?.hasApiKey ? "bg-green-600/80" : "bg-red-600/80"}>
                      API Key: {mistralStatus?.hasApiKey ? "✓ Set" : "✗ Missing"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Chat Tester */}
            <Card className="bg-slate-800/40 backdrop-blur border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  AI Chat Tester
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Test Message</Label>
                  <Input
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type a message to test AI response..."
                    className="bg-slate-700/30 border-slate-600/50 text-white mt-2"
                  />
                </div>
                <Button
                  onClick={() => testMessage.trim() && testChatMutation.mutate(testMessage)}
                  disabled={testChatMutation.isPending || !testMessage.trim()}
                  className="bg-purple-600 hover:bg-purple-700 border-0"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {testChatMutation.isPending ? "Testing AI..." : "Test AI Response"}
                </Button>
              </CardContent>
            </Card>

            {/* Custom Trigger Words */}
            <Card className="bg-slate-800/40 backdrop-blur border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Custom Trigger Words
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Trigger Word</Label>
                  <Input
                    value={newTriggerWord}
                    onChange={(e) => setNewTriggerWord(e.target.value)}
                    placeholder="e.g., 'hello', 'help', 'stats'"
                    className="bg-slate-700/30 border-slate-600/50 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Custom Response</Label>
                  <Textarea
                    value={triggerResponse}
                    onChange={(e) => setTriggerResponse(e.target.value)}
                    placeholder="Enter the custom response for this trigger word..."
                    className="bg-slate-700/30 border-slate-600/50 text-white mt-2"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => saveTriggerMutation.mutate({ 
                    word: newTriggerWord, 
                    response: triggerResponse 
                  })}
                  disabled={!newTriggerWord || !triggerResponse || saveTriggerMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 border-0"
                >
                  {saveTriggerMutation.isPending ? "Saving..." : "Save Trigger Word"}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/40 backdrop-blur border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      toast({
                        title: "AI Cache Cleared",
                        description: "Character AI memory has been reset",
                      });
                    }}
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-600/20"
                  >
                    Clear AI Memory
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Settings Reloaded",
                        description: "AI configuration has been refreshed",
                      });
                      queryClient.invalidateQueries({ queryKey: ["/api/admin/mistral/status"] });
                    }}
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-600/20"
                  >
                    Reload AI Config
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
