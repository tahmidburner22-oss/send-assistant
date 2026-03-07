import AIToolPage from "@/components/AIToolPage";
import { BookHeart } from "lucide-react";

const situations = [
  "Going to a new school","Lunchtime routines","Dealing with change","Making friends","Asking for help","Managing anger","Waiting my turn","Fire drills","School trips","Assemblies","Changing for PE","Using the toilet at school","Playtime rules","Working in a group","Losing a game","Unexpected events","Visiting the doctor","Haircuts","Supermarket trips","Loud noises","Sensory overload","Saying goodbye","Transitions between lessons",
].map(s => ({ value: s, label: s }));

const ages = ["3-5","5-7","7-9","9-11","11-14","14-18"].map(a => ({ value: a, label: `Age ${a}` }));

export default function SocialStories() {
  return (
    <AIToolPage
      title="Social Stories Generator"
      description="Create personalised Carol Gray-style social stories for autism and behaviour support"
      icon={<BookHeart className="w-5 h-5 text-white" />}
      accentColor="bg-rose-500"
      fields={[
        { id: "studentName", label: "Student's Name", type: "text", placeholder: "e.g. Alex", required: true, span: "half" },
        { id: "ageRange", label: "Age Range", type: "select", options: ages, required: true, span: "half" },
        { id: "situation", label: "Situation / Topic", type: "select", options: situations, required: true, span: "half" },
        { id: "customSituation", label: "Or describe a custom situation", type: "text", placeholder: "e.g. Moving to secondary school", span: "half" },
        { id: "challenge", label: "Specific Challenge / Behaviour", type: "textarea", placeholder: "What does the student find difficult about this situation?", required: true, span: "full" },
        { id: "interests", label: "Student's Interests (optional)", type: "text", placeholder: "e.g. trains, Minecraft, dinosaurs — to personalise the story", span: "full" },
        { id: "perspective", label: "Perspective Sentences", type: "select", options: [{ value: "yes", label: "Include (recommended)" }, { value: "no", label: "Exclude" }], span: "half" },
        { id: "length", label: "Story Length", type: "select", options: [{ value: "short", label: "Short (6-8 sentences)" }, { value: "medium", label: "Medium (10-14 sentences)" }, { value: "long", label: "Long (16-20 sentences)" }], span: "half" },
      ]}
      buildPrompt={(v) => ({
        system: `You are an expert in autism education and Carol Gray's Social Stories™ methodology. You write social stories that follow the 10.2 ratio (for every directive/control sentence, there are at least 2 descriptive/perspective sentences). Your stories are warm, positive, and empowering — never negative or threatening. You write in first person, present tense, using simple language appropriate for the age group.`,
        user: `Write a Social Story for:

Name: ${v.studentName}
Age: ${v.ageRange}
Situation: ${v.customSituation || v.situation}
Challenge: ${v.challenge}
${v.interests ? `Interests to incorporate: ${v.interests}` : ""}
Length: ${v.length || "medium"}
Include perspective sentences: ${v.perspective !== "no" ? "Yes" : "No"}

Follow Carol Gray's Social Stories™ format:
- Title that describes the situation positively
- Descriptive sentences (what happens, where, who is involved)
- Perspective sentences (how others think/feel — if included)
- Coaching sentences (what the student can try)
- Affirmative sentences (values, reassurance)
- Control sentences (strategies the student chooses)

Write in first person ("I"), present tense. Use simple, clear language. Be warm and positive. End with an affirming statement. After the story, provide a brief "How to Use This Story" note for the teacher/parent.`,
        maxTokens: 2000,
      })}
      outputTitle={(v) => `Social Story: ${v.customSituation || v.situation} — ${v.studentName}`}
    />
  );
}
