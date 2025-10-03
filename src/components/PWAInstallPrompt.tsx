import { useState, useEffect } from "react";
import { X, Share, Plus, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInStandaloneMode(standalone);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    
    // Show prompt only if: iOS device, not in standalone mode, and not dismissed
    if (iOS && !standalone && !dismissed) {
      // Delay showing the prompt by 2 seconds for better UX
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || !isIOS || isInStandaloneMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <Card className="relative bg-card border-primary/20 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="p-6 pr-12">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Add Piinty to Home Screen</h3>
              <p className="text-sm text-muted-foreground">
                Install Piinty for quick access and a better experience!
              </p>
            </div>
          </div>

          <div className="space-y-3 ml-14">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Tap the Share button</span>
                <Share className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">(in Safari toolbar)</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Scroll and tap</span>
                <span className="font-semibold">"Add to Home Screen"</span>
                <Plus className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="text-sm">
                <span>Tap</span>
                <span className="font-semibold ml-1">"Add"</span>
                <span className="ml-1 text-muted-foreground">in the top-right corner</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
