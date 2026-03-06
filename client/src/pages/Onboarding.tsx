import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Building2, Shield, UserPlus, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { schools as schoolsApi } from "@/lib/api";

const STEPS = [
  { id: 1, title: "School Details", icon: Building2 },
  { id: 2, title: "DSL Contact", icon: Shield },
  { id: 3, title: "Admin Account", icon: UserPlus },
  { id: 4, title: "Complete", icon: Check },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [schoolData, setSchoolData] = useState({
    name: "", urn: "", phase: "", address: "", domain: "", licenceType: "trial",
  });
  const [dslData, setDslData] = useState({ dslName: "", dslEmail: "", dslPhone: "" });
  const [adminData, setAdminData] = useState({ displayName: "", email: "", password: "", confirmPassword: "" });

  const updateSchool = (k: string, v: string) => setSchoolData(s => ({ ...s, [k]: v }));
  const updateDsl = (k: string, v: string) => setDslData(s => ({ ...s, [k]: v }));
  const updateAdmin = (k: string, v: string) => setAdminData(s => ({ ...s, [k]: v }));

  const handleSubmit = async () => {
    if (adminData.password !== adminData.confirmPassword) { toast.error("Passwords do not match"); return; }
    if (adminData.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await schoolsApi.onboard({
        school: schoolData,
        dsl: dslData,
        admin: { displayName: adminData.displayName, email: adminData.email, password: adminData.password },
      });
      setStep(4);
    } catch (err: any) {
      toast.error(err.message || "Onboarding failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand mx-auto mb-3 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Register Your School</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up Adaptly for your school in minutes</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s.id ? "bg-brand text-white" : "bg-muted text-muted-foreground"}`}>
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 transition-colors ${step > s.id ? "bg-brand" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">

              {/* Step 1: School Details */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-brand" />School Details</h2>
                  <div className="space-y-2"><Label htmlFor="school-name">School name *</Label><Input id="school-name" value={schoolData.name} onChange={e => updateSchool("name", e.target.value)} placeholder="e.g. Riverside Academy" required /></div>
                  <div className="space-y-2"><Label htmlFor="school-urn">URN (Unique Reference Number)</Label><Input id="school-urn" value={schoolData.urn} onChange={e => updateSchool("urn", e.target.value)} placeholder="e.g. 123456" /></div>
                  <div className="space-y-2">
                    <Label htmlFor="school-phase">School phase *</Label>
                    <Select value={schoolData.phase} onValueChange={v => updateSchool("phase", v)}>
                      <SelectTrigger id="school-phase"><SelectValue placeholder="Select phase" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="secondary">Secondary</SelectItem>
                        <SelectItem value="all-through">All-through</SelectItem>
                        <SelectItem value="special">Special school</SelectItem>
                        <SelectItem value="alternative">Alternative provision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label htmlFor="school-domain">School email domain (for restricted registration)</Label><Input id="school-domain" value={schoolData.domain} onChange={e => updateSchool("domain", e.target.value)} placeholder="e.g. riverside.sch.uk" /></div>
                  <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={() => { if (!schoolData.name || !schoolData.phase) { toast.error("Please fill in required fields"); return; } setStep(2); }}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: DSL */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-brand" />Designated Safeguarding Lead</h2>
                  <p className="text-sm text-muted-foreground">Your DSL will be notified of any safeguarding concerns flagged by the AI content filter. This is required for KCSIE 2025 compliance.</p>
                  <div className="space-y-2"><Label htmlFor="dsl-name">DSL full name *</Label><Input id="dsl-name" value={dslData.dslName} onChange={e => updateDsl("dslName", e.target.value)} placeholder="e.g. Jane Smith" required /></div>
                  <div className="space-y-2"><Label htmlFor="dsl-email">DSL email address *</Label><Input id="dsl-email" type="email" value={dslData.dslEmail} onChange={e => updateDsl("dslEmail", e.target.value)} placeholder="dsl@school.sch.uk" required /></div>
                  <div className="space-y-2"><Label htmlFor="dsl-phone">DSL phone number</Label><Input id="dsl-phone" type="tel" value={dslData.dslPhone} onChange={e => updateDsl("dslPhone", e.target.value)} placeholder="e.g. 01234 567890" /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                    <Button className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={() => { if (!dslData.dslName || !dslData.dslEmail) { toast.error("DSL name and email are required"); return; } setStep(3); }}>
                      Continue <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Admin Account */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5 text-brand" />School Admin Account</h2>
                  <p className="text-sm text-muted-foreground">Create the school admin account. This person will manage users and settings.</p>
                  <div className="space-y-2"><Label htmlFor="admin-name">Your full name *</Label><Input id="admin-name" value={adminData.displayName} onChange={e => updateAdmin("displayName", e.target.value)} placeholder="Your name" required /></div>
                  <div className="space-y-2"><Label htmlFor="admin-email">Your school email *</Label><Input id="admin-email" type="email" value={adminData.email} onChange={e => updateAdmin("email", e.target.value)} placeholder="you@school.sch.uk" required /></div>
                  <div className="space-y-2"><Label htmlFor="admin-pass">Password *</Label><Input id="admin-pass" type="password" value={adminData.password} onChange={e => updateAdmin("password", e.target.value)} placeholder="Min 8 characters" required /></div>
                  <div className="space-y-2"><Label htmlFor="admin-confirm">Confirm password *</Label><Input id="admin-confirm" type="password" value={adminData.confirmPassword} onChange={e => updateAdmin("confirmPassword", e.target.value)} placeholder="Confirm password" required /></div>
                  <p className="text-xs text-muted-foreground">By registering you agree to our <a href="/terms" className="text-brand hover:underline">Terms of Service</a> and <a href="/privacy" className="text-brand hover:underline">Privacy Policy</a>.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                    <Button className="flex-1 bg-brand hover:bg-brand/90 text-white" onClick={handleSubmit} disabled={loading}>
                      {loading ? "Setting up..." : "Complete Setup"} {!loading && <Check className="w-4 h-4 ml-1" />}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold">School registered!</h2>
                  <p className="text-sm text-muted-foreground">Your school has been set up. Check your email to verify your account, then sign in to start using Adaptly.</p>
                  <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={() => setLocation("/")}>
                    Go to Sign In
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
