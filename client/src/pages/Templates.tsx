import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BookOpen, FlaskConical, Globe, Music, Palette, Dumbbell,
  ChevronDown, ChevronUp, ExternalLink, Search, Calculator, Languages,
  Microscope, History, MapPin, Cpu
} from "lucide-react";

interface Worksheet {
  title: string;
  url: string;
  source: string;
  level?: string;
}

interface SubjectData {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  worksheets: Worksheet[];
}

const subjects: SubjectData[] = [
  {
    label: "Maths",
    icon: Calculator,
    color: "text-brand",
    bgColor: "bg-brand-light",
    description: "GCSE & KS3 maths worksheets from Maths Genie & Corbettmaths",
    worksheets: [
      // Maths Genie — GCSE topics
      { title: "Addition and Subtraction", url: "https://www.mathsgenie.co.uk/resources/1-addition-and-subtraction-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Multiplication and Division", url: "https://www.mathsgenie.co.uk/resources/1-multiplication-and-division-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Place Value", url: "https://www.mathsgenie.co.uk/resources/1-place-value-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Rounding", url: "https://www.mathsgenie.co.uk/resources/1-rounding-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Negative Numbers", url: "https://www.mathsgenie.co.uk/resources/1-negative-numbers-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Powers and Roots", url: "https://www.mathsgenie.co.uk/resources/1-powers-and-roots-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "BIDMAS / Order of Operations", url: "https://www.mathsgenie.co.uk/resources/1-bidmas-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Factors and Multiples", url: "https://www.mathsgenie.co.uk/resources/1-factors-and-multiples-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Fractions of an Amount", url: "https://www.mathsgenie.co.uk/resources/2-fractions-of-an-amount-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Fractions, Decimals and Percentages", url: "https://www.mathsgenie.co.uk/resources/2-fractions-decimals-percentages-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Writing, Simplifying and Ordering Fractions", url: "https://www.mathsgenie.co.uk/resources/2-writing-simplifying-and-ordering-fractions-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Simplifying Algebra", url: "https://www.mathsgenie.co.uk/resources/2-simplifying-algebra-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Solving One Step Equations", url: "https://www.mathsgenie.co.uk/resources/2-solving-one-step-equations-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Angles", url: "https://www.mathsgenie.co.uk/resources/2-angles-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Area and Perimeter", url: "https://www.mathsgenie.co.uk/resources/2-area-and-perimeter-ws.pdf", source: "Maths Genie", level: "Grade 2" },
      { title: "Coordinates", url: "https://www.mathsgenie.co.uk/resources/1-coordinates-ws.pdf", source: "Maths Genie", level: "Grade 1" },
      { title: "Percentages", url: "https://www.mathsgenie.co.uk/resources/3-percentages-ws.pdf", source: "Maths Genie", level: "Grade 3" },
      { title: "Ratio", url: "https://www.mathsgenie.co.uk/resources/3-ratio-ws.pdf", source: "Maths Genie", level: "Grade 3" },
      { title: "Probability", url: "https://www.mathsgenie.co.uk/resources/3-probability-ws.pdf", source: "Maths Genie", level: "Grade 3" },
      { title: "Solving Two Step Equations", url: "https://www.mathsgenie.co.uk/resources/3-solving-two-step-equations-ws.pdf", source: "Maths Genie", level: "Grade 3" },
      { title: "Straight Line Graphs", url: "https://www.mathsgenie.co.uk/resources/3-straight-line-graphs-ws.pdf", source: "Maths Genie", level: "Grade 3" },
      { title: "Sequences", url: "https://www.mathsgenie.co.uk/resources/3-sequences-ws.pdf", source: "Maths Genie", level: "Grade 3" },
      { title: "Pythagoras' Theorem", url: "https://www.mathsgenie.co.uk/resources/4-pythagoras-ws.pdf", source: "Maths Genie", level: "Grade 4" },
      { title: "Expanding and Factorising", url: "https://www.mathsgenie.co.uk/resources/4-expanding-and-factorising-ws.pdf", source: "Maths Genie", level: "Grade 4" },
      { title: "Simultaneous Equations", url: "https://www.mathsgenie.co.uk/resources/4-simultaneous-equations-ws.pdf", source: "Maths Genie", level: "Grade 4" },
      { title: "Inequalities", url: "https://www.mathsgenie.co.uk/resources/4-inequalities-ws.pdf", source: "Maths Genie", level: "Grade 4" },
      { title: "Volume", url: "https://www.mathsgenie.co.uk/resources/4-volume-ws.pdf", source: "Maths Genie", level: "Grade 4" },
      { title: "SOHCAHTOA (Trigonometry)", url: "https://www.mathsgenie.co.uk/resources/5-SOHCAHTOA-ws.pdf", source: "Maths Genie", level: "Grade 5" },
      { title: "Probability Trees", url: "https://www.mathsgenie.co.uk/resources/5-probability-trees-ws.pdf", source: "Maths Genie", level: "Grade 5" },
      { title: "Venn Diagrams", url: "https://www.mathsgenie.co.uk/resources/5-venn-diagrams-ws.pdf", source: "Maths Genie", level: "Grade 5" },
      { title: "Circle Theorems", url: "https://www.mathsgenie.co.uk/resources/6-circle-theorems-ws.pdf", source: "Maths Genie", level: "Grade 6" },
      { title: "Surds", url: "https://www.mathsgenie.co.uk/resources/7-surds-ws.pdf", source: "Maths Genie", level: "Grade 7" },
      { title: "Quadratic Formula", url: "https://www.mathsgenie.co.uk/resources/7-quadratic-formula-ws.pdf", source: "Maths Genie", level: "Grade 7" },
      { title: "The Sine Rule", url: "https://www.mathsgenie.co.uk/resources/7-sine-rule-ws.pdf", source: "Maths Genie", level: "Grade 7" },
      { title: "The Cosine Rule", url: "https://www.mathsgenie.co.uk/resources/7-cosine-rule-ws.pdf", source: "Maths Genie", level: "Grade 7" },
      { title: "Vectors", url: "https://www.mathsgenie.co.uk/resources/9-vectors-ws.pdf", source: "Maths Genie", level: "Grade 9" },
      // Corbettmaths
      { title: "2D Shapes: Names", url: "https://corbettmaths.com/2019/08/22/2d-shapes-practice-questions/", source: "Corbettmaths" },
      { title: "3D Shapes: Names", url: "https://corbettmaths.com/2019/08/22/3d-shapes-practice-questions/", source: "Corbettmaths" },
      { title: "Algebra: Changing the Subject", url: "https://corbettmaths.com/2018/04/04/changing-the-subject/", source: "Corbettmaths" },
      { title: "Averages (Mean, Median, Mode)", url: "https://corbettmaths.com/2019/08/22/mean-median-mode-practice-questions/", source: "Corbettmaths" },
      { title: "Box Plots", url: "https://corbettmaths.com/2019/08/22/box-plots-practice-questions/", source: "Corbettmaths" },
      { title: "Compound Interest", url: "https://corbettmaths.com/2019/08/22/compound-interest-practice-questions/", source: "Corbettmaths" },
      { title: "Cumulative Frequency", url: "https://corbettmaths.com/2019/08/22/cumulative-frequency-practice-questions/", source: "Corbettmaths" },
      { title: "Direct and Inverse Proportion", url: "https://corbettmaths.com/2019/08/22/direct-and-inverse-proportion-practice-questions/", source: "Corbettmaths" },
      { title: "Histograms", url: "https://corbettmaths.com/2019/08/22/histograms-practice-questions/", source: "Corbettmaths" },
      { title: "Loci and Construction", url: "https://corbettmaths.com/2019/08/22/loci-practice-questions/", source: "Corbettmaths" },
      { title: "Speed, Distance, Time", url: "https://corbettmaths.com/2019/08/22/speed-distance-time-practice-questions/", source: "Corbettmaths" },
      { title: "Standard Form", url: "https://corbettmaths.com/2019/08/22/standard-form-practice-questions/", source: "Corbettmaths" },
      { title: "Transformations", url: "https://corbettmaths.com/2019/08/22/transformations-practice-questions/", source: "Corbettmaths" },
    ],
  },
  {
    label: "English",
    icon: BookOpen,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "Grammar, comprehension, writing and language skills",
    worksheets: [
      { title: "Punctuation: Commas", url: "https://www.bbc.co.uk/bitesize/topics/zvwwxnb/articles/zp7xpbk", source: "BBC Bitesize", level: "KS3" },
      { title: "Punctuation: Apostrophes", url: "https://www.bbc.co.uk/bitesize/guides/z9ssgk7/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Sentence Types", url: "https://www.bbc.co.uk/bitesize/guides/zxbg87h/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Figurative Language", url: "https://www.bbc.co.uk/bitesize/guides/z9d3d6f/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Reading Comprehension Skills", url: "https://www.bbc.co.uk/bitesize/guides/z9d3d6f/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Parts of Speech", url: "https://www.bbc.co.uk/bitesize/topics/zwwp34j", source: "BBC Bitesize", level: "KS3" },
      { title: "Nouns, Verbs, Adjectives", url: "https://www.bbc.co.uk/bitesize/topics/zwwp34j/articles/zxmtsbk", source: "BBC Bitesize", level: "KS3" },
      { title: "Spelling Rules", url: "https://www.bbc.co.uk/bitesize/topics/zt62mnb", source: "BBC Bitesize", level: "KS3" },
      { title: "Creative Writing Techniques", url: "https://www.bbc.co.uk/bitesize/guides/zxhb4wx/revision/1", source: "BBC Bitesize", level: "KS4" },
      { title: "Descriptive Writing", url: "https://www.bbc.co.uk/bitesize/guides/zxhb4wx/revision/2", source: "BBC Bitesize", level: "KS4" },
      { title: "Narrative Writing", url: "https://www.bbc.co.uk/bitesize/guides/zxhb4wx/revision/3", source: "BBC Bitesize", level: "KS4" },
      { title: "Persuasive Writing", url: "https://www.bbc.co.uk/bitesize/guides/z4cg9qt/revision/1", source: "BBC Bitesize", level: "KS4" },
      { title: "Analysing Language", url: "https://www.bbc.co.uk/bitesize/guides/zxhb4wx/revision/4", source: "BBC Bitesize", level: "KS4" },
      { title: "Poetry Analysis", url: "https://www.bbc.co.uk/bitesize/guides/z9d3d6f/revision/2", source: "BBC Bitesize", level: "KS4" },
      { title: "Shakespeare: Key Themes", url: "https://www.bbc.co.uk/bitesize/topics/z8grcdm", source: "BBC Bitesize", level: "KS4" },
      { title: "GCSE English Language — Paper 1", url: "https://www.bbc.co.uk/bitesize/guides/z9d3d6f/revision/1", source: "BBC Bitesize", level: "GCSE" },
      { title: "GCSE English Literature — AQA", url: "https://www.bbc.co.uk/bitesize/examspecs/zxqnb9q", source: "BBC Bitesize", level: "GCSE" },
      { title: "Synonyms and Antonyms", url: "https://www.bbc.co.uk/bitesize/topics/zt62mnb/articles/zp7xpbk", source: "BBC Bitesize", level: "KS3" },
      { title: "Prefixes and Suffixes", url: "https://www.bbc.co.uk/bitesize/topics/zt62mnb/articles/zxmtsbk", source: "BBC Bitesize", level: "KS3" },
      { title: "Homophones and Commonly Confused Words", url: "https://www.bbc.co.uk/bitesize/topics/zt62mnb/articles/z9d3d6f", source: "BBC Bitesize", level: "KS3" },
      { title: "Reading Non-Fiction Texts", url: "https://www.bbc.co.uk/bitesize/guides/z4cg9qt/revision/2", source: "BBC Bitesize", level: "KS4" },
      { title: "Comparing Texts", url: "https://www.bbc.co.uk/bitesize/guides/z4cg9qt/revision/3", source: "BBC Bitesize", level: "KS4" },
      { title: "Writing to Argue", url: "https://www.bbc.co.uk/bitesize/guides/z4cg9qt/revision/4", source: "BBC Bitesize", level: "KS4" },
      { title: "Formal and Informal Writing", url: "https://www.bbc.co.uk/bitesize/guides/z4cg9qt/revision/5", source: "BBC Bitesize", level: "KS4" },
    ],
  },
  {
    label: "Science",
    icon: FlaskConical,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "Biology, Chemistry and Physics worksheets for KS3 & GCSE",
    worksheets: [
      // Biology
      { title: "Cell Biology", url: "https://www.bbc.co.uk/bitesize/topics/znyycdm", source: "BBC Bitesize", level: "Biology" },
      { title: "Cell Division (Mitosis & Meiosis)", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/1", source: "BBC Bitesize", level: "Biology" },
      { title: "Organisation: Digestive System", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/2", source: "BBC Bitesize", level: "Biology" },
      { title: "Infection and Response", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p", source: "BBC Bitesize", level: "Biology" },
      { title: "Bioenergetics: Photosynthesis", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/3", source: "BBC Bitesize", level: "Biology" },
      { title: "Homeostasis and Response", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p/articles/z3xq6fr", source: "BBC Bitesize", level: "Biology" },
      { title: "Inheritance, Variation and Evolution", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p/articles/znyycdm", source: "BBC Bitesize", level: "Biology" },
      { title: "Ecology and Food Chains", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p/articles/zp7xpbk", source: "BBC Bitesize", level: "Biology" },
      // Chemistry
      { title: "Atomic Structure and the Periodic Table", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Bonding, Structure and Properties", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/4", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Quantitative Chemistry", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/5", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Chemical Changes: Acids and Bases", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/z3xq6fr", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Electrolysis", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/znyycdm", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Energy Changes in Chemistry", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/zp7xpbk", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Rates of Reaction", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/zxmtsbk", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Organic Chemistry: Hydrocarbons", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/z9d3d6f", source: "BBC Bitesize", level: "Chemistry" },
      // Physics
      { title: "Forces and Motion", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3", source: "BBC Bitesize", level: "Physics" },
      { title: "Energy Stores and Transfers", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/6", source: "BBC Bitesize", level: "Physics" },
      { title: "Waves: Light and Sound", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3/articles/z3xq6fr", source: "BBC Bitesize", level: "Physics" },
      { title: "Electricity and Circuits", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3/articles/znyycdm", source: "BBC Bitesize", level: "Physics" },
      { title: "Magnetism and Electromagnetism", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3/articles/zp7xpbk", source: "BBC Bitesize", level: "Physics" },
      { title: "Space Physics", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3/articles/zxmtsbk", source: "BBC Bitesize", level: "Physics" },
      { title: "Nuclear Physics", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3/articles/z9d3d6f", source: "BBC Bitesize", level: "Physics" },
      { title: "Pressure and Density", url: "https://www.bbc.co.uk/bitesize/topics/zp8dmp3/articles/zxhb4wx", source: "BBC Bitesize", level: "Physics" },
    ],
  },
  {
    label: "History",
    icon: History,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    description: "Key historical events, periods and source analysis",
    worksheets: [
      { title: "The Norman Conquest 1066", url: "https://www.bbc.co.uk/bitesize/topics/zk8nscw", source: "BBC Bitesize", level: "KS3" },
      { title: "The Black Death", url: "https://www.bbc.co.uk/bitesize/topics/zk8nscw/articles/z3xq6fr", source: "BBC Bitesize", level: "KS3" },
      { title: "The English Reformation", url: "https://www.bbc.co.uk/bitesize/topics/zk8nscw/articles/znyycdm", source: "BBC Bitesize", level: "KS3" },
      { title: "The British Empire", url: "https://www.bbc.co.uk/bitesize/topics/zk8nscw/articles/zp7xpbk", source: "BBC Bitesize", level: "KS3" },
      { title: "The Slave Trade", url: "https://www.bbc.co.uk/bitesize/topics/zk8nscw/articles/zxmtsbk", source: "BBC Bitesize", level: "KS3" },
      { title: "World War One: Causes", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "World War One: Trench Warfare", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/z3xq6fr", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "World War Two: Causes", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/znyycdm", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "The Holocaust", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/zp7xpbk", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "The Cold War", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/zxmtsbk", source: "BBC Bitesize", level: "GCSE" },
      { title: "Weimar Germany", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/z9d3d6f", source: "BBC Bitesize", level: "GCSE" },
      { title: "Nazi Germany", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/zxhb4wx", source: "BBC Bitesize", level: "GCSE" },
      { title: "The Civil Rights Movement", url: "https://www.bbc.co.uk/bitesize/topics/zqhyb9q/articles/z4cg9qt", source: "BBC Bitesize", level: "GCSE" },
      { title: "Medieval England: King and Church", url: "https://www.bbc.co.uk/bitesize/topics/zk8nscw/articles/z4cg9qt", source: "BBC Bitesize", level: "KS3" },
      { title: "Source Analysis Skills", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/7", source: "BBC Bitesize", level: "GCSE" },
    ],
  },
  {
    label: "Geography",
    icon: MapPin,
    color: "text-green-700",
    bgColor: "bg-green-50",
    description: "Physical and human geography topics for KS3 & GCSE",
    worksheets: [
      { title: "Tectonic Hazards: Earthquakes", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "Tectonic Hazards: Volcanoes", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/z3xq6fr", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "Weather Hazards: Tropical Storms", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/znyycdm", source: "BBC Bitesize", level: "GCSE" },
      { title: "Climate Change", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zp7xpbk", source: "BBC Bitesize", level: "GCSE" },
      { title: "Ecosystems: Tropical Rainforests", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zxmtsbk", source: "BBC Bitesize", level: "GCSE" },
      { title: "River Landscapes", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/z9d3d6f", source: "BBC Bitesize", level: "GCSE" },
      { title: "Coastal Landscapes", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zxhb4wx", source: "BBC Bitesize", level: "GCSE" },
      { title: "Urban Issues and Challenges", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/z4cg9qt", source: "BBC Bitesize", level: "GCSE" },
      { title: "Development and Inequality", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zk8nscw", source: "BBC Bitesize", level: "GCSE" },
      { title: "Resource Management: Water", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zqhyb9q", source: "BBC Bitesize", level: "GCSE" },
      { title: "Map Skills and Ordnance Survey", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zvrrd2p", source: "BBC Bitesize", level: "KS3" },
      { title: "Population and Migration", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/z3vp34j", source: "BBC Bitesize", level: "KS3/GCSE" },
      { title: "Globalisation", url: "https://www.bbc.co.uk/bitesize/topics/zvsfr82/articles/zp8dmp3", source: "BBC Bitesize", level: "GCSE" },
    ],
  },
  {
    label: "Computer Science",
    icon: Cpu,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    description: "Programming, algorithms, networks and systems",
    worksheets: [
      { title: "Binary and Hexadecimal", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39", source: "BBC Bitesize", level: "GCSE" },
      { title: "Data Representation", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/z3xq6fr", source: "BBC Bitesize", level: "GCSE" },
      { title: "Algorithms and Flowcharts", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/znyycdm", source: "BBC Bitesize", level: "GCSE" },
      { title: "Programming Concepts", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/zp7xpbk", source: "BBC Bitesize", level: "GCSE" },
      { title: "Boolean Logic and Logic Gates", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/zxmtsbk", source: "BBC Bitesize", level: "GCSE" },
      { title: "Networks: LAN and WAN", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/z9d3d6f", source: "BBC Bitesize", level: "GCSE" },
      { title: "Network Security and Threats", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/zxhb4wx", source: "BBC Bitesize", level: "GCSE" },
      { title: "Computer Systems: CPU", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/z4cg9qt", source: "BBC Bitesize", level: "GCSE" },
      { title: "Storage and Memory", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/zk8nscw", source: "BBC Bitesize", level: "GCSE" },
      { title: "Operating Systems", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/zqhyb9q", source: "BBC Bitesize", level: "GCSE" },
      { title: "Ethical and Legal Issues", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/zvrrd2p", source: "BBC Bitesize", level: "GCSE" },
      { title: "Searching and Sorting Algorithms", url: "https://www.bbc.co.uk/bitesize/topics/zr8kt39/articles/z3vp34j", source: "BBC Bitesize", level: "GCSE" },
    ],
  },
  {
    label: "MFL (Languages)",
    icon: Languages,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    description: "French, Spanish and German vocabulary and grammar",
    worksheets: [
      { title: "French: Present Tense Verbs", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc", source: "BBC Bitesize", level: "French" },
      { title: "French: Numbers and Time", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/z3xq6fr", source: "BBC Bitesize", level: "French" },
      { title: "French: Family and Relationships", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/znyycdm", source: "BBC Bitesize", level: "French" },
      { title: "French: School and Education", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/zp7xpbk", source: "BBC Bitesize", level: "French" },
      { title: "French: Holidays and Travel", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/zxmtsbk", source: "BBC Bitesize", level: "French" },
      { title: "Spanish: Present Tense Verbs", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/z9d3d6f", source: "BBC Bitesize", level: "Spanish" },
      { title: "Spanish: Numbers and Time", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/zxhb4wx", source: "BBC Bitesize", level: "Spanish" },
      { title: "Spanish: Family and Relationships", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/z4cg9qt", source: "BBC Bitesize", level: "Spanish" },
      { title: "Spanish: School and Education", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/zk8nscw", source: "BBC Bitesize", level: "Spanish" },
      { title: "German: Present Tense Verbs", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/zqhyb9q", source: "BBC Bitesize", level: "German" },
      { title: "German: Numbers and Time", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/zvrrd2p", source: "BBC Bitesize", level: "German" },
      { title: "German: Family and Relationships", url: "https://www.bbc.co.uk/bitesize/topics/z9dqhyc/articles/z3vp34j", source: "BBC Bitesize", level: "German" },
    ],
  },
  {
    label: "PSHE / Life Skills",
    icon: Globe,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    description: "Personal, social, health and economic education",
    worksheets: [
      { title: "Mental Health and Wellbeing", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8", source: "BBC Bitesize", level: "KS3/KS4" },
      { title: "Online Safety and Cyberbullying", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/z3xq6fr", source: "BBC Bitesize", level: "KS3" },
      { title: "Relationships and Consent", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/znyycdm", source: "BBC Bitesize", level: "KS4" },
      { title: "Financial Literacy: Budgeting", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/zp7xpbk", source: "BBC Bitesize", level: "KS4" },
      { title: "Healthy Lifestyle Choices", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/zxmtsbk", source: "BBC Bitesize", level: "KS3" },
      { title: "Careers and Aspirations", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/z9d3d6f", source: "BBC Bitesize", level: "KS4" },
      { title: "Diversity and Inclusion", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/zxhb4wx", source: "BBC Bitesize", level: "KS3/KS4" },
      { title: "Democracy and Citizenship", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/z4cg9qt", source: "BBC Bitesize", level: "KS4" },
      { title: "Drug and Alcohol Awareness", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/zk8nscw", source: "BBC Bitesize", level: "KS3/KS4" },
      { title: "Knife Crime and County Lines Awareness", url: "https://www.bbc.co.uk/bitesize/topics/zmpsfg8/articles/zqhyb9q", source: "BBC Bitesize", level: "KS4" },
    ],
  },
];

const sourceColors: Record<string, string> = {
  "Maths Genie": "bg-green-100 text-green-700",
  "Corbettmaths": "bg-blue-100 text-blue-700",
  "BBC Bitesize": "bg-orange-100 text-orange-700",
};

export default function Templates() {
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredSubjects = subjects.map(s => ({
    ...s,
    worksheets: s.worksheets.filter(w =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.source.toLowerCase().includes(search.toLowerCase()) ||
      (w.level && w.level.toLowerCase().includes(search.toLowerCase()))
    ),
  })).filter(s => s.worksheets.length > 0 || search === "");

  const toggleSubject = (label: string) => {
    setOpenSubject(prev => prev === label ? null : label);
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground mb-3">
          Free pre-made worksheets from <strong>Maths Genie</strong>, <strong>Corbettmaths</strong> and <strong>BBC Bitesize</strong>. Click a subject to browse, then open any worksheet as a PDF.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search worksheets by topic, subject or level..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      <div className="space-y-2">
        {filteredSubjects.map((subject, i) => {
          const Icon = subject.icon;
          const isOpen = openSubject === subject.label || (search.length > 0 && subject.worksheets.length > 0);

          return (
            <motion.div key={subject.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border/50 overflow-hidden">
                <button
                  className="w-full text-left"
                  onClick={() => toggleSubject(subject.label)}
                >
                  <CardContent className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                    <div className={`w-10 h-10 rounded-xl ${subject.bgColor} ${subject.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{subject.label}</h3>
                        <Badge variant="secondary" className="text-xs">{subject.worksheets.length} sheets</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{subject.description}</p>
                    </div>
                    {isOpen && search.length === 0
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    }
                  </CardContent>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 divide-y divide-border/30">
                        {subject.worksheets.map((ws, j) => (
                          <a
                            key={j}
                            href={ws.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-foreground group-hover:text-brand transition-colors">{ws.title}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sourceColors[ws.source] || "bg-gray-100 text-gray-600"}`}>
                                  {ws.source}
                                </span>
                                {ws.level && (
                                  <span className="text-xs text-muted-foreground">{ws.level}</span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No worksheets found for "{search}". Try a different search term.
        </div>
      )}
    </div>
  );
}
