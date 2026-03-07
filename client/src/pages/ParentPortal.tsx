import { useState, useRef } from "react";
import { aiGenerateStory } from "@/lib/ai";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useApp, type Child, type AttendanceRecord, type AttendanceStatus, type TimetableLesson } from "@/contexts/AppContext";
import { sendNeeds, storyGenres, storyLengths, readingLevels, colorOverlays, yearGroups } from "@/lib/send-data";
import { generateStoryContent } from "@/lib/worksheet-generator";
import {
  GraduationCap, KeyRound, FileText, BookOpen, Upload, Eye,
  CheckCircle, Clock, AlertCircle, ArrowLeft, Sparkles, Plus, X,
  MessageSquare, Image, Paperclip, ZoomIn, ZoomOut,
  CalendarDays, CheckCircle2, XCircle, MinusCircle, Sun, Sunset, TrendingUp,
  Calendar, MapPin, User2, ChevronLeft, ChevronRight as ChevronRightIcon
} from "lucide-react";
import { Link } from "wouter";

// Comprehension questions generator (same as Stories page)
function generateComprehensionQuestions(_content: string, genre: string): string[] {
  const questions: Record<string, string[]> = {
    adventure: ["What challenge did the main character face?", "How did the character show bravery?", "What would you have done differently?", "Describe the setting in your own words."],
    fantasy: ["What magical elements appeared in the story?", "How did the character use their special abilities?", "What is the moral of the story?", "Describe the fantasy world in detail."],
    mystery: ["What clues helped solve the mystery?", "Who do you think was responsible and why?", "What red herrings appeared in the story?", "How did the detective use logical thinking?"],
    "sci-fi": ["What futuristic technology appeared in the story?", "How was the world different from our own?", "What scientific concepts were explored?", "What problems did the characters face in space/the future?"],
    historical: ["What historical period is the story set in?", "How was life different for people in that time?", "What historical facts are included in the story?", "What can we learn from this period of history?"],
    comedy: ["What made the story funny?", "Describe the funniest moment and explain why it was humorous.", "How did the misunderstanding begin?", "How was the problem eventually resolved?"],
    spooky: ["What created the feeling of suspense in the story?", "How did the author build tension?", "What was the scariest moment and why?", "Was the ending satisfying? Explain your answer."],
    sports: ["What obstacles did the character overcome?", "What does this story teach us about teamwork?", "How did the character prepare for the big event?", "What qualities made the character a good sportsperson?"],
  };
  const defaultQs = ["What is the main theme of this story?", "How does the main character change throughout the story?", "What is the most important moment in the story? Explain why.", "Write a short summary of the story in your own words."];
  return questions[genre] || defaultQs;
}

