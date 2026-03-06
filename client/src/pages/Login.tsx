import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Eye, EyeOff, UserPlus, Mail, Lock, ArrowLeft, Shield, Chrome } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { auth as authApi } from "@/lib/api";

type View = "login" | "register" | "forgot" | "mfa" | "reset";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, loginWithGoogle, registerTeacher, verifyMfa, isLoggedIn, mfaRequired } = useApp();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const mode = params.get("mode");
    if (token && mode === "reset") { setResetToken(token); setView("reset"); }
    if (token && !mode) {
      authApi.verifyEmail(token)
        .then(() => toast.success("Email verified! You can now log in."))
        .catch(() => toast.error("Invalid or expired verification link."));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) setLocation("/home");
    if (mfaRequired) setView("mfa");
  }, [isLoggedIn, mfaRequired]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter your email and password");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else if (result.mfaRequired) setView("mfa");
    else setLocation("/home");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) return toast.error("All fields are required");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const result = await registerTeacher(email, password, displayName);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else { toast.success("Account created! Please check your email to verify your account."); setView("login"); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      toast.success("If an account exists with this email, a reset link has been sent.");
      setView("login");
    } catch { toast.error("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Please enter a new password");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, password);
      toast.success("Password reset successfully. Please log in.");
      setView("login");
      window.history.replaceState({}, "", "/");
    } catch (err: any) { toast.error(err.message || "Reset failed"); }
    setLoading(false);
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode) return toast.error("Please enter your 6-digit code");
    setLoading(true);
    try {
      await verifyMfa(mfaCode);
      setLocation("/home");
    } catch (err: any) { toast.error(err.message || "Invalid code"); }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) { toast.error("Google Sign-In is not configured. Please use email/password."); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      (window as any).google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const payload = JSON.parse(atob(response.credential.split(".")[1]));
            await loginWithGoogle({ googleId: payload.sub, email: payload.email, displayName: payload.name });
            setLocation("/home");
          } catch (err: any) { toast.error(err.message || "Google sign-in failed"); }
        },
      });
      (window as any).google?.accounts.id.prompt();
    };
    document.head.appendChild(script);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-background to-background flex items-center justify-center p-4" role="main">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand mx-auto mb-4 flex items-center justify-center shadow-lg" aria-hidden="true">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Adaptly</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered tools for UK SEND educators</p>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {view === "login" && (
                <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogin} className="space-y-4" aria-label="Sign in form">
                  <h2 className="text-lg font-semibold text-center">Sign In</h2>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.sch.uk" required className="h-11 pl-9" autoComplete="email" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <button type="button" onClick={() => setView("forgot")} className="text-xs text-brand hover:underline focus:outline-none focus:ring-2 focus:ring-brand rounded">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required className="h-11 pl-9 pr-10" autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium" disabled={loading} aria-busy={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
                  <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleLogin}><Chrome className="w-4 h-4 mr-2" aria-hidden="true" />Continue with Google</Button>
                  <div className="text-center">
                    <button type="button" onClick={() => setView("register")} className="text-sm text-brand hover:underline inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-brand rounded">
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />Create a teacher account
                    </button>
                  </div>
                  <div className="text-center pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">New school? <a href="/onboarding" className="text-brand hover:underline">Register your school</a></p>
                  </div>
                </motion.form>
              )}

              {view === "register" && (
                <motion.form key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleRegister} className="space-y-4" aria-label="Create account form">
                  <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => setView("login")} className="text-muted-foreground hover:text-foreground" aria-label="Back to sign in"><ArrowLeft className="w-4 h-4" /></button>
                    <h2 className="text-lg font-semibold">Create Teacher Account</h2>
                  </div>
                  <div className="space-y-2"><Label htmlFor="reg-name">Full name</Label><Input id="reg-name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" required className="h-11" autoComplete="name" /></div>
                  <div className="space-y-2"><Label htmlFor="reg-email">School email address</Label><Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.sch.uk" required className="h-11" autoComplete="email" /></div>
                  <div className="space-y-2"><Label htmlFor="reg-pass">Password <span className="text-muted-foreground text-xs">(min 8 characters)</span></Label><Input id="reg-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" required className="h-11" autoComplete="new-password" /></div>
                  <div className="space-y-2"><Label htmlFor="reg-confirm">Confirm password</Label><Input id="reg-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required className="h-11" autoComplete="new-password" /></div>
                  <p className="text-xs text-muted-foreground">By creating an account you agree to our <a href="/terms" className="text-brand hover:underline">Terms of Service</a> and <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>.</p>
                  <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium" disabled={loading}>{loading ? "Creating..." : "Create Account"}</Button>
                </motion.form>
              )}

              {view === "forgot" && (
                <motion.form key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleForgotPassword} className="space-y-4" aria-label="Forgot password form">
                  <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => setView("login")} className="text-muted-foreground hover:text-foreground" aria-label="Back to sign in"><ArrowLeft className="w-4 h-4" /></button>
                    <h2 className="text-lg font-semibold">Reset Password</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                  <div className="space-y-2"><Label htmlFor="forgot-email">Email address</Label><Input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.sch.uk" required className="h-11" autoComplete="email" /></div>
                  <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
                </motion.form>
              )}

              {view === "reset" && (
                <motion.form key="reset" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleResetPassword} className="space-y-4" aria-label="Set new password form">
                  <h2 className="text-lg font-semibold text-center">Set New Password</h2>
                  <div className="space-y-2"><Label htmlFor="new-pass">New password</Label><Input id="new-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" required className="h-11" autoComplete="new-password" /></div>
                  <div className="space-y-2"><Label htmlFor="new-confirm">Confirm new password</Label><Input id="new-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required className="h-11" autoComplete="new-password" /></div>
                  <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</Button>
                </motion.form>
              )}

              {view === "mfa" && (
                <motion.form key="mfa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleMfaVerify} className="space-y-4" aria-label="Two-factor authentication form">
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-brand/10 mx-auto mb-3 flex items-center justify-center"><Shield className="w-6 h-6 text-brand" aria-hidden="true" /></div>
                    <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
                    <p className="text-sm text-muted-foreground mt-1">Enter the 6-digit code from your authenticator app</p>
                  </div>
                  <div className="space-y-2"><Label htmlFor="mfa-code">Verification code</Label><Input id="mfa-code" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required className="h-11 text-center text-2xl tracking-widest" maxLength={6} inputMode="numeric" autoComplete="one-time-code" /></div>
                  <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium" disabled={loading || mfaCode.length !== 6}>{loading ? "Verifying..." : "Verify"}</Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-6">
          <a href="/privacy" className="hover:underline">Privacy Policy</a>{" · "}
          <a href="/terms" className="hover:underline">Terms of Service</a>{" · "}
          <a href="/accessibility" className="hover:underline">Accessibility</a>
        </p>
      </motion.div>
    </div>
  );
}
