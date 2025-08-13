
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: any;
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: any;
        BackButton: any;
      };
    };
  }
}

interface TelegramAuthProps {
  onAuthSuccess: (user: any) => void;
}

export default function TelegramAuth({ onAuthSuccess }: TelegramAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramAvailable, setIsTelegramAvailable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running in Telegram WebApp
    if (window.Telegram?.WebApp) {
      setIsTelegramAvailable(true);
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Auto-authenticate if we have init data
      if (window.Telegram.WebApp.initData) {
        handleTelegramAuth();
      }
    }
  }, []);

  const handleTelegramAuth = async () => {
    setIsLoading(true);
    
    try {
      const initData = window.Telegram?.WebApp?.initData;
      
      if (!initData) {
        throw new Error("No Telegram data available");
      }

      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      const result = await response.json();

      if (result.success) {
        onAuthSuccess(result.user);
        toast({
          title: "Welcome!",
          description: `Logged in as ${result.user.username}`,
        });
      } else {
        throw new Error(result.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    
    try {
      // For development, create a mock user
      const mockUser = {
        id: "default-player",
        username: "Developer",
        level: 1,
        points: 1000,
        energy: 2000,
        maxEnergy: 2000,
        isAdmin: true
      };
      
      onAuthSuccess(mockUser);
      toast({
        title: "Development Mode",
        description: "Logged in as Developer",
      });
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Failed to login in development mode",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl gradient-text">ClassikLust</CardTitle>
          <CardDescription>
            {isTelegramAvailable 
              ? "Authenticate with your Telegram account" 
              : "Please open this app through Telegram"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTelegramAvailable ? (
            <Button 
              onClick={handleTelegramAuth} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Authenticating..." : "🚀 Login with Telegram"}
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                This app is designed to work within Telegram. For development purposes, you can use the button below.
              </p>
              <Button 
                onClick={handleDevLogin} 
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? "Logging in..." : "🔧 Development Login"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
