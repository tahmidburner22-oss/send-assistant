// GCSE Past Papers Data
// All links direct to official exam board assessment resource pages.
// Teachers should download papers directly from the exam board websites.

export interface PastPaper {
  title: string;
  year: number;
  series: "June" | "November" | "Sample" | "Specimen";
  tier?: "Higher" | "Foundation";
  paperUrl: string;
  markSchemeUrl: string;
}

export interface ExamBoardEntry {
  board: string;
  papers: PastPaper[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  level: "GCSE" | "A-Level" | "Both" | "11+";
  examBoards: ExamBoardEntry[];
}

export const subjects: Subject[] = [
  // ── MATHEMATICS ──────────────────────────────────────────────────────────────
  {
    id: "maths",
    name: "Mathematics",
    icon: "📐",
    color: "blue",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 Non-Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 3 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 3 Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2022, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2022, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2019, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 Non-Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 Non-Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── ENGLISH LANGUAGE ─────────────────────────────────────────────────────────
  {
    id: "english-language",
    name: "English Language",
    icon: "✍️",
    color: "purple",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 2 – Writers' Viewpoints and Perspectives", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 2 – Writers' Viewpoints and Perspectives", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2022, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – Non-Fiction and Transactional Writing", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2019, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Component 1 – Communicating Information and Ideas", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Component 2 – Exploring Effects and Impact", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Component 1 – Communicating Information and Ideas", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── ENGLISH LITERATURE ───────────────────────────────────────────────────────
  {
    id: "english-literature",
    name: "English Literature",
    icon: "📖",
    color: "indigo",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 2 – Modern Texts and Poetry", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 2 – Modern Texts and Poetry", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-language-8700/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Shakespeare and Post-1914 Literature", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – 19th-Century Novel and Poetry Since 1789", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Shakespeare and Post-1914 Literature", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Component 1 – Shakespeare and Poetry Pre-1900", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Component 2 – Exploring Modern and Literary Heritage Texts", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Component 1 – Shakespeare and Poetry Pre-1900", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── BIOLOGY ──────────────────────────────────────────────────────────────────
  {
    id: "biology",
    name: "Biology",
    icon: "🧬",
    color: "green",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── CHEMISTRY ────────────────────────────────────────────────────────────────
  {
    id: "chemistry",
    name: "Chemistry",
    icon: "⚗️",
    color: "orange",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── PHYSICS ──────────────────────────────────────────────────────────────────
  {
    id: "physics",
    name: "Physics",
    icon: "⚛️",
    color: "cyan",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── COMBINED SCIENCE ─────────────────────────────────────────────────────────
  {
    id: "combined-science",
    name: "Combined Science",
    icon: "🔬",
    color: "teal",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          // Biology papers (Combined Science Trilogy)
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Biology Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          // Chemistry papers (Combined Science Trilogy)
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Chemistry Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Chemistry Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          // Physics papers (Combined Science Trilogy)
          { title: "Physics Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Physics Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Physics Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          // 2023 papers
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Chemistry Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Physics Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Biology Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Chemistry Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Physics Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          // 2022 papers
          { title: "Biology Paper 1 (Higher)", year: 2022, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Chemistry Paper 1 (Higher)", year: 2022, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Physics Paper 1 (Higher)", year: 2022, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          // 2019 papers
          { title: "Biology Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Chemistry Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Physics Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Physics Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Chemistry Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Physics Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Chemistry Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Physics Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Physics Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Chemistry Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Physics Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── HISTORY ──────────────────────────────────────────────────────────────────
  {
    id: "history",
    name: "History",
    icon: "🏛️",
    color: "amber",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – Understanding the Modern World", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Shaping the Nation", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Understanding the Modern World", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Shaping the Nation", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Understanding the Modern World", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Thematic Study and Historic Environment", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – Period Study and British Depth Study", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 3 – Modern Depth Study", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Thematic Study and Historic Environment", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Living Under Nazi Rule", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 – The People's Health", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 – Living Under Nazi Rule", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── GEOGRAPHY ────────────────────────────────────────────────────────────────
  {
    id: "geography",
    name: "Geography",
    icon: "🌍",
    color: "emerald",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – Living with the Physical Environment", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Challenges in the Human Environment", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 3 – Geographical Applications", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Living with the Physical Environment", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Living with the Physical Environment", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – The Physical Environment", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – The Human Environment", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – The Physical Environment", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Living in a Globalised World", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 – Geographical Debate", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 – Living in a Globalised World", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── COMPUTER SCIENCE ─────────────────────────────────────────────────────────
  {
    id: "computer-science",
    name: "Computer Science",
    icon: "💻",
    color: "slate",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – Computational Thinking and Programming", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Computing Concepts", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Computational Thinking and Programming", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Computing Concepts", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Computational Thinking and Programming", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Principles of Computer Science", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – Application of Computational Thinking", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Principles of Computer Science", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Computer Systems", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 2 – Computational Thinking, Algorithms and Programming", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
          { title: "Paper 1 – Computer Systems", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/mathematics-j560-from-2015/assessment/" },
        ],
      },
    ],
  },

  // ── ECONOMICS ────────────────────────────────────────────────────────────────
  {
    id: "economics",
    name: "Economics",
    icon: "📊",
    color: "yellow",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – How Markets Work", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – How the Economy Works", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – How Markets Work", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – How Markets Work", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Microeconomics", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – Macroeconomics", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Microeconomics", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
    ],
  },

  // ── PSYCHOLOGY ───────────────────────────────────────────────────────────────
  {
    id: "psychology",
    name: "Psychology",
    icon: "🧠",
    color: "pink",
    level: "GCSE",
    examBoards: [
      {
        board: "AQA",
        papers: [
          { title: "Paper 1 – Cognition and Development", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Social Context and Behaviour", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Cognition and Development", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 2 – Social Context and Behaviour", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
          { title: "Paper 1 – Cognition and Development", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/mathematics/gcse/mathematics-8300/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Psychological Foundations", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 2 – Applications of Psychology", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
          { title: "Paper 1 – Psychological Foundations", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/mathematics-2015.coursematerials.html" },
        ],
      },
    ],
  },
  // ── 11+ ────────────────────────────────────────────────────────────────────────────
  {
    id: "eleven-plus",
    name: "11+ (Eleven Plus)",
    icon: "🌟",
    color: "orange",
    level: "11+",
    examBoards: [
      {
        board: "GL Assessment",
        papers: [
          { title: "Verbal Reasoning Familiarisation Pack (GL Style)", year: 2024, series: "Sample", paperUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/verbal-reasoning.zip", markSchemeUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/verbal-reasoning.zip" },
          { title: "Non-Verbal Reasoning Familiarisation Pack (GL Style)", year: 2024, series: "Sample", paperUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/non-verbal-reasoning.zip", markSchemeUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/non-verbal-reasoning.zip" },
          { title: "Maths Familiarisation Pack (GL Style)", year: 2024, series: "Sample", paperUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/maths.zip", markSchemeUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/maths.zip" },
          { title: "English Familiarisation Pack (GL Style)", year: 2024, series: "Sample", paperUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/english_1.zip", markSchemeUrl: "https://cdn.shopify.com/s/files/1/0681/5498/2630/files/english_1.zip" },
        ],
      },
      {
        board: "CEM (Durham)",
        papers: [
          { title: "CEM Style Verbal Reasoning Practice Paper", year: 2024, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/images/material/bond%2011%20plus%20verbal%20reasoning%20free%20test%20paper.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/Answers_to_Verbal_Reasoning_11_Plus_Practice_Test.pdf" },
          { title: "CEM Style Non-Verbal Reasoning Practice Paper", year: 2024, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/images/material/bond%2011%20plus%20non%20verbal%20reasoning%20free%20test%20paper.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/images/material/bond_11_plus_nvr_10_minute_tests_sample.pdf" },
          { title: "CEM Style Maths Practice Paper", year: 2024, series: "Sample", paperUrl: "http://fdslive.oup.com/www.oup.com/oxed/bond/free-resources/free%20tests/k70634_math_test.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/Answers_to_Maths_11_Plus_Practice_Test.pdf" },
          { title: "CEM Style English Practice Paper", year: 2024, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/4th%20Papers%20level%20English.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/Answers_to_English_11_Plus_Practice_Test.pdf" },
        ],
      },
      {
        board: "Bond 11+",
        papers: [
          { title: "Bond 11+ Verbal Reasoning Practice Paper", year: 2024, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/images/material/bond%2011%20plus%20verbal%20reasoning%20free%20test%20paper.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/Answers_to_Verbal_Reasoning_11_Plus_Practice_Test.pdf" },
          { title: "Bond 11+ Non-Verbal Reasoning Practice Paper", year: 2024, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/images/material/bond%2011%20plus%20non%20verbal%20reasoning%20free%20test%20paper.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/images/material/bond_11_plus_nvr_10_minute_tests_sample.pdf" },
          { title: "Bond 11+ Maths Practice Paper", year: 2024, series: "Sample", paperUrl: "http://fdslive.oup.com/www.oup.com/oxed/bond/free-resources/free%20tests/k70634_math_test.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/Answers_to_Maths_11_Plus_Practice_Test.pdf" },
          { title: "Bond 11+ English Practice Paper", year: 2024, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/4th%20Papers%20level%20English.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/nt-bond/free-resources/Answers_to_English_11_Plus_Practice_Test.pdf" },
        ],
      },
    ],
  },
];

// Derived helpers
export const allYears: string[] = Array.from(
  new Set(subjects.flatMap(s => s.examBoards.flatMap(eb => eb.papers.map(p => String(p.year)))))
).sort((a, b) => Number(b) - Number(a));

export const allBoards: string[] = Array.from(
  new Set(subjects.flatMap(s => s.examBoards.map(eb => eb.board)))
).sort();
