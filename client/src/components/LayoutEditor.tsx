
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Palette, Type, Layout, Image, Settings } from "lucide-react";

interface LayoutEditorProps {
  onClose: () => void;
}

export default function LayoutEditor({ onClose }: LayoutEditorProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Colors
    primaryColor: "#ff6b9d",
    secondaryColor: "#c44569", 
    backgroundColor: "#1a1a2e",
    textColor: "#ffffff",
    accentColor: "#4ecdc4",
    
    // Typography
    fontFamily: "Inter",
    headerFontSize: "24px",
    bodyFontSize: "16px",
    fontWeight: "normal",
    
    // Layout
    borderRadius: "12px",
    cardPadding: "20px",
    buttonPadding: "12px 24px",
    spacing: "16px",
    
    // Icons & Text
    siteTitle: "ClassikLust",
    siteLogo: "",
    tapButtonText: "TAP",
    energyLabel: "Energy",
    pointsLabel: "Lust Points",
    levelLabel: "Level",
    
    // Character Display
    characterImageSize: "300px",
    characterBorderRadius: "15px",
    showCharacterBorder: true,
    
    // UI Elements
    showParticleEffects: true,
    showAnimations: true,
    showTooltips: true,
    darkMode: true,
  });

  const applySettings = () => {
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.primaryColor);
    root.style.setProperty('--secondary-color', settings.secondaryColor);
    root.style.setProperty('--background-color', settings.backgroundColor);
    root.style.setProperty('--text-color', settings.textColor);
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--font-family', settings.fontFamily);
    root.style.setProperty('--header-font-size', settings.headerFontSize);
    root.style.setProperty('--body-font-size', settings.bodyFontSize);
    root.style.setProperty('--font-weight', settings.fontWeight);
    root.style.setProperty('--border-radius', settings.borderRadius);
    root.style.setProperty('--card-padding', settings.cardPadding);
    root.style.setProperty('--button-padding', settings.buttonPadding);
    root.style.setProperty('--spacing', settings.spacing);
    root.style.setProperty('--character-image-size', settings.characterImageSize);
    root.style.setProperty('--character-border-radius', settings.characterBorderRadius);
    
    // Update text content
    const titleElements = document.querySelectorAll('[data-site-title]');
    titleElements.forEach(el => el.textContent = settings.siteTitle);
    
    const tapButtons = document.querySelectorAll('[data-tap-button]');
    tapButtons.forEach(el => el.textContent = settings.tapButtonText);
    
    toast({ title: "Success", description: "Layout settings applied!" });
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/admin/layout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        toast({ title: "Success", description: "Layout settings saved!" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  };

  const resetToDefaults = () => {
    setSettings({
      primaryColor: "#ff6b9d",
      secondaryColor: "#c44569", 
      backgroundColor: "#1a1a2e",
      textColor: "#ffffff",
      accentColor: "#4ecdc4",
      fontFamily: "Inter",
      headerFontSize: "24px",
      bodyFontSize: "16px",
      fontWeight: "normal",
      borderRadius: "12px",
      cardPadding: "20px",
      buttonPadding: "12px 24px",
      spacing: "16px",
      siteTitle: "ClassikLust",
      siteLogo: "",
      tapButtonText: "TAP",
      energyLabel: "Energy",
      pointsLabel: "Lust Points",
      levelLabel: "Level",
      characterImageSize: "300px",
      characterBorderRadius: "15px",
      showCharacterBorder: true,
      showParticleEffects: true,
      showAnimations: true,
      showTooltips: true,
      darkMode: true,
    });
    toast({ title: "Reset", description: "Settings reset to defaults" });
  };

  return (
    <div className="space-y-6 text-white">
      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-black/20">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">🎨 Color Scheme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="h-12 bg-black/30 border-white/20"
                  />
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <Input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    className="h-12 bg-black/30 border-white/20"
                  />
                </div>
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                    className="h-12 bg-black/30 border-white/20"
                  />
                </div>
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                    className="h-12 bg-black/30 border-white/20"
                  />
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <Input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
                    className="h-12 bg-black/30 border-white/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">✏️ Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Family</Label>
                  <select 
                    value={settings.fontFamily}
                    onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                    className="w-full p-2 bg-black/30 border border-white/20 rounded text-white"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>
                <div>
                  <Label>Font Weight</Label>
                  <select 
                    value={settings.fontWeight}
                    onChange={(e) => setSettings({...settings, fontWeight: e.target.value})}
                    className="w-full p-2 bg-black/30 border border-white/20 rounded text-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                  </select>
                </div>
                <div>
                  <Label>Header Font Size</Label>
                  <Input
                    value={settings.headerFontSize}
                    onChange={(e) => setSettings({...settings, headerFontSize: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="24px"
                  />
                </div>
                <div>
                  <Label>Body Font Size</Label>
                  <Input
                    value={settings.bodyFontSize}
                    onChange={(e) => setSettings({...settings, bodyFontSize: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="16px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">📐 Layout & Spacing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Border Radius</Label>
                  <Input
                    value={settings.borderRadius}
                    onChange={(e) => setSettings({...settings, borderRadius: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="12px"
                  />
                </div>
                <div>
                  <Label>Card Padding</Label>
                  <Input
                    value={settings.cardPadding}
                    onChange={(e) => setSettings({...settings, cardPadding: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="20px"
                  />
                </div>
                <div>
                  <Label>Button Padding</Label>
                  <Input
                    value={settings.buttonPadding}
                    onChange={(e) => setSettings({...settings, buttonPadding: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="12px 24px"
                  />
                </div>
                <div>
                  <Label>General Spacing</Label>
                  <Input
                    value={settings.spacing}
                    onChange={(e) => setSettings({...settings, spacing: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="16px"
                  />
                </div>
                <div>
                  <Label>Character Image Size</Label>
                  <Input
                    value={settings.characterImageSize}
                    onChange={(e) => setSettings({...settings, characterImageSize: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="300px"
                  />
                </div>
                <div>
                  <Label>Character Border Radius</Label>
                  <Input
                    value={settings.characterBorderRadius}
                    onChange={(e) => setSettings({...settings, characterBorderRadius: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="15px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">📝 Text Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Site Title</Label>
                  <Input
                    value={settings.siteTitle}
                    onChange={(e) => setSettings({...settings, siteTitle: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="ClassikLust"
                  />
                </div>
                <div>
                  <Label>Tap Button Text</Label>
                  <Input
                    value={settings.tapButtonText}
                    onChange={(e) => setSettings({...settings, tapButtonText: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="TAP"
                  />
                </div>
                <div>
                  <Label>Energy Label</Label>
                  <Input
                    value={settings.energyLabel}
                    onChange={(e) => setSettings({...settings, energyLabel: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="Energy"
                  />
                </div>
                <div>
                  <Label>Points Label</Label>
                  <Input
                    value={settings.pointsLabel}
                    onChange={(e) => setSettings({...settings, pointsLabel: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="Lust Points"
                  />
                </div>
                <div>
                  <Label>Level Label</Label>
                  <Input
                    value={settings.levelLabel}
                    onChange={(e) => setSettings({...settings, levelLabel: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="Level"
                  />
                </div>
                <div>
                  <Label>Site Logo URL</Label>
                  <Input
                    value={settings.siteLogo}
                    onChange={(e) => setSettings({...settings, siteLogo: e.target.value})}
                    className="bg-black/30 border-white/20 text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card className="bg-black/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white">⚙️ UI Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Show Particle Effects</Label>
                  <input
                    type="checkbox"
                    checked={settings.showParticleEffects}
                    onChange={(e) => setSettings({...settings, showParticleEffects: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Animations</Label>
                  <input
                    type="checkbox"
                    checked={settings.showAnimations}
                    onChange={(e) => setSettings({...settings, showAnimations: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Tooltips</Label>
                  <input
                    type="checkbox"
                    checked={settings.showTooltips}
                    onChange={(e) => setSettings({...settings, showTooltips: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Character Border</Label>
                  <input
                    type="checkbox"
                    checked={settings.showCharacterBorder}
                    onChange={(e) => setSettings({...settings, showCharacterBorder: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Dark Mode</Label>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => setSettings({...settings, darkMode: e.target.checked})}
                    className="w-5 h-5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4 pt-6 border-t border-white/20">
        <Button onClick={applySettings} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Apply Settings
        </Button>
        <Button onClick={saveSettings} className="flex-1 bg-green-600 hover:bg-green-700">
          Save Settings
        </Button>
        <Button onClick={resetToDefaults} variant="outline" className="flex-1 border-gray-600 text-white hover:bg-white/10">
          Reset Defaults
        </Button>
      </div>
    </div>
  );
}
