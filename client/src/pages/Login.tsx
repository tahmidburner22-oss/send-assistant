import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Eye, EyeOff, UserPlus, Mail, Lock,
  ArrowLeft, Shield, Chrome, Briefcase, ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { auth as authApi } from "@/lib/api";

type View = "login" | "register" | "forgot" | "mfa" | "reset";

const SCHOOL_ROLES = [
  {
    value: "school_admin",
    label: "School Administrator",
    description: "Full access — manage users, settings, and all data",
    badge: "Admin",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    value: "senco",
    label: "SENCO / Inclusion Lead",
    description: "Manager-level access — reports, pupil profiles, and settings",
    badge: "Manager",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Standard access — create resources and manage your pupils",
    badge: "Standard",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    value: "ta",
    label: "Teaching Assistant",
    description: "Standard access — support pupils and view resources",
    badge: "Standard",
    badgeColor: "bg-green-100 text-green-700",
  },
  {
    value: "staff",
    label: "Support Staff",
    description: "Limited access — view assigned resources only",
    badge: "Limited",
    badgeColor: "bg-gray-100 text-gray-600",
  },
] as const;

type SchoolRole = typeof SCHOOL_ROLES[number]["value"];

const PERSONAL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "hotmail.co.uk", "outlook.com", "live.com", "live.co.uk", "icloud.com",
  "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
]);

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, loginWithGoogle, registerTeacher, verifyMfa, isLoggedIn, mfaRequired } = useApp();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<SchoolRole>("teacher");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const mode = params.get("mode");
    const isResetPath = window.location.pathname === "/reset-password";
    const isVerifyPath = window.location.pathname === "/verify-email";
    if (token && (mode === "reset" || isResetPath)) { setResetToken(token); setView("reset"); }
    if (token && (!mode && !isResetPath) || (token && isVerifyPath)) {
      authApi.verifyEmail(token)
        .then(() => toast.success("Email verified! You can now log in."))
        .catch(() => toast.error("Invalid or expired verification link."));
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) setLocation("/home");
    if (mfaRequired) setView("mfa");
  }, [isLoggedIn, mfaRequired]);

  // Warn user if they type a personal email in the register form
  const handleRegisterEmailChange = (val: string) => {
    setEmail(val);
    const domain = val.split("@")[1]?.toLowerCase();
    if (domain && PERSONAL_DOMAINS.has(domain)) {
      setEmailWarning("Please use your school or work email address, not a personal one.");
    } else {
      setEmailWarning("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter your email and password");
    setLoading(true);
    setEmailNotVerified(false);
    const result = await login(email, password);
    setLoading(false);
    if (result?.emailNotVerified) {
      setEmailNotVerified(true);
    } else if (result.error) {
      toast.error(result.error);
    } else if (result.mfaRequired) {
      setView("mfa");
    } else {
      setLocation("/home");
    }
  };

  const handleResendVerification = async () => {
    if (!email) return toast.error("Please enter your email address first");
    setResendingVerification(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("Verification email resent — please check your inbox");
    } catch {
      toast.error("Failed to resend — please try again");
    }
    setResendingVerification(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) return toast.error("All fields are required");
    if (emailWarning) return toast.error(emailWarning);
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      // Call the API directly so we can pass the role
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Registration failed");
      } else {
        const roleInfo = SCHOOL_ROLES.find(r => r.value === selectedRole);
        toast.success(`Account created as ${roleInfo?.label ?? selectedRole}! Please check your email to verify your account.`);
        setView("login");
      }
    } catch {
      toast.error("Registration failed. Please try again.");
    }
    setLoading(false);
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

  const selectedRoleInfo = SCHOOL_ROLES.find(r => r.value === selectedRole)!;

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
                  {emailNotVerified && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-sm text-amber-800 space-y-2">
                      <p className="font-medium">📧 Please verify your email first</p>
                      <p className="text-xs text-amber-700">Check your inbox for a verification link. If you can't find it, click below to resend it.</p>
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendingVerification}
                        className="text-xs font-semibold text-amber-900 underline hover:no-underline disabled:opacity-50"
                      >
                        {resendingVerification ? "Sending..." : "Resend verification email"}
                      </button>
                    </div>
                  )}
                  <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
                  <Button type="button" variant="outline" className="w-full h-11" onClick={handleGoogleLogin}><Chrome className="w-4 h-4 mr-2" aria-hidden="true" />Continue with Google</Button>
                  <div className="text-center">
                    <button type="button" onClick={() => setView("register")} className="text-sm text-brand hover:underline inline-flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-brand rounded">
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />Create a school account
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
                    <h2 className="text-lg font-semibold">Create School Account</h2>
                  </div>

                  {/* Full name */}
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full name</Label>
                    <Input id="reg-name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your full name" required className="h-11" autoComplete="name" />
                  </div>

                  {/* School email */}
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">School email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={e => handleRegisterEmailChange(e.target.value)}
                        placeholder="you@school.sch.uk"
                        required
                        className={`h-11 pl-9 ${emailWarning ? "border-amber-400 focus-visible:ring-amber-400" : ""}`}
                        autoComplete="email"
                      />
                    </div>
                    {emailWarning ? (
                      <p className="text-xs text-amber-600">{emailWarning}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Must be your school or work email — personal emails are not accepted.</p>
                    )}
                  </div>

                  {/* Role selector */}
                  <div className="space-y-2">
                    <Label>Your role at school</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                        className="w-full h-11 px-3 flex items-center justify-between border border-input rounded-md bg-background text-sm hover:bg-accent/50 transition-colors"
                        aria-expanded={roleDropdownOpen}
                        aria-haspopup="listbox"
                      >
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedRoleInfo.label}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${selectedRoleInfo.badgeColor}`}>
                            {selectedRoleInfo.badge}
                          </span>
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {roleDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg overflow-hidden" role="listbox">
                          {SCHOOL_ROLES.map(role => (
                            <button
                              key={role.value}
                              type="button"
                              role="option"
                              aria-selected={selectedRole === role.value}
                              onClick={() => { setSelectedRole(role.value); setRoleDropdownOpen(false); }}
                              className={`w-full px-3 py-2.5 text-left hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 ${selectedRole === role.value ? "bg-brand/5" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-medium">{role.label}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${role.badgeColor}`}>{role.badge}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="reg-pass">Password <span className="text-muted-foreground text-xs">(min 8 characters)</span></Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reg-pass" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Choose a password" required className="h-11 pl-9 pr-10" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">Confirm password</Label>
                    <Input id="reg-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required className="h-11" autoComplete="new-password" />
                  </div>

                  {/* Access level info box */}
                  <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Access level for {selectedRoleInfo.label}:</p>
                    <p>{selectedRoleInfo.description}</p>
                    {(selectedRole === "school_admin" || selectedRole === "senco") && (
                      <p className="text-brand font-medium">
                        {selectedRole === "school_admin"
                          ? "Admins can manage all users, API keys, and school settings."
                          : "SENCOs can manage pupil profiles, reports, and inclusion settings."}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dpaAccepted}
                        onChange={e => setDpaAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand"
                        required
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I agree to Adaptly's{" "}
                        <a href="/terms" className="text-brand hover:underline">Terms of Service</a>,{" "}
                        <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>, and{" "}
                        <a href="/dpa" className="text-brand hover:underline">Data Processing Agreement</a>.
                        I confirm I am an educational professional aged 18 or over, and that pupil-facing features will be used under qualified supervision.
                      </span>
                    </label>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-brand hover:bg-brand/90 text-white font-medium" disabled={loading || !!emailWarning || !dpaAccepted}>
                    {loading ? "Creating account..." : `Create ${selectedRoleInfo.label} Account`}
                  </Button>
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
          <a href="/dpa" className="hover:underline">Data Processing</a>{" · "}
          <a href="/safeguarding" className="hover:underline">Safeguarding</a>{" · "}
          <a href="/accessibility" className="hover:underline">Accessibility</a>
        </p>
      </motion.div>
    </div>
  );
}
