/**
 * ReadingChallengeTab — Year of Reading 2026 habit tracker.
 *
 * Three sections, all client-side (localStorage-backed):
 *   1. Class thermometer — combined progress against a per-pupil target
 *   2. Pupil dashboards — books read, pages read, genres, weekly streak,
 *      milestones earned, certificate download
 *   3. "Log a reading session" form
 */
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Award, BookOpen, Flame, Plus, Sparkles, Target, Trophy, Trash2,
  FileDown, Star,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
import {
  addEntry, deleteEntry, listEntries,
  summariseForClass, summariseForPupil,
  earnedMilestones, nextMilestone,
  getGoals, setGoals, todayIso,
  type ReadingEntry,
} from "@/lib/reading-challenge";
import { downloadReadingCertificate, downloadHomeSchoolReadingRecord } from "@/lib/reading-pdf";
import { storyGenres } from "@/lib/send-data";

export default function ReadingChallengeTab() {
  const { children, user } = useApp();
  const { preferences } = useUserPreferences();
  // Bumping `tick` re-reads localStorage. Cheap and keeps state shape simple.
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const [selectedPupilId, setSelectedPupilId] = useState<string>(children[0]?.id ?? "");
  const selectedPupil = children.find(c => c.id === selectedPupilId);

  const classSummary = useMemo(
    () => summariseForClass(children.map(c => ({ id: c.id, name: c.name }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children, tick],
  );

  const pupilSummary = useMemo(
    () => selectedPupil
      ? summariseForPupil(selectedPupil.id, selectedPupil.name)
      : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPupil, tick],
  );

  const recentEntries = useMemo<ReadingEntry[]>(
    () => selectedPupil ? listEntries(selectedPupil.id).slice(0, 10) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPupil, tick],
  );

  // ── New-entry form state ────────────────────────────────────────────────
  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [pagesRead, setPagesRead] = useState("");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [finished, setFinished] = useState(false);
  const [rating, setRating] = useState(0);

  function resetForm() {
    setBookTitle(""); setAuthor(""); setGenre(""); setPagesRead("");
    setDate(todayIso()); setNotes(""); setFinished(false); setRating(0);
  }

  function handleLog() {
    if (!selectedPupil) {
      toast.error("Select a pupil first.");
      return;
    }
    if (!bookTitle.trim()) {
      toast.error("Enter a book title.");
      return;
    }
    const pages = Number(pagesRead) || 0;
    addEntry({
      pupilId: selectedPupil.id,
      pupilName: selectedPupil.name,
      bookTitle: bookTitle.trim(),
      author: author.trim() || undefined,
      genre: genre || undefined,
      pagesRead: pages,
      date,
      notes: notes.trim() || undefined,
      finished,
      rating: rating || undefined,
    });
    toast.success(finished ? "Book finished — celebrate it!" : "Reading session logged.");
    resetForm();
    refresh();
  }

  function handleCertificate() {
    if (!selectedPupil || !pupilSummary) return;
    const ms = earnedMilestones(pupilSummary);
    if (ms.length === 0) {
      toast.info("No milestones unlocked yet — keep reading!");
      return;
    }
    downloadReadingCertificate({
      pupilName: selectedPupil.name,
      yearGroup: selectedPupil.yearGroup,
      schoolName: preferences.schoolName,
      milestones: ms,
      totalPages: pupilSummary.totalPages,
      booksFinished: pupilSummary.booksFinished,
      uniqueGenres: pupilSummary.uniqueGenres.length,
      teacherName: user?.displayName,
    });
    toast.success("Certificate downloaded!");
  }

  function handleHomeSchoolRecord() {
    if (!selectedPupil) return;
    const entries = listEntries(selectedPupil.id).slice(0, 7);
    downloadHomeSchoolReadingRecord({
      pupilName: selectedPupil.name,
      yearGroup: selectedPupil.yearGroup,
      schoolName: preferences.schoolName,
      entries,
      blankRows: Math.max(3, 7 - entries.length),
    });
    toast.success("Home-school reading record downloaded!");
  }

  function updateGoal(field: "booksTarget" | "genresTarget", value: number) {
    if (!selectedPupil) return;
    const goals = getGoals(selectedPupil.id);
    setGoals(selectedPupil.id, { ...goals, [field]: value });
    refresh();
  }

  // ── Class thermometer ───────────────────────────────────────────────────
  const classPct = Math.min(
    100,
    classSummary.classBooksTarget
      ? Math.round((classSummary.booksFinished / classSummary.classBooksTarget) * 100)
      : 0,
  );

  return (
    <div className="space-y-4">
      {/* Year of Reading banner */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-bold tracking-wide text-amber-700 uppercase">
            UK Year of Reading 2026
          </p>
        </div>
        <p className="text-sm text-amber-900">
          Track every reading session, celebrate finished books, and print
          home-school records to keep families involved.
        </p>
      </div>

      {/* Class thermometer */}
      {children.length > 0 && (
        <Card className="border-emerald-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-bold">Class reading thermometer</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Books finished" value={classSummary.booksFinished} />
              <Stat label="Pages read" value={classSummary.totalPages} />
              <Stat label="Genres explored" value={classSummary.uniqueGenres.length} />
              <Stat label="Sessions logged" value={classSummary.totalEntries} />
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Class goal: {classSummary.booksFinished}/{classSummary.classBooksTarget} books</span>
                <span>{classPct}%</span>
              </div>
              <Progress value={classPct} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pupil picker */}
      {children.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Add pupils on the Pupils page to start tracking reading.
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-4 space-y-2">
            <Label className="text-xs font-medium">Pupil</Label>
            <Select value={selectedPupilId} onValueChange={setSelectedPupilId}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Choose pupil" /></SelectTrigger>
              <SelectContent>
                {children.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.yearGroup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Pupil dashboard */}
      {pupilSummary && selectedPupil && (
        <>
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand" />
                  <p className="text-sm font-bold">{selectedPupil.name}'s reading</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" onClick={handleHomeSchoolRecord} className="gap-1.5">
                    <FileDown className="w-3.5 h-3.5" />Reading Record
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCertificate} className="gap-1.5 border-amber-300 text-amber-700">
                    <Award className="w-3.5 h-3.5" />Certificate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Books finished" value={pupilSummary.booksFinished} />
                <Stat label="Pages" value={pupilSummary.totalPages} />
                <Stat label="Genres" value={pupilSummary.uniqueGenres.length} />
                <Stat
                  label="Weekly streak"
                  value={pupilSummary.weeklyStreak}
                  icon={pupilSummary.weeklyStreak >= 2 ? <Flame className="w-3 h-3 text-orange-500" /> : undefined}
                />
              </div>

              {/* Goals */}
              <div className="grid grid-cols-2 gap-3">
                <GoalRow
                  label="Books goal"
                  current={pupilSummary.booksFinished}
                  target={pupilSummary.goals.booksTarget}
                  onChange={v => updateGoal("booksTarget", v)}
                />
                <GoalRow
                  label="Genres goal"
                  current={pupilSummary.uniqueGenres.length}
                  target={pupilSummary.goals.genresTarget}
                  onChange={v => updateGoal("genresTarget", v)}
                />
              </div>

              {/* Milestones */}
              <MilestonesView summary={pupilSummary} />
            </CardContent>
          </Card>

          {/* Log session */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand" />
                <p className="text-sm font-bold">Log a reading session</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Book title *</Label>
                  <Input value={bookTitle} onChange={e => setBookTitle(e.target.value)}
                    placeholder="e.g. Wonder" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Author</Label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Genre</Label>
                  <Select value={genre} onValueChange={setGenre}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pick genre" /></SelectTrigger>
                    <SelectContent>
                      {storyGenres.map(g => (
                        <SelectItem key={g.id} value={g.name}>{g.emoji} {g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pages read</Label>
                  <Input type="number" min={0} value={pagesRead} onChange={e => setPagesRead(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-9" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Pupil notes (optional)</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="What did they enjoy? What was tricky?" className="text-sm min-h-[60px]" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <RatingPicker value={rating} onChange={setRating} />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" checked={finished} onChange={e => setFinished(e.target.checked)} />
                  <span className="font-medium">Finished the book</span>
                </label>
                <Button onClick={handleLog} className="ml-auto bg-brand hover:bg-brand/90 text-white gap-1.5 h-9">
                  <Plus className="w-3.5 h-3.5" />Log session
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent entries */}
          {recentEntries.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand" />Recent sessions
                </p>
                <ul className="divide-y divide-border/50">
                  {recentEntries.map(e => (
                    <li key={e.id} className="py-2 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {e.bookTitle}
                          {e.finished && <Badge className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200" variant="outline">Finished</Badge>}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {e.author ? `${e.author} · ` : ""}
                          {e.genre ? `${e.genre} · ` : ""}
                          {e.pagesRead ? `${e.pagesRead}p · ` : ""}
                          {e.date}
                        </p>
                        {e.notes && <p className="text-[11px] text-foreground/80 mt-0.5">{e.notes}</p>}
                      </div>
                      <button
                        aria-label="Delete entry"
                        onClick={() => { deleteEntry(e.id); refresh(); }}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Stat({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 text-center">
      <div className="text-lg font-bold flex items-center justify-center gap-1">
        {icon}{value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function GoalRow({
  label, current, target, onChange,
}: { label: string; current: number; target: number; onChange: (v: number) => void }) {
  const pct = Math.min(100, target ? Math.round((current / target) * 100) : 0);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium flex items-center gap-1.5"><Target className="w-3 h-3" />{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">{current} /</span>
          <input
            type="number" min={1} max={99} value={target}
            onChange={e => onChange(Math.max(1, Number(e.target.value) || 1))}
            className="w-12 h-6 rounded border border-border bg-background text-xs px-1 text-center"
          />
        </div>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground mr-1">Rating:</span>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className="p-0.5"
          aria-label={`${n} star`}
        >
          <Star className={`w-4 h-4 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

function MilestonesView({ summary }: { summary: ReturnType<typeof summariseForPupil> }) {
  const earned = earnedMilestones(summary);
  const next = nextMilestone(summary);
  if (earned.length === 0 && !next) return null;
  return (
    <div className="space-y-2">
      {earned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Milestones unlocked
          </p>
          <div className="flex flex-wrap gap-1.5">
            {earned.map(m => (
              <Badge key={m.id} variant="outline" className="bg-amber-50 border-amber-200 text-amber-800 text-[11px]">
                {m.emoji} {m.label}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {next && (
        <div className="rounded-md border border-dashed border-amber-200 bg-amber-50/40 p-2.5">
          <p className="text-[11px] text-amber-900">
            Next: <strong>{next.info.emoji} {next.info.label}</strong> — {next.info.description}
          </p>
          <Progress value={next.progressPct} className="h-1.5 mt-1.5" />
        </div>
      )}
    </div>
  );
}
