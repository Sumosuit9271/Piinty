import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Share, Plus, Smartphone, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import piintyLogo from "@/assets/piinty-logo.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPWAGuide, setShowPWAGuide] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const inviteGroupId = searchParams.get("invite");
  const inviteGroupName = searchParams.get("name");

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (inviteGroupId) {
          navigate(`/group/${inviteGroupId}`);
        } else {
          navigate("/groups");
        }
      }
    });

    // Set up auto-logout on browser close if flag is set
    const shouldAutoLogout = sessionStorage.getItem("autoLogout") === "true";
    if (shouldAutoLogout) {
      const handleBeforeUnload = async () => {
        await supabase.auth.signOut();
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [navigate, inviteGroupId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
            emailRedirectTo: `${window.location.origin}/groups`,
          },
        });

        if (error) throw error;

        // Manually create profile to ensure it exists
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              phone_number: email,
              display_name: displayName || email.split('@')[0],
            });

          if (profileError) console.error("Profile creation error:", profileError);
          
          // Auto-join group if invited
          if (inviteGroupId) {
            const { error: memberError } = await supabase
              .from("group_members")
              .insert({
                group_id: inviteGroupId,
                user_id: data.user.id,
              });
            
            if (memberError) console.error("Auto-join error:", memberError);
          }
        }

        toast({
          title: "Account created!",
          description: inviteGroupId 
            ? `Welcome! Joining ${inviteGroupName || "group"}...`
            : "You're now signed in",
        });
        
        if (inviteGroupId) {
          navigate(`/group/${inviteGroupId}`);
        } else {
          navigate("/groups");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // If "Remember me" is unchecked, set up auto-logout on browser close
        if (!rememberMe) {
          sessionStorage.setItem("autoLogout", "true");
          window.addEventListener("beforeunload", async () => {
            await supabase.auth.signOut();
          });
        } else {
          sessionStorage.removeItem("autoLogout");
        }

        toast({
          title: "Welcome back!",
          description: "You're signed in",
        });
        
        if (inviteGroupId) {
          navigate(`/group/${inviteGroupId}`);
        } else {
          navigate("/groups");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={piintyLogo} alt="Piinty Logo" className="h-40 w-auto mb-4" />
          <p className="text-muted-foreground text-center">
            {inviteGroupName 
              ? `Join ${inviteGroupName} to track pints together!`
              : "Keep track of owed pints between mates!"
            }
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                Display Name
              </label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Remember me
              </label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-primary hover:underline"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>

      {showPWAGuide && (
        <Card className="w-full max-w-md p-6 mt-4 bg-primary/5 border-primary/20 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => setShowPWAGuide(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-3 mb-4 pr-8">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base mb-1">Add Piinty to Home Screen</h3>
              <p className="text-xs text-muted-foreground">
                Install as an app for quick access!
              </p>
            </div>
          </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              1
            </div>
            <div className="flex items-center gap-2 text-sm flex-1">
              <span>Tap the Share button</span>
              <Share className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground">(Safari toolbar)</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              2
            </div>
            <div className="flex items-center gap-2 text-sm flex-1">
              <span>Scroll and tap</span>
              <span className="font-semibold">"Add to Home Screen"</span>
              <Plus className="h-4 w-4 text-primary flex-shrink-0" />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <div className="text-sm">
              <span>Tap</span>
              <span className="font-semibold ml-1">"Add"</span>
              <span className="ml-1 text-xs text-muted-foreground">in the top-right</span>
            </div>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
}
