
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Sparkles, MessageCircle, Bug, TestTube } from "lucide-react";

export default function MistralControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch MistralAI status
  const { data: mistralStatus, isLoading } = useQuery({
    queryKey: ["/api/admin/mistral/status"],
    refetchInterval: 5000
  });

  // Toggle MistralAI mutation
  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch("/api/admin/mistral/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mistral/status"] });
      toast({ 
        title: "MistralAI " + (data.enabled ? "Enabled" : "Disabled"),
        description: data.enabled ? "AI assistance is now active" : "AI assistance has been disabled"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Toggle Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/mistral/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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

  const handleToggle = (enabled: boolean) => {
    toggleMutation.mutate(enabled);
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Section */}
      <div className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg border border-slate-600/30">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-400" />
          <div>
            <Label className="text-white font-medium">MistralAI Status</Label>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                className={
                  mistralStatus?.enabled 
                    ? "bg-green-600/80 border-green-500/50" 
                    : "bg-gray-600/80 border-gray-500/50"
                }
              >
                {mistralStatus?.enabled ? "Active" : "Inactive"}
              </Badge>
              <Badge 
                variant="outline"
                className={
                  mistralStatus?.hasApiKey 
                    ? "border-green-500/50 text-green-300" 
                    : "border-red-500/50 text-red-300"
                }
              >
                {mistralStatus?.hasApiKey ? "API Key Set" : "No API Key"}
              </Badge>
            </div>
          </div>
        </div>
        <Switch
          checked={mistralStatus?.enabled || false}
          onCheckedChange={handleToggle}
          disabled={!mistralStatus?.hasApiKey || toggleMutation.isPending}
        />
      </div>

      <Separator className="bg-slate-600/30" />

      {/* Features Section */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Available Features</Label>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-700/10 rounded">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300 text-sm">Debug Assistant</span>
            </div>
            <Badge variant="outline" className="border-blue-400/50 text-blue-300 text-xs">
              Active
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-slate-700/10 rounded">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 text-sm">Chat Backup</span>
            </div>
            <Badge variant="outline" className="border-purple-400/50 text-purple-300 text-xs">
              {mistralStatus?.enabled ? "Active" : "Fallback Only"}
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="bg-slate-600/30" />

      {/* Actions Section */}
      <div className="space-y-2">
        <Button
          onClick={handleTest}
          disabled={!mistralStatus?.hasApiKey || testMutation.isPending}
          variant="outline"
          className="w-full border-slate-500/50 text-slate-300 hover:bg-slate-600/50"
        >
          <TestTube className="w-4 h-4 mr-2" />
          {testMutation.isPending ? "Testing..." : "Test Connection"}
        </Button>

        {!mistralStatus?.hasApiKey && (
          <div className="p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
            <p className="text-amber-300 text-sm">
              <strong>Setup Required:</strong> Add MISTRAL_API_KEY to your environment variables to enable AI features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
