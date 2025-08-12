import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatMessage } from "@shared/schema";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  characterName: string;
  userId: string;
}

export default function ChatModal({ isOpen, onClose, characterId, characterName, userId }: ChatModalProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", userId, characterId],
    enabled: isOpen && characterId !== "",
  });

  // Get character info for avatar
  const { data: character } = useQuery({
    queryKey: ["/api/character", characterId],
    enabled: isOpen && characterId !== "",
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest("POST", "/api/chat/send", {
        userId,
        characterId,
        message: userMessage,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId, characterId] });
      setMessage("");
      
      // Show typing indicator for AI response
      setIsTyping(true);
      
      // Simulate AI response delay
      setTimeout(() => {
        setIsTyping(false);
        // Trigger another refresh to get AI response
        queryClient.invalidateQueries({ queryKey: ["/api/chat", userId, characterId] });
      }, 2000 + Math.random() * 2000); // 2-4 seconds
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message.trim());
  };

  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 text-white border-none max-w-sm p-0 rounded-3xl overflow-hidden h-[600px] flex flex-col">
        <DialogTitle className="sr-only">Chat with {characterName}</DialogTitle>
        <DialogDescription className="sr-only">Interactive chat conversation with {characterName}</DialogDescription>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-400">
              <img 
                src={character?.avatarUrl || character?.imageUrl || "/placeholder-avatar.jpg"} 
                alt={characterName}
                className="w-full h-full object-cover"
                data-testid="img-character-avatar"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-lg">💬 Chat with {characterName}</span>
              </div>
              <div className="text-xs text-green-400">Online</div>
            </div>
          </div>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white hover:bg-white/20 p-1 h-8 w-8 rounded-full"
            data-testid="button-close-chat"
          >
            ✕
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-white/70">Loading messages...</div>
          ) : (
            <>
              {messages.length === 0 ? (
                <div className="text-center text-white/70 py-8">
                  <div className="text-4xl mb-2">💭</div>
                  <div>Start a conversation with {characterName}!</div>
                  <div className="text-sm mt-2">Say hello or ask anything</div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start space-x-3 ${msg.isFromUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                      {msg.isFromUser ? (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                          👤
                        </div>
                      ) : (
                        <img 
                          src={character?.avatarUrl || character?.imageUrl || "/placeholder-avatar.jpg"} 
                          alt={characterName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    {/* Message */}
                    <div className={`max-w-[70%] ${msg.isFromUser ? 'text-right' : ''}`}>
                      <div 
                        className={`p-3 rounded-2xl ${
                          msg.isFromUser 
                            ? 'bg-pink-500 text-white rounded-br-md' 
                            : 'bg-gray-700 text-white rounded-bl-md'
                        }`}
                        data-testid={msg.isFromUser ? "text-user-message" : "text-character-message"}
                      >
                        {msg.message}
                      </div>
                      <div className={`text-xs text-white/50 mt-1 ${msg.isFromUser ? 'text-right' : ''}`}>
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
                    <img 
                      src={character?.avatarUrl || character?.imageUrl || "/placeholder-avatar.jpg"} 
                      alt={characterName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-gray-700 text-white p-3 rounded-2xl rounded-bl-md max-w-[70%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <div className="text-xs text-white/70 mt-1">{characterName} is typing...</div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/20 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-white/50 rounded-full px-4"
              disabled={sendMutation.isPending || isTyping}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || sendMutation.isPending || isTyping}
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-full px-6"
              data-testid="button-send-message"
            >
              {sendMutation.isPending ? "..." : "Send"}
            </Button>
          </form>
          
          {/* Quick Actions */}
          <div className="flex space-x-2 mt-3">
            <Button
              onClick={() => setMessage("Hey! 😊")}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full"
              disabled={sendMutation.isPending || isTyping}
            >
              👋 Hey!
            </Button>
            <Button
              onClick={() => setMessage("How are you?")}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full"
              disabled={sendMutation.isPending || isTyping}
            >
              😊 How are you?
            </Button>
            <Button
              onClick={() => setMessage("You look amazing! ❤️")}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-full"
              disabled={sendMutation.isPending || isTyping}
            >
              💕 Compliment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}