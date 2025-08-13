import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  progress: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl border-2 border-secondary-500 bg-dark-800 flex items-center justify-center">
          <span className="text-2xl">🎮</span>
        </div>
        
        <h1 className="text-4xl font-bold gradient-text mb-4">ClassikLust</h1>
        
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
