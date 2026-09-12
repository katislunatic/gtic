import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import gticLogo from "@/assets/gtic-logo.png";

// Standalone admin login page, meant to be opened in its own popup window
// (see Navigation.tsx) rather than as an in-page dialog — so if the main
// site is being screen-shared as a single window/tab, this separate window
// isn't part of that capture. Logging in here shares the same Supabase
// session as the main site (same origin/localStorage), so the main window's
// auth listener picks up admin status automatically; this page just closes
// itself on success.
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      if (data.user) {
        // Give the opener window's onAuthStateChange listener a moment to
        // pick up the new session before this window closes.
        setTimeout(() => {
          window.close();
        }, 400);
      }
    } catch (err: any) {
      setError(err.message || "Login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-panel w-full max-w-sm p-6 space-y-4">
        <div className="flex flex-col items-center gap-2 mb-2">
          <img src={gticLogo} alt="GTEC" className="h-10 w-10" />
          <h1 className="font-semibold text-lg">Admin Login</h1>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleLogin} disabled={loading} className="w-full">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
