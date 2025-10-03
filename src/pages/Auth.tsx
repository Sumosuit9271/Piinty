import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Beer, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
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
  }, [navigate, inviteGroupId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: `${phone}@pintpal.app`,
          password,
          options: {
            data: {
              display_name: displayName || phone,
              phone_number: phone,
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
              phone_number: phone,
              display_name: displayName || phone,
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
          email: `${phone}@pintpal.app`,
          password,
        });

        if (error) throw error;

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
          <div className="p-4 bg-primary/10 rounded-full mb-4">
            <Beer className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Piinty</h1>
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
            <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <Input
              id="phone"
              placeholder="e.g., 07123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
    </div>
  );
}
