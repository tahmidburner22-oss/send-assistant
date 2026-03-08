// GCSE Past Papers Data
// All links go to official exam board assessment resource pages

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
  level: "GCSE" | "A-Level" | "Both";
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
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html" },
          { title: "Paper 2 – Non-Fiction and Transactional Writing", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html" },
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html" },
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2019, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-language-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Component 1 – Communicating Information and Ideas", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/english-language-j277-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/english-language-j277-from-2015/assessment/" },
          { title: "Component 2 – Exploring Effects and Impact", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/english-language-j277-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/english-language-j277-from-2015/assessment/" },
          { title: "Component 1 – Communicating Information and Ideas", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/english-language-j277-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/english-language-j277-from-2015/assessment/" },
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
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources" },
          { title: "Paper 2 – Modern Texts and Poetry", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources" },
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources" },
          { title: "Paper 2 – Modern Texts and Poetry", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources" },
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/english/gcse/english-literature-8702/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Shakespeare and Post-1914 Literature", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.coursematerials.html" },
          { title: "Paper 2 – 19th-Century Novel and Poetry Since 1789", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.coursematerials.html" },
          { title: "Paper 1 – Shakespeare and Post-1914 Literature", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/english-literature-2015.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Component 1 – Shakespeare and Poetry Pre-1900", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/english-literature-j352-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/english-literature-j352-from-2015/assessment/" },
          { title: "Component 2 – Exploring Modern and Literary Heritage Texts", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/english-literature-j352-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/english-literature-j352-from-2015/assessment/" },
          { title: "Component 1 – Shakespeare and Poetry Pre-1900", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/english-literature-j352-from-2015/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/english-literature-j352-from-2015/assessment/" },
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
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
          { title: "Paper 2 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/biology-8461/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/biology-2016.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/biology-a-gateway-science-j247-from-2016/assessment/" },
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
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/chemistry-8462/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/chemistry-2016.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/chemistry-a-gateway-science-j248-from-2016/assessment/" },
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
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/physics-8463/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/physics-2016.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/physics-a-gateway-science-j249-from-2016/assessment/" },
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
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources" },
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources" },
          { title: "Physics Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources" },
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources" },
          { title: "Biology Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/science/gcse/combined-science-trilogy-8464/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html" },
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html" },
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/combined-science-2016.coursematerials.html" },
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
          { title: "Paper 1 – Understanding the Modern World", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources" },
          { title: "Paper 2 – Shaping the Nation", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources" },
          { title: "Paper 1 – Understanding the Modern World", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources" },
          { title: "Paper 2 – Shaping the Nation", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources" },
          { title: "Paper 1 – Understanding the Modern World", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/history/gcse/history-8145/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Thematic Study and Historic Environment", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html" },
          { title: "Paper 2 – Period Study and British Depth Study", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html" },
          { title: "Paper 3 – Modern Depth Study", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html" },
          { title: "Paper 1 – Thematic Study and Historic Environment", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/history-2016.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Living Under Nazi Rule", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/history-b-schools-history-project-j411-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/history-b-schools-history-project-j411-from-2016/assessment/" },
          { title: "Paper 2 – The People's Health", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/history-b-schools-history-project-j411-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/history-b-schools-history-project-j411-from-2016/assessment/" },
          { title: "Paper 1 – Living Under Nazi Rule", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/history-b-schools-history-project-j411-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/history-b-schools-history-project-j411-from-2016/assessment/" },
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
          { title: "Paper 1 – Living with the Physical Environment", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources" },
          { title: "Paper 2 – Challenges in the Human Environment", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources" },
          { title: "Paper 3 – Geographical Applications", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources" },
          { title: "Paper 1 – Living with the Physical Environment", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources" },
          { title: "Paper 1 – Living with the Physical Environment", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – The Physical Environment", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/geography-b-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/geography-b-2016.coursematerials.html" },
          { title: "Paper 2 – The Human Environment", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/geography-b-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/geography-b-2016.coursematerials.html" },
          { title: "Paper 1 – The Physical Environment", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/geography-b-2016.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/geography-b-2016.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Living in a Globalised World", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/geography-b-geography-for-enquiring-minds-j384-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/geography-b-geography-for-enquiring-minds-j384-from-2016/assessment/" },
          { title: "Paper 2 – Geographical Debate", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/geography-b-geography-for-enquiring-minds-j384-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/geography-b-geography-for-enquiring-minds-j384-from-2016/assessment/" },
          { title: "Paper 1 – Living in a Globalised World", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/geography-b-geography-for-enquiring-minds-j384-from-2016/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/geography-b-geography-for-enquiring-minds-j384-from-2016/assessment/" },
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
          { title: "Paper 1 – Computational Thinking and Programming", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources" },
          { title: "Paper 2 – Computing Concepts", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources" },
          { title: "Paper 1 – Computational Thinking and Programming", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources" },
          { title: "Paper 2 – Computing Concepts", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources" },
          { title: "Paper 1 – Computational Thinking and Programming", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/computer-science-and-it/gcse/computer-science-8525/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Principles of Computer Science", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/computer-science-2020.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/computer-science-2020.coursematerials.html" },
          { title: "Paper 2 – Application of Computational Thinking", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/computer-science-2020.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/computer-science-2020.coursematerials.html" },
          { title: "Paper 1 – Principles of Computer Science", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/computer-science-2020.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/computer-science-2020.coursematerials.html" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Computer Systems", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/assessment/" },
          { title: "Paper 2 – Computational Thinking, Algorithms and Programming", year: 2024, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/assessment/" },
          { title: "Paper 1 – Computer Systems", year: 2023, series: "June", paperUrl: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/assessment/", markSchemeUrl: "https://www.ocr.org.uk/qualifications/gcse/computer-science-j277-from-2020/assessment/" },
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
          { title: "Paper 1 – How Markets Work", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources" },
          { title: "Paper 2 – How the Economy Works", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources" },
          { title: "Paper 1 – How Markets Work", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources" },
          { title: "Paper 1 – How Markets Work", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/economics/gcse/economics-8136/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Microeconomics", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/economics-b-2017.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/economics-b-2017.coursematerials.html" },
          { title: "Paper 2 – Macroeconomics", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/economics-b-2017.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/economics-b-2017.coursematerials.html" },
          { title: "Paper 1 – Microeconomics", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/economics-b-2017.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/economics-b-2017.coursematerials.html" },
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
          { title: "Paper 1 – Cognition and Development", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources" },
          { title: "Paper 2 – Social Context and Behaviour", year: 2024, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources" },
          { title: "Paper 1 – Cognition and Development", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources" },
          { title: "Paper 2 – Social Context and Behaviour", year: 2023, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources" },
          { title: "Paper 1 – Cognition and Development", year: 2019, series: "June", paperUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources", markSchemeUrl: "https://www.aqa.org.uk/subjects/psychology/gcse/psychology-8182/assessment-resources" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Psychological Foundations", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/psychology-2017.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/psychology-2017.coursematerials.html" },
          { title: "Paper 2 – Applications of Psychology", year: 2024, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/psychology-2017.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/psychology-2017.coursematerials.html" },
          { title: "Paper 1 – Psychological Foundations", year: 2023, series: "June", paperUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/psychology-2017.coursematerials.html", markSchemeUrl: "https://qualifications.pearson.com/en/qualifications/edexcel-gcses/psychology-2017.coursematerials.html" },
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
