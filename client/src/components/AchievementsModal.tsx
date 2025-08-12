import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ListChecks } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: string;
  status: "locked" | "in_progress" | "completed" | "claimable";
  category: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  maxProgress: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit?: string;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Tap a character for the first time",
    progress: 1,
    maxProgress: 1,
    reward: "100 Lust Points",
    status: "completed",
    category: "Getting Started"
  },
  {
    id: "2",
    title: "Getting Started",
    description: "Reach level 5",
    progress: 3,
    maxProgress: 5,
    reward: "500 Lust Points, 10 Lust Gems",
    status: "in_progress",
    category: "Progression"
  },
  {
    id: "3",
    title: "Point Collector",
    description: "Accumulate 10,000 Lust Points",
    progress: 2430,
    maxProgress: 10000,
    reward: "Character Unlock",
    status: "in_progress",
    category: "Collection"
  },
  {
    id: "4",
    title: "VIP Member",
    description: "Purchase any VIP plan",
    progress: 0,
    maxProgress: 1,
    reward: "Exclusive Characters",
    status: "locked",
    category: "Premium"
  }
];

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Daily Login",
    description: "Log in to the game",
    reward: "50 Lust Points",
    progress: 1,
    maxProgress: 1,
    difficulty: "easy",
    timeLimit: "Resets in 18h"
  },
  {
    id: "2",
    title: "Tap Master",
    description: "Tap characters 100 times",
    reward: "200 Lust Points",
    progress: 45,
    maxProgress: 100,
    difficulty: "medium"
  },
  {
    id: "3",
    title: "Spin the Wheel",
    description: "Use the daily wheel",
    reward: "Random Reward",
    progress: 1,
    maxProgress: 1,
    difficulty: "easy",
    timeLimit: "Daily"
  },
  {
    id: "4",
    title: "Chat Champion",
    description: "Send 20 messages in chat",
    reward: "500 Lust Points",
    progress: 3,
    maxProgress: 20,
    difficulty: "hard"
  }
];

