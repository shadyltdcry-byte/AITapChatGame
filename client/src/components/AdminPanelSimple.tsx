import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, Settings } from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            ⚡ Admin Panel
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Game administration and management dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-blue-400/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5" />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-200">Manage user accounts and permissions</p>
                <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                  View Users
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 border-purple-400/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Gamepad2 className="w-5 h-5" />
                  Characters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-200">Create and manage game characters</p>
                <Button className="mt-4 w-full bg-purple-600 hover:bg-purple-700">
                  View Characters
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/20 to-red-600/30 border-red-400/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-200">Configure game settings and parameters</p>
                <Button className="mt-4 w-full bg-red-600 hover:bg-red-700">
                  View Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center text-slate-400">
            <p>Admin Panel is temporarily simplified during migration. Full functionality will be restored soon.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}