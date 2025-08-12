
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Bug, Sparkles, Copy } from "lucide-react";

interface MistralDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MistralDebugger({ isOpen, onClose }: MistralDebuggerProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [context, setContext] = useState("");
  const [assistance, setAssistance] = useState("");
  const { toast } = useToast();

  const debugMutation = useMutation({
    mutationFn: async (data: { code: string; error: string; context?: string }) => {
      const response = await apiRequest("/api/debug/assist", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAssistance(data.assistance);
      toast({ title: "Debug assistance received!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Debug failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleDebug = () => {
    if (!code.trim() || !error.trim()) {
      toast({ 
        title: "Missing information", 
        description: "Please provide both code and error details",
        variant: "destructive" 
      });
      return;
    }

    debugMutation.mutate({ code, error, context });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const clearForm = () => {
    setCode("");
    setError("");
    setContext("");
    setAssistance("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            MistralAI Debug Assistant
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Get AI-powered debugging help for your code issues
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Input Section */}
          <div className="space-y-4">
            <Card className="bg-slate-800/40 border-slate-600/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code & Error Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Problematic Code</Label>
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code that's causing issues..."
                    className="bg-slate-700/30 border-slate-600/50 text-white min-h-[120px] font-mono text-sm mt-2"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Error Message</Label>
                  <Textarea
                    value={error}
                    onChange={(e) => setError(e.target.value)}
                    placeholder="Paste the error message or describe the issue..."
                    className="bg-slate-700/30 border-slate-600/50 text-white min-h-[80px] mt-2"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Additional Context (Optional)</Label>
                  <Textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Any additional context about what you were trying to achieve..."
                    className="bg-slate-700/30 border-slate-600/50 text-white min-h-[60px] mt-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleDebug}
                    disabled={debugMutation.isPending || !code.trim() || !error.trim()}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 flex-1"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    {debugMutation.isPending ? "Analyzing..." : "Get Debug Help"}
                  </Button>
                  <Button onClick={clearForm} variant="outline" className="border-slate-600">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <Card className="bg-slate-800/40 border-slate-600/30 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    AI Assistance
                  </CardTitle>
                  {assistance && (
                    <Button
                      onClick={() => copyToClipboard(assistance)}
                      variant="outline"
                      size="sm"
                      className="border-slate-600"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {debugMutation.isPending ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                    <span className="ml-3 text-slate-300">Analyzing your code...</span>
                  </div>
                ) : assistance ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      <Badge className="bg-green-600/80 border-green-500/50">
                        Analysis Complete
                      </Badge>
                      <div className="whitespace-pre-wrap text-slate-200 bg-slate-900/40 p-4 rounded-lg border border-slate-600/30">
                        {assistance}
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-400">
                    <div className="text-center">
                      <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Enter your code and error details to get AI assistance</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
