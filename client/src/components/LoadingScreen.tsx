
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl border-2 border-pink-500 bg-gray-800 flex items-center justify-center">
          <span className="text-2xl">🎮</span>
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
          ClassikLust
        </h1>
        
        <div className="space-y-2 mb-6">
          <p className="text-gray-300 flex items-center justify-center gap-2">
            🚀 New Auto-Authentication
          </p>
          <p className="text-gray-300">
            Feature! Click /start in Telegram<br />
            for instant login!
          </p>
        </div>
        
        <div className="text-sm text-gray-400 mb-4">v2.0.0</div>
        
        <div className="w-64 mx-auto mb-4">
          <Progress value={progress} className="h-2" />
        </div>
        
        <p className="text-gray-400 text-sm">Loading user data...</p>
      </div>
    </div>
  );
}
