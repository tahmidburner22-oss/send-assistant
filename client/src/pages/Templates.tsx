import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, BookOpen, FlaskConical, Globe, Music, Palette, Dumbbell,
  ChevronDown, ChevronUp, ExternalLink, Search, Calculator, Languages,
  Microscope, History, MapPin, Cpu, Image, ZoomIn, Loader2, BookMarked
} from "lucide-react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";

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
          worksheets: [
      { title: "Addition and Subtraction", url: "https://www.bbc.co.uk/bitesize/topics/z9tgn39", source: "BBC Bitesize", level: "KS3" },
      { title: "Multiplication and Division", url: "https://www.bbc.co.uk/bitesize/topics/zqbpk2p", source: "BBC Bitesize", level: "KS3" },
      { title: "Place Value and Rounding", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Fractions", url: "https://www.bbc.co.uk/bitesize/topics/z9tgn39/articles/zx7xp9q", source: "BBC Bitesize", level: "KS3" },
      { title: "Decimals and Percentages", url: "https://www.bbc.co.uk/bitesize/guides/zs9tgn3/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Ratio and Proportion", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Algebra — Simplifying Expressions", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/2", source: "BBC Bitesize", level: "KS3" },
      { title: "Solving Equations", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Sequences and nth Term", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/1", source: "BBC Bitesize", level: "KS3" },
      { title: "Coordinates and Graphs", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/3", source: "BBC Bitesize", level: "KS3" },
      { title: "Angles and Polygons", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/2", source: "BBC Bitesize", level: "KS3" },
      { title: "Area and Perimeter", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/2", source: "BBC Bitesize", level: "KS3" },
      { title: "Transformations", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/4", source: "BBC Bitesize", level: "KS3" },
      { title: "Probability", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/2", source: "BBC Bitesize", level: "KS3" },
      { title: "Statistics — Mean, Median, Mode", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/3", source: "BBC Bitesize", level: "KS3" },
      { title: "Pythagoras' Theorem", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/5", source: "BBC Bitesize", level: "GCSE" },
      { title: "Trigonometry — SOHCAHTOA", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/3", source: "BBC Bitesize", level: "GCSE" },
      { title: "Quadratic Equations", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/3", source: "BBC Bitesize", level: "GCSE" },
      { title: "Simultaneous Equations", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/4", source: "BBC Bitesize", level: "GCSE" },
      { title: "Circle Theorems", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/6", source: "BBC Bitesize", level: "GCSE" },
      { title: "Vectors", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/4", source: "BBC Bitesize", level: "GCSE" },
      { title: "Surds and Indices", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/4", source: "BBC Bitesize", level: "GCSE" },
      { title: "Standard Form", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/5", source: "BBC Bitesize", level: "GCSE" },
      { title: "Cumulative Frequency and Box Plots", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/7", source: "BBC Bitesize", level: "GCSE" },
      { title: "Histograms", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/5", source: "BBC Bitesize", level: "GCSE" },
      { title: "Compound Interest", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/5", source: "BBC Bitesize", level: "GCSE" },
      { title: "Direct and Inverse Proportion", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/6", source: "BBC Bitesize", level: "GCSE" },
      { title: "Loci and Construction", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/8", source: "BBC Bitesize", level: "GCSE" },
      { title: "Speed, Distance, Time", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/6", source: "BBC Bitesize", level: "GCSE" },
      { title: "Negative Numbers", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/6", source: "BBC Bitesize", level: "KS3" },
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
      { title: "Cell Biology", url: "https://www.bbc.co.uk/bitesize/topics/znyycdm", source: "BBC Bitesize", level: "Biology" },
      { title: "Cell Division (Mitosis & Meiosis)", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/1", source: "BBC Bitesize", level: "Biology" },
      { title: "Organisation: Digestive System", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/2", source: "BBC Bitesize", level: "Biology" },
      { title: "Infection and Response", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p", source: "BBC Bitesize", level: "Biology" },
      { title: "Bioenergetics: Photosynthesis", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/3", source: "BBC Bitesize", level: "Biology" },
      { title: "Homeostasis and Response", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p/articles/z3xq6fr", source: "BBC Bitesize", level: "Biology" },
      { title: "Inheritance, Variation and Evolution", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p/articles/znyycdm", source: "BBC Bitesize", level: "Biology" },
      { title: "Ecology and Food Chains", url: "https://www.bbc.co.uk/bitesize/topics/zvrrd2p/articles/zp7xpbk", source: "BBC Bitesize", level: "Biology" },
      { title: "Atomic Structure and the Periodic Table", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Bonding, Structure and Properties", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/4", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Quantitative Chemistry", url: "https://www.bbc.co.uk/bitesize/guides/z3xq6fr/revision/5", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Chemical Changes: Acids and Bases", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/z3xq6fr", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Electrolysis", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/znyycdm", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Energy Changes in Chemistry", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/zp7xpbk", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Rates of Reaction", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/zxmtsbk", source: "BBC Bitesize", level: "Chemistry" },
      { title: "Organic Chemistry: Hydrocarbons", url: "https://www.bbc.co.uk/bitesize/topics/z3vp34j/articles/z9d3d6f", source: "BBC Bitesize", level: "Chemistry" },
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
  {
    label: "11+ Preparation",
    icon: BookOpen,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    description: "11+ exam preparation: Verbal Reasoning, Non-Verbal Reasoning, Maths and English",
    worksheets: [
      { title: "Verbal Reasoning: Word Codes", url: "https://www.bond11plus.co.uk/free-papers/verbal-reasoning-sample.pdf", source: "Bond 11+", level: "11+" },
      { title: "Verbal Reasoning: Analogies", url: "https://www.elevenplusexams.co.uk/forum/11plus/files/vr-analogies-practice.pdf", source: "11+ Exams", level: "11+" },
      { title: "Verbal Reasoning: Antonyms and Synonyms", url: "https://www.bbc.co.uk/bitesize/topics/zt62mnb", source: "BBC Bitesize", level: "11+" },
      { title: "Verbal Reasoning: Odd One Out", url: "https://www.elevenplusexams.co.uk/forum/11plus/files/vr-odd-one-out.pdf", source: "11+ Exams", level: "11+" },
      { title: "Verbal Reasoning: Letter Sequences", url: "https://www.elevenplusexams.co.uk/forum/11plus/files/vr-letter-sequences.pdf", source: "11+ Exams", level: "11+" },
      { title: "Non-Verbal Reasoning: Shapes and Patterns", url: "https://www.bond11plus.co.uk/free-papers/non-verbal-reasoning-sample.pdf", source: "Bond 11+", level: "11+" },
      { title: "Non-Verbal Reasoning: Matrices", url: "https://www.elevenplusexams.co.uk/forum/11plus/files/nvr-matrices.pdf", source: "11+ Exams", level: "11+" },
      { title: "Non-Verbal Reasoning: Rotations and Reflections", url: "https://www.elevenplusexams.co.uk/forum/11plus/files/nvr-rotations.pdf", source: "11+ Exams", level: "11+" },
      { title: "Non-Verbal Reasoning: Series Completion", url: "https://www.elevenplusexams.co.uk/forum/11plus/files/nvr-series.pdf", source: "11+ Exams", level: "11+" },
      { title: "11+ Maths: Number and Place Value", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/1", source: "BBC Bitesize", level: "11+" },
      { title: "11+ Maths: Fractions, Decimals and Percentages", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/1", source: "BBC Bitesize", level: "11+" },
      { title: "11+ Maths: Word Problems", url: "https://www.bbc.co.uk/bitesize/guides/zxpv4wx/revision/1", source: "BBC Bitesize", level: "11+" },
      { title: "11+ Maths: Ratio and Proportion", url: "https://www.bbc.co.uk/bitesize/guides/z3rfwmn/revision/1", source: "BBC Bitesize", level: "11+" },
      { title: "11+ Maths: Algebra Basics", url: "https://www.bbc.co.uk/bitesize/guides/z9tgn39/revision/2", source: "BBC Bitesize", level: "11+" },
      { title: "11+ Maths: Shape, Space and Measure", url: "https://www.bbc.co.uk/bitesize/guides/ztppn39/revision/2", source: "BBC Bitesize", level: "11+" },
      { title: "11+ English: Comprehension Practice", url: "https://www.bond11plus.co.uk/free-papers/english-sample.pdf", source: "Bond 11+", level: "11+" },
      { title: "11+ English: Vocabulary and Spelling", url: "https://www.bbc.co.uk/bitesize/topics/zt62mnb", source: "BBC Bitesize", level: "11+" },
      { title: "11+ English: Grammar and Punctuation", url: "https://www.bbc.co.uk/bitesize/topics/zvwwxnb", source: "BBC Bitesize", level: "11+" },
      { title: "11+ English: Creative Writing Starters", url: "https://www.bbc.co.uk/bitesize/guides/zxhb4wx/revision/1", source: "BBC Bitesize", level: "11+" },
    ],
  },
];

const sourceColors: Record<string, string> = {
  "Maths Genie": "bg-green-100 text-green-700",
  "Corbettmaths": "bg-blue-100 text-blue-700",
  "Bond 11+": "bg-orange-100 text-orange-700",
  "11+ Exams": "bg-amber-100 text-amber-700",
  "BBC Bitesize": "bg-yellow-100 text-yellow-700",
};

// ─── Diagram Library Types ───────────────────────────────────────────────────
interface DiagramEntry {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  year_group: string | null;
  description: string | null;
  image_url: string;
  curated: number;
  tags: string[];
}

// ─── Diagram Library Panel ───────────────────────────────────────────────────
function DiagramLibraryPanel() {
  const [entries, setEntries] = useState<DiagramEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState<string>("");
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [search, setSearch] = useState("");
  const [viewEntry, setViewEntry] = useState<DiagramEntry | null>(null);

  useEffect(() => {
    fetch("/api/diagram-library/entries", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        const list: DiagramEntry[] = (data.entries || []).map((e: any) => ({
          ...e,
          tags: (() => { try { return JSON.parse(e.tags || "[]"); } catch { return []; } })(),
        }));
        setEntries(list);
        // Set defaults
        const years = Array.from(new Set(list.map(e => e.year_group || "Other"))).sort();
        if (years.length > 0) {
          setActiveYear(years[0]);
          const firstYearEntries = list.filter(e => (e.year_group || "Other") === years[0]);
          const subjects = Array.from(new Set(firstYearEntries.map(e => e.subject || "Other"))).sort();
          if (subjects.length > 0) setActiveSubject(subjects[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive year groups and subjects
  const yearGroups = Array.from(new Set(entries.map(e => e.year_group || "Other"))).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 999;
    const numB = parseInt(b.replace(/\D/g, "")) || 999;
    return numA - numB;
  });

  const subjectsForYear = Array.from(
    new Set(entries.filter(e => (e.year_group || "Other") === activeYear).map(e => e.subject || "Other"))
  ).sort();

  // Filter entries for current year + subject + search
  const filteredEntries = entries.filter(e => {
    const matchYear = (e.year_group || "Other") === activeYear;
    const matchSubject = (e.subject || "Other") === activeSubject;
    const matchSearch = search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.topic || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.subject || "").toLowerCase().includes(search.toLowerCase());
    return matchYear && matchSubject && matchSearch;
  });

  // When year changes, reset subject to first available
  const handleYearChange = (year: string) => {
    setActiveYear(year);
    const firstSubjects = Array.from(
      new Set(entries.filter(e => (e.year_group || "Other") === year).map(e => e.subject || "Other"))
    ).sort();
    setActiveSubject(firstSubjects[0] || "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        <span className="text-sm">Loading diagram library…</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No diagrams in the library yet.</p>
        <p className="text-xs mt-1">Diagrams will appear here once they are added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search diagrams by topic, subject or title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Year Group Tabs */}
      <Tabs value={activeYear} onValueChange={handleYearChange}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted/50 p-1 rounded-xl w-full justify-start">
          {yearGroups.map(year => {
            const count = entries.filter(e => (e.year_group || "Other") === year).length;
            return (
              <TabsTrigger
                key={year}
                value={year}
                className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {year}
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {yearGroups.map(year => (
          <TabsContent key={year} value={year} className="mt-3">
            {/* Subject Sub-Tabs */}
            {subjectsForYear.length > 1 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {subjectsForYear.map(subj => {
                  const subjCount = entries.filter(e =>
                    (e.year_group || "Other") === year && (e.subject || "Other") === subj
                  ).length;
                  return (
                    <button
                      key={subj}
                      onClick={() => setActiveSubject(subj)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                        activeSubject === subj
                          ? "bg-brand text-white border-brand"
                          : "bg-background text-muted-foreground border-border hover:border-brand hover:text-brand"
                      }`}
                    >
                      {subj}
                      <span className="ml-1 opacity-70">({subjCount})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Diagram Grid */}
            {filteredEntries.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {search ? `No diagrams found for "${search}"` : "No diagrams available for this selection."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredEntries.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group cursor-pointer rounded-xl border border-border/50 overflow-hidden hover:shadow-md hover:border-brand/40 transition-all bg-background"
                    onClick={() => setViewEntry(entry)}
                  >
                    <div className="aspect-[3/4] bg-muted/30 overflow-hidden relative">
                      {entry.image_url ? (
                        <img
                          src={entry.image_url}
                          alt={entry.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                      {entry.curated ? (
                        <div className="absolute top-1.5 right-1.5 bg-amber-400 text-amber-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          ★ Curated
                        </div>
                      ) : null}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-foreground truncate leading-tight">{entry.title}</p>
                      {entry.topic && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entry.topic}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Lightbox Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={open => !open && setViewEntry(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-base">{viewEntry?.title}</DialogTitle>
            <div className="flex gap-2 flex-wrap mt-1">
              {viewEntry?.subject && <Badge variant="outline" className="text-xs">{viewEntry.subject}</Badge>}
              {viewEntry?.year_group && <Badge variant="secondary" className="text-xs">{viewEntry.year_group}</Badge>}
              {viewEntry?.topic && <Badge variant="outline" className="text-xs">{viewEntry.topic}</Badge>}
            </div>
          </DialogHeader>
          {viewEntry?.image_url && (
            <div className="px-4 pb-4">
              <img
                src={viewEntry.image_url}
                alt={viewEntry.title}
                className="w-full rounded-lg border border-border/50 shadow-sm"
              />
            </div>
          )}
          {viewEntry?.description && (
            <p className="px-4 pb-4 text-sm text-muted-foreground">{viewEntry.description}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Templates() {
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState("worksheets");
  const { preferences } = useUserPreferences();

  const filteredSubjects = subjects
    .filter(s => s.label !== "11+ Preparation" || (preferences.show11Plus ?? false))
    .map(s => ({
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
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-4">
      {/* Top-level tabs: Pre-made Worksheets vs Diagram Library */}
      <Tabs value={mainTab} onValueChange={val => { setMainTab(val); setSearch(""); }}>
        <TabsList className="w-full grid grid-cols-2 mb-2">
          <TabsTrigger value="worksheets" className="gap-2">
            <FileText className="w-4 h-4" />
            Pre-made Worksheets
          </TabsTrigger>
          <TabsTrigger value="diagrams" className="gap-2">
            <BookMarked className="w-4 h-4" />
            Diagram Library
          </TabsTrigger>
        </TabsList>

        {/* ── Pre-made Worksheets Tab ── */}
        <TabsContent value="worksheets" className="space-y-4 mt-2">
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
        </TabsContent>

        {/* ── Diagram Library Tab ── */}
        <TabsContent value="diagrams" className="mt-2">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-sm text-muted-foreground mb-4">
              Full-page Nano Banana visual diagrams organised by year group and subject. Click any diagram to view full size.
            </p>
            <DiagramLibraryPanel />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