export default function AchievementsModal({ isOpen, onClose, userId }: AchievementsModalProps) {
  const [activeTab, setActiveTab] = useState<"all" | "progress" | "completed">("all");
  const [viewMode, setViewMode] = useState<"achievements" | "tasks">("achievements");

  const achievements = MOCK_ACHIEVEMENTS;
  const tasks = MOCK_TASKS;

  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === "all") return true;
    if (activeTab === "progress") return achievement.status === "in_progress";
    if (activeTab === "completed") return achievement.status === "completed" || achievement.status === "claimable";
    return true;
  });

  const completedCount = achievements.filter(a => a.status === "completed").length;
  const claimableCount = achievements.filter(a => a.status === "claimable").length;
  const totalCount = achievements.length;
  const overallProgress = (completedCount / totalCount) * 100;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-400";
      case "claimable": return "text-yellow-400";
      case "in_progress": return "text-blue-400";
      default: return "text-gray-400";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-600";
      case "medium": return "bg-yellow-600";
      case "hard": return "bg-red-600";
      default: return "bg-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white border-none max-w-md p-0 rounded-3xl overflow-hidden h-[700px] flex flex-col">
        {/* Header with DialogTitle and DialogDescription */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">🏆 Progress</h2>
            <Button
              onClick={onClose}
              variant="ghost"
              className="text-white hover:bg-white/20 p-1 h-8 w-8 rounded-full"
              data-testid="button-close-achievements"
            >
              ✕
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex space-x-2 mb-4">
            <Button
              onClick={() => setViewMode("achievements")}
              className={`flex-1 ${viewMode === "achievements" ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              🏆 Achievements
            </Button>
            <Button
              onClick={() => setViewMode("tasks")}
              className={`flex-1 ${viewMode === "tasks" ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              📋 Daily Tasks
            </Button>
          </div>
        </div>

        {viewMode === "achievements" ? (
          <>
            {/* Progress Overview */}
            <div className="px-6 mb-4">
              <div className="bg-black/30 rounded-xl p-4">
                <h3 className="text-lg font-bold mb-3">Your Progress</h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{completedCount}</div>
                    <div className="text-xs text-white/70">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{claimableCount}</div>
                    <div className="text-xs text-white/70">Claimable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalCount}</div>
                    <div className="text-xs text-white/70">Total</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(overallProgress)}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3 bg-gray-700" />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 mb-4">
              <div className="flex space-x-2">
                <Button
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-2 rounded-full text-sm ${
                    activeTab === "all" ? 'bg-purple-600' : 'bg-gray-700'
                  }`}
                >
                  All
                </Button>
                <Button
                  onClick={() => setActiveTab("progress")}
                  className={`px-6 py-2 rounded-full text-sm ${
                    activeTab === "progress" ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  In Progress
                </Button>
                <Button
                  onClick={() => setActiveTab("completed")}
                  className={`px-6 py-2 rounded-full text-sm ${
                    activeTab === "completed" ? 'bg-green-600' : 'bg-gray-700'
                  }`}
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Achievements List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-3">
                {filteredAchievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`bg-black/20 rounded-xl p-4 border-2 ${
                      achievement.status === "claimable" ? 'border-yellow-400/50' :
                      achievement.status === "completed" ? 'border-green-400/50' :
                      achievement.status === "in_progress" ? 'border-blue-400/50' :
                      'border-gray-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">🎯</span>
                          <h3 className="font-bold text-white">{achievement.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            achievement.status === "in_progress" ? 'bg-purple-600/50' :
                            achievement.status === "completed" ? 'bg-green-600/50' :
                            'bg-gray-600/50'
                          }`}>
                            {achievement.status === "in_progress" ? "progression" : achievement.status}
                          </span>
                        </div>

                        <p className="text-sm text-white/80 mb-2">{achievement.description}</p>

                        {/* Progress Bar */}
                        <div className="space-y-1 mb-2">
                          <div className="flex justify-between text-xs text-white/70">
                            <span>Progress</span>
                            <span>{formatNumber(achievement.progress)}/{formatNumber(achievement.maxProgress)}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.maxProgress) * 100} 
                            className="h-2 bg-gray-700"
                          />
                        </div>

                        {/* Reward */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm">
                            <span>🎁</span>
                            <span className="text-yellow-400 font-medium">{achievement.reward}</span>
                          </div>

                          {achievement.status === "claimable" && (
                            <Button
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/achievements/claim/${achievement.id}`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId })
                                  });
                                  
                                  if (response.ok) {
                                    // Show success message without page reload
                                    console.log('Achievement claimed successfully');
                                    // Note: Achievement data will update when this modal is reopened
                                  } else {
                                    console.error('Failed to claim achievement');
                                  }
                                } catch (error) {
                                  console.error('Error claiming achievement:', error);
                                }
                              }}
                            >
                              Claim
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Tasks View */
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-black/20 rounded-xl p-4 border border-gray-500/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">📋</span>
                        <h3 className="font-bold text-white">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                      </div>

                      <p className="text-sm text-white/80 mb-2">{task.description}</p>

                      {task.timeLimit && (
                        <p className="text-xs text-orange-400 mb-2">⏰ {task.timeLimit}</p>
                      )}

                      {/* Progress */}
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-xs text-white/70">
                          <span>Progress</span>
                          <span>{task.progress}/{task.maxProgress}</span>
                        </div>
                        <Progress 
                          value={(task.progress / task.maxProgress) * 100} 
                          className="h-2 bg-gray-700"
                        />
                      </div>

                      {/* Reward */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm">
                          <span>🎁</span>
                          <span className="text-green-400 font-medium">{task.reward}</span>
                        </div>

                        {task.progress >= task.maxProgress && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/tasks/claim/${task.id}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ userId })
                                });
                                
                                if (response.ok) {
                                  // Show success message without page reload
                                  console.log('Task reward claimed successfully');
                                  // Note: Task data will update when this modal is reopened
                                } else {
                                  console.error('Failed to claim task reward');
                                }
                              } catch (error) {
                                console.error('Error claiming task:', error);
                              }
                            }}
                          >
                            Claim
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}