function storyToHtml(md: string, textSize: number): string {
  return md
    .replace(/^## (.+)$/gm, `<h2 style="font-size:${textSize + 4}px" class="font-bold mt-6 mb-2 text-emerald-700">$1</h2>`)
    .replace(/^# (.+)$/gm, `<h1 style="font-size:${textSize + 8}px" class="font-bold mb-4">$1</h1>`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, `</p><p style="font-size:${textSize}px" class="mb-3 leading-relaxed">`)
    .replace(/^/, `<p style="font-size:${textSize}px" class="mb-3 leading-relaxed">`)
    + '</p>';
}

export default function ParentPortal() {
  const { children, addSubmission, updateAssignment, attendanceRecords } = useApp();
  const [code, setCode] = useState("");
  const [child, setChild] = useState<Child | null>(null);
  const [behaviourRecords, setBehaviourRecords] = useState<any[]>([]);
  const [behaviourLoading, setBehaviourLoading] = useState(false);
  const [viewContent, setViewContent] = useState<{ title: string; content: string } | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitContent, setSubmitContent] = useState("");
  const [submitQuestion, setSubmitQuestion] = useState("");
  const [uploadedFile, setUploadedFile] = useState<{ dataUrl: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Story generator state
  const [storyGenre, setStoryGenre] = useState("");
  const [storyYearGroup, setStoryYearGroup] = useState("");
  const [storyCharacters, setStoryCharacters] = useState<string[]>([""]);
  const [storySetting, setStorySetting] = useState("");
  const [storyLength, setStoryLength] = useState("medium");
  const [storyReadingLevel, setStoryReadingLevel] = useState("age-appropriate");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyResult, setStoryResult] = useState<{ title: string; content: string; questions: string[] } | null>(null);
  const [storyTextSize, setStoryTextSize] = useState(15);
  const [storyOverlay, setStoryOverlay] = useState("none");
  const [showQuestions, setShowQuestions] = useState(false);

  const handleCodeEntry = () => {
    const found = children.find(c => c.code === code.toUpperCase().trim());
    if (found) {
      setChild(found);
      toast.success(`Welcome! Viewing ${found.name}'s portal.`);
      // Fetch behaviour records for this pupil from the server
      setBehaviourLoading(true);
      fetch(`/api/data/parent/behaviour/${found.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(r => r.ok ? r.json() : [])
        .then(data => { setBehaviourRecords(Array.isArray(data) ? data : []); })
        .catch(() => setBehaviourRecords([]))
        .finally(() => setBehaviourLoading(false));
    } else {
      toast.error("Invalid code. Please check and try again.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedFile({ dataUrl, name: file.name, type: file.type });
      toast.success(`File "${file.name}" ready to upload.`);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWork = () => {
    if (!child || !submitTitle) {
      toast.error("Please add a title for your submission.");
      return;
    }
    if (!submitContent && !uploadedFile) {
      toast.error("Please add some work — either type it or upload a file.");
      return;
    }
    addSubmission(child.id, {
      title: submitTitle,
      content: submitContent,
      fileDataUrl: uploadedFile?.dataUrl,
      fileName: uploadedFile?.name,
      fileType: uploadedFile?.type,
      question: submitQuestion || undefined,
    });
    toast.success("Work submitted successfully!");
    setSubmitTitle(""); setSubmitContent(""); setSubmitQuestion("");
    setUploadedFile(null); setShowSubmit(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const markStarted = (assignmentId: string) => {
    if (!child) return;
    updateAssignment(child.id, assignmentId, { status: "started", progress: 10 });
    toast.success("Marked as started!");
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    if (status === "started") return <Clock className="w-4 h-4 text-amber-500" />;
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  // Story generator functions
  const addCharacter = () => setStoryCharacters([...storyCharacters, ""]);
  const removeCharacter = (i: number) => setStoryCharacters(storyCharacters.filter((_, idx) => idx !== i));
  const updateCharacter = (i: number, val: string) => {
    const updated = [...storyCharacters];
    updated[i] = val;
    setStoryCharacters(updated);
  };

  

  const handleGenerateStory = async () => {
    if (!storyGenre || !storyYearGroup) {
      toast.error("Please select a genre and year group.");
      return;
    }
    setStoryLoading(true);
    try {
      const charNames = storyCharacters.filter(c => c.trim());
      const result = await aiGenerateStory({
        genre: storyGenre,
        yearGroup: storyYearGroup,
        characters: charNames,
        setting: storySetting || undefined,
        readingLevel: storyReadingLevel,
        length: storyLength,
        sendNeed: child?.sendNeed,
      });
      const questions = generateComprehensionQuestions(result.content, storyGenre);
      setStoryResult({ title: result.title, content: result.content, questions });
      toast.success("Story generated with AI!");
    } catch (_err) {
      // Fallback to local generator
      const charNames = storyCharacters.filter(c => c.trim());
      const story = generateStoryContent({
        genre: storyGenre,
        yearGroup: storyYearGroup,
        characters: charNames,
        setting: storySetting || undefined,
        readingLevel: storyReadingLevel,
        length: storyLength,
      });
      const questions = generateComprehensionQuestions(story.content, storyGenre);
      setStoryResult({ ...story, questions });
      toast.success("Story generated!");
    }
    setStoryLoading(false);
  };

  const storyOverlayBg = colorOverlays.find(o => o.id === storyOverlay)?.color || "#ffffff";

  if (!child) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-emerald-50 to-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Parent Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your child's access code to get started</p>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Access Code</Label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  className="h-12 text-center text-lg font-mono tracking-widest uppercase"
                  maxLength={6}
                  onKeyDown={e => e.key === "Enter" && handleCodeEntry()} />
                <p className="text-xs text-muted-foreground text-center">Ask your child's teacher for their unique code</p>
              </div>
              <Button onClick={handleCodeEntry} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                <KeyRound className="w-4 h-4 mr-2" /> Access Portal
              </Button>
              <div className="text-center">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Teacher Login
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">What can you do here?</h3>
            <ul className="space-y-1.5 text-xs text-emerald-700">
              <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> View your child's assignments</li>
              <li className="flex items-center gap-2"><Upload className="w-3.5 h-3.5" /> Upload completed work (photos or files)</li>
              <li className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Generate personalised stories to read at home</li>
              <li className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Ask questions and receive teacher feedback</li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  const needName = sendNeeds.find(n => n.id === child.sendNeed)?.name || child.sendNeed;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setChild(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Exit
          </button>
          <h1 className="text-base font-semibold text-foreground">{child.name}'s Portal</h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {/* Child Info */}
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">{child.name[0]}</div>
            <div>
              <h3 className="font-semibold text-foreground">{child.name}</h3>
              <p className="text-xs text-muted-foreground">{child.yearGroup} · {needName}</p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assignments">
          <TabsList className="w-full grid grid-cols-6 h-10">
            <TabsTrigger value="assignments" className="text-xs">Work</TabsTrigger>
            <TabsTrigger value="behaviour" className="text-xs">Behaviour</TabsTrigger>
            <TabsTrigger value="timetable" className="text-xs">Timetable</TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs">Submit</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs">Stories</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
          </TabsList>

          {/* ─── ASSIGNMENTS TAB ─── */}
          <TabsContent value="assignments" className="mt-4 space-y-2">
            {child.assignments.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No Assignments Yet</h3>
                  <p className="text-sm text-muted-foreground">Your teacher hasn't assigned any work yet.</p>
                </CardContent>
              </Card>
            ) : child.assignments.map(a => (
              <Card key={a.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {a.type === "worksheet" ? <FileText className="w-5 h-5 text-emerald-600 mt-0.5" /> : <BookOpen className="w-5 h-5 text-purple-600 mt-0.5" />}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                        {statusIcon(a.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Assigned: {new Date(a.assignedAt).toLocaleDateString()}</p>

                      {/* Progress bar */}
                      {(a.progress !== undefined && a.progress > 0) && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">Progress</span>
                            <span className="text-[10px] font-medium text-emerald-600">{a.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${a.progress}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Teacher comment */}
                      {a.teacherComment && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <p className="text-xs text-emerald-700 flex items-start gap-1.5">
                            <MessageSquare className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span><strong>Teacher:</strong> {a.teacherComment}</span>
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => setViewContent({ title: a.title, content: a.content })}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        {a.status === "not-started" && (
                          <Button variant="outline" size="sm" onClick={() => markStarted(a.id)}>
                            <Clock className="w-3.5 h-3.5 mr-1" /> Start
                          </Button>
                        )}
                      </div>
                      {a.feedback && <div className="mt-2 p-2 rounded-lg bg-emerald-50 text-xs text-emerald-700">Teacher feedback: {a.feedback}</div>}
                      {a.mark && <div className="mt-1 text-xs font-semibold">Mark: {a.mark}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ─── BEHAVIOUR TAB ─── */}
          <TabsContent value="behaviour" className="mt-4 space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span> Behaviour Support Plans
                </h3>
                {((child as any).behaviourPlans || []).length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-sm font-medium text-foreground">No active behaviour support plans</p>
                    <p className="text-xs text-muted-foreground mt-1">Your child's teacher will share any plans here when created.</p>
                  </div>
                ) : ((child as any).behaviourPlans || []).map((plan: any, i: number) => (
                  <div key={i} className="border border-border/50 rounded-lg p-3 mb-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-sm">{plan.title || 'Behaviour Support Plan'}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        plan.status === 'review' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{plan.status || 'Active'}</span>
                    </div>
                    {plan.summary && <p className="text-xs text-muted-foreground mt-2">{plan.summary}</p>}
                    {plan.strategies && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-foreground mb-1">Strategies:</p>
                        <p className="text-xs text-muted-foreground">{plan.strategies}</p>
                      </div>
                    )}
                    {plan.positiveTargets && (
                      <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Positive Targets:</p>
                        <p className="text-xs text-emerald-700">{plan.positiveTargets}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">📊</span> Recent Behaviour Log
                </h3>
                {behaviourLoading ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Loading behaviour records...</p>
                  </div>
                ) : behaviourRecords.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🌟</div>
                    <p className="text-sm font-medium text-foreground">No behaviour events recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">Positive and other events logged by staff will appear here.</p>
                  </div>
                ) : behaviourRecords.slice(0, 20).map((event: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-2 rounded-lg mb-2 ${
                    event.type === 'positive' ? 'bg-emerald-50 border border-emerald-200' :
                    event.type === 'concern' ? 'bg-amber-50 border border-amber-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <span className="text-lg flex-shrink-0">
                      {event.type === 'positive' ? '⭐' : event.type === 'concern' ? '⚠️' : '📝'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold capitalize">{event.category || event.type}</p>
                        <p className="text-xs text-muted-foreground">{event.date ? new Date(event.date).toLocaleDateString('en-GB') : ''}</p>
                      </div>
                      {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                      {event.action_taken && <p className="text-xs text-blue-600 mt-0.5">Action: {event.action_taken}</p>}
                      {event.recorded_by_name && <p className="text-xs text-muted-foreground mt-0.5">Recorded by: {event.recorded_by_name}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-lg">🏆</span> Achievements &amp; Rewards
                </h3>
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🌟</div>
                  <p className="text-sm font-medium text-foreground">Achievements will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Stars, certificates, and rewards earned by your child will be shown here.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-xs text-blue-700">
                  <strong>Questions about behaviour?</strong> Please contact your child's teacher or SENCO directly through the school office. This portal is updated by staff regularly.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SUBMIT WORK TAB ─── */}
          <TabsContent value="submissions" className="mt-4 space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-600" /> Submit Work
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Title / What is this for? *</Label>
                    <Input value={submitTitle} onChange={e => setSubmitTitle(e.target.value)}
                      placeholder="e.g. Maths homework — fractions" className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Written Work (optional)</Label>
                    <Textarea value={submitContent} onChange={e => setSubmitContent(e.target.value)}
                      placeholder="Type your work here, or upload a photo/file below..."
                      className="min-h-[100px] text-sm" />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Upload Photo or File (optional)</Label>
                    <div
                      className="border-2 border-dashed border-border/60 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadedFile ? (
                        <div className="space-y-2">
                          {uploadedFile.type.startsWith("image/") ? (
                            <img src={uploadedFile.dataUrl} alt="Uploaded" className="max-h-40 mx-auto rounded-lg border border-border/50" />
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="w-8 h-8 text-emerald-600" />
                              <span className="text-sm font-medium text-foreground">{uploadedFile.name}</span>
                            </div>
                          )}
                          <p className="text-xs text-emerald-600 font-medium">{uploadedFile.name} — ready to submit</p>
                          <button
                            onClick={e => { e.stopPropagation(); setUploadedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                          >
                            <X className="w-3 h-3" /> Remove file
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-center gap-3 mb-2">
                            <Image className="w-6 h-6 text-muted-foreground" />
                            <Paperclip className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Tap to upload a photo or file</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF, Word — max 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {/* Question for teacher */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Question for the Teacher (optional)
                    </Label>
                    <Textarea value={submitQuestion} onChange={e => setSubmitQuestion(e.target.value)}
                      placeholder="Ask your child's teacher a question about this work..."
                      className="min-h-[70px] text-sm" />
                  </div>

                  <Button onClick={handleSubmitWork} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Upload className="w-4 h-4 mr-2" /> Submit Work
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous submissions */}
            {child.submissions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Previous Submissions</h4>
                {child.submissions.map(s => (
                  <Card key={s.id} className="border-border/50">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(s.submittedAt).toLocaleDateString()}</p>
                      {s.fileName && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> {s.fileName}
                        </p>
                      )}
                      {s.question && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                          <p className="text-xs text-blue-700"><strong>Your question:</strong> {s.question}</p>
                        </div>
                      )}
                      {s.feedback && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                          <p className="text-xs text-emerald-700"><strong>Teacher feedback:</strong> {s.feedback}</p>
                        </div>
                      )}
                      {s.mark && <div className="mt-1 text-xs font-semibold text-foreground">Mark: {s.mark}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── STORY TIME TAB ─── */}
          <TabsContent value="stories" className="mt-4 space-y-4">
            {!storyResult ? (
              <Card className="border-border/50">
                <CardContent className="p-4 space-y-4">
                  <div className="text-center py-2">
                    <div className="text-3xl mb-2">📚</div>
                    <h3 className="font-semibold text-foreground">Story Generator</h3>
                    <p className="text-xs text-muted-foreground mt-1">Generate a personalised story to read at home</p>
                  </div>

                  {/* Genre Selection */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Choose a Genre *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {storyGenres.map(g => (
                        <button key={g.id} onClick={() => setStoryGenre(g.id)}
                          className={`p-2.5 rounded-lg border text-center transition-all ${storyGenre === g.id ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}>
                          <div className="text-lg mb-0.5">{g.emoji}</div>
                          <div className="text-[10px] font-medium">{g.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Year Group *</Label>
                      <Select value={storyYearGroup} onValueChange={setStoryYearGroup}>
                        <SelectTrigger className="h-10"><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>{yearGroups.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Reading Level</Label>
                      <Select value={storyReadingLevel} onValueChange={setStoryReadingLevel}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{readingLevels.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Story Length */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Length</Label>
                    <div className="flex gap-2">
                      {storyLengths.map(l => (
                        <button key={l.id} onClick={() => setStoryLength(l.id)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${storyLength === l.id ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          {l.name}<br /><span className="text-[9px] opacity-70">{l.words}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Characters */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Character Names</Label>
                      <button onClick={addCharacter} className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {storyCharacters.map((char, i) => (
                        <div key={i} className="flex gap-2">
                          <Input value={char} onChange={e => updateCharacter(i, e.target.value)}
                            placeholder={`Character ${i + 1} name`} className="h-9 text-sm" />
                          {storyCharacters.length > 1 && (
                            <button onClick={() => removeCharacter(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Setting (optional)</Label>
                    <Input value={storySetting} onChange={e => setStorySetting(e.target.value)}
                      placeholder="e.g. A magical forest, outer space..." className="h-10" />
                  </div>

                  <Button onClick={handleGenerateStory} disabled={storyLoading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                    {storyLoading
                      ? <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating Story...</>
                      : <><BookOpen className="w-4 h-4 mr-2" /> Generate Story</>}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Story Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button onClick={() => setStoryTextSize(Math.max(12, storyTextSize - 2))}
                      className="p-1.5 rounded-md hover:bg-white/80 transition-all text-muted-foreground">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium px-1.5 min-w-[32px] text-center">{storyTextSize}px</span>
                    <button onClick={() => setStoryTextSize(Math.min(24, storyTextSize + 2))}
                      className="p-1.5 rounded-md hover:bg-white/80 transition-all text-muted-foreground">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Overlay selector */}
                  <Select value={storyOverlay} onValueChange={setStoryOverlay}>
                    <SelectTrigger className="h-8 text-xs w-auto min-w-[120px]">
                      <SelectValue placeholder="Colour overlay" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOverlays.map(o => (
                        <SelectItem key={o.id} value={o.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-border/50" style={{ backgroundColor: o.color }} />
                            {o.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={() => setShowQuestions(!showQuestions)}>
                    {showQuestions ? "Hide Questions" : "Show Questions"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStoryResult(null)}>
                    New Story
                  </Button>
                </div>

                {/* Story Content */}
                <Card className="border-border/50 overflow-hidden" style={{ backgroundColor: storyOverlayBg }}>
                  <CardContent className="p-5 sm:p-8" style={{ backgroundColor: storyOverlayBg }}>
                    <div className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: storyToHtml(storyResult.content, storyTextSize) }} />
                  </CardContent>
                </Card>

                {/* Comprehension Questions */}
                {showQuestions && storyResult.questions.length > 0 && (
                  <Card className="border-border/50" style={{ backgroundColor: storyOverlayBg }}>
                    <CardContent className="p-5" style={{ backgroundColor: storyOverlayBg }}>
                      <h3 className="font-semibold text-emerald-700 mb-3" style={{ fontSize: `${storyTextSize + 2}px` }}>
                        Comprehension Questions
                      </h3>
                      <ol className="space-y-3">
                        {storyResult.questions.map((q, i) => (
                          <li key={i} className="text-foreground flex gap-2" style={{ fontSize: `${storyTextSize}px` }}>
                            <span className="text-emerald-600 font-semibold">{i + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="mt-4 space-y-4">
            {(() => {
              const recs = attendanceRecords
                .filter((r: AttendanceRecord) => r.childId === child.id)
                .sort((a: AttendanceRecord, b: AttendanceRecord) => b.date.localeCompare(a.date));
              const total = recs.length;
              const amPresent = recs.filter((r: AttendanceRecord) => r.amStatus === "attended").length;
              const pmPresent = recs.filter((r: AttendanceRecord) => r.pmStatus === "attended").length;
              const amPct = total > 0 ? Math.round((amPresent / total) * 100) : 0;
              const pmPct = total > 0 ? Math.round((pmPresent / total) * 100) : 0;
              const AttBadge = ({ status }: { status: AttendanceStatus }) => {
                if (status === "attended") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"><CheckCircle2 className="h-3 w-3" />Present</span>;
                if (status === "absent") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium"><XCircle className="h-3 w-3" />Absent</span>;
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium"><MinusCircle className="h-3 w-3" />—</span>;
              };
              const fmtDate = (s: string) => {
                const [y, m, d] = s.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
              };
              return (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-lg font-bold text-foreground">{total}</div>
                      <div className="text-xs text-muted-foreground">Days recorded</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{amPct}%</div>
                      <div className="text-xs text-muted-foreground">AM attendance</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{pmPct}%</div>
                      <div className="text-xs text-muted-foreground">PM attendance</div>
                    </div>
                  </div>
                  {recs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No attendance records yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
                      {recs.slice(0, 20).map((rec: AttendanceRecord) => (
                        <div key={rec.id} className="px-3 py-2.5 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{fmtDate(rec.date)}</div>
                            {(rec.amReason || rec.pmReason) && (
                              <div className="text-xs text-red-600 mt-0.5">
                                {rec.amReason && <span>AM: {rec.amReason}</span>}
                                {rec.amReason && rec.pmReason && <span> · </span>}
                                {rec.pmReason && <span>PM: {rec.pmReason}</span>}
                              </div>
                            )}
                            {rec.notes && <div className="text-xs text-muted-foreground mt-0.5">{rec.notes}</div>}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-[9px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Sun className="h-2.5 w-2.5" />AM</div>
                              <AttBadge status={rec.amStatus} />
                            </div>
                            <div className="text-center">
                              <div className="text-[9px] text-muted-foreground mb-0.5 flex items-center gap-0.5"><Sunset className="h-2.5 w-2.5" />PM</div>
                              <AttBadge status={rec.pmStatus} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* ─── TIMETABLE TAB ─── */}
          <TabsContent value="timetable" className="mt-4">
            {(() => {
              const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
              const periods = [1, 2, 3, 4, 5, 6, 7, 8];
              const periodTimes: Record<number, string> = {
                1: "8:50–9:50", 2: "9:50–10:50", 3: "11:10–12:10",
                4: "12:10–13:10", 5: "14:00–15:00", 6: "15:00–16:00",
                7: "16:00–17:00", 8: "17:00–18:00"
              };
              const timetable: TimetableLesson[] = child.timetable || [];
              const getLesson = (day: string, period: number) =>
                timetable.find(l => l.day === day && l.period === period);

              const subjectColors: Record<string, string> = {
                "Maths": "bg-blue-100 text-blue-800 border-blue-200",
                "English": "bg-purple-100 text-purple-800 border-purple-200",
                "Science": "bg-green-100 text-green-800 border-green-200",
                "History": "bg-amber-100 text-amber-800 border-amber-200",
                "Geography": "bg-teal-100 text-teal-800 border-teal-200",
                "Art": "bg-pink-100 text-pink-800 border-pink-200",
                "PE": "bg-orange-100 text-orange-800 border-orange-200",
                "Music": "bg-indigo-100 text-indigo-800 border-indigo-200",
                "Computing": "bg-cyan-100 text-cyan-800 border-cyan-200",
                "RE": "bg-rose-100 text-rose-800 border-rose-200",
                "PSHE": "bg-lime-100 text-lime-800 border-lime-200",
                "French": "bg-sky-100 text-sky-800 border-sky-200",
                "Spanish": "bg-red-100 text-red-800 border-red-200",
                "Drama": "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
              };
              const getColor = (subject: string) =>
                subjectColors[subject] || "bg-gray-100 text-gray-700 border-gray-200";

              // Today's day name
              const todayName = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date().getDay()];
              const todayLessons = timetable.filter(l => l.day === todayName).sort((a, b) => a.period - b.period);

              if (timetable.length === 0) {
                return (
                  <Card className="border-border/50">
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium text-foreground">No timetable set yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ask {child.name}'s teacher to add the timetable from the pupil management page.
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Today's lessons highlight */}
                  {todayLessons.length > 0 && (
                    <Card className="border-brand/30 bg-brand/5">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CalendarDays className="h-4 w-4 text-brand" />
                          <span className="text-sm font-semibold text-brand">Today — {todayName}</span>
                        </div>
                        <div className="space-y-1.5">
                          {todayLessons.map(lesson => (
                            <div key={lesson.period} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${getColor(lesson.subject)}`}>
                              <span className="font-bold w-4">{lesson.period}</span>
                              <span className="font-semibold flex-1">{lesson.subject}</span>
                              {lesson.teacher && <span className="flex items-center gap-0.5"><User2 className="h-3 w-3" />{lesson.teacher}</span>}
                              {lesson.room && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{lesson.room}</span>}
                              <span className="text-[10px] opacity-70">{periodTimes[lesson.period]}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Full weekly timetable grid */}
                  <Card className="border-border/50">
                    <CardContent className="p-0 overflow-x-auto">
                      <table className="w-full text-xs border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left font-semibold border-b border-border/50 w-16">Period</th>
                            {days.map(d => (
                              <th key={d} className={`p-2 text-center font-semibold border-b border-border/50 ${d === todayName ? "bg-brand/10 text-brand" : ""}`}>
                                {d.slice(0, 3)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {periods.slice(0, 6).map(p => (
                            <tr key={p} className="border-b border-border/30 hover:bg-muted/30">
                              <td className="p-1.5 text-center">
                                <div className="font-bold text-foreground">{p}</div>
                                <div className="text-[9px] text-muted-foreground">{periodTimes[p]}</div>
                              </td>
                              {days.map(d => {
                                const lesson = getLesson(d, p);
                                return (
                                  <td key={d} className={`p-1 text-center ${d === todayName ? "bg-brand/5" : ""}`}>
                                    {lesson ? (
                                      <div className={`rounded px-1 py-1 border text-[10px] leading-tight ${getColor(lesson.subject)}`}>
                                        <div className="font-semibold">{lesson.subject}</div>
                                        {lesson.room && <div className="opacity-70">{lesson.room}</div>}
                                      </div>
                                    ) : (
                                      <span className="text-gray-300">—</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Subject count summary */}
                  <Card className="border-border/50">
                    <CardContent className="p-3">
                      <p className="text-xs font-semibold text-foreground mb-2">This week's subjects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(timetable.map(l => l.subject))).map(subj => {
                          const count = timetable.filter(l => l.subject === subj).length;
                          return (
                            <span key={subj} className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${getColor(subj)}`}>
                              {subj} × {count}
                            </span>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

        </Tabs>
      </div>

      {/* View Content Dialog */}
      <Dialog open={!!viewContent} onOpenChange={() => setViewContent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewContent?.title}</DialogTitle></DialogHeader>
          <div className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{viewContent?.content}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
