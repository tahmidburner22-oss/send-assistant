// GCSE Past Papers Data
// All links are direct PDF downloads from pmt.physicsandmathstutor.com

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
          { title: "Paper 1 Non-Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 3 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-3H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-3H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2F/MS/June%202024%20MS.pdf" },
          { title: "Paper 3 Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-3F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-3F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2H/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-2F/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2022, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202022%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202022%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2022, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202022%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202022%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202019%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2019, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 Non-Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1F/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 Non-Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 Calculator (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 Non-Calculator (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Maths/GCSE/Past-Papers/OCR/Paper-1F/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Writers' Viewpoints and Perspectives", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 – Writers' Viewpoints and Perspectives", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-2/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-2/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2022, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/QP/June%202022%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/MS/June%202022%20MS.pdf" },
          { title: "Paper 1 – Explorations in Creative Reading and Writing", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Non-Fiction and Transactional Writing", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Fiction and Imaginative Writing", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Component 1 – Communicating Information and Ideas", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/OCR/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/OCR/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Component 2 – Exploring Effects and Impact", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/OCR/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/OCR/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Component 1 – Communicating Information and Ideas", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/OCR/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Language/GCSE/Past-Papers/OCR/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Modern Texts and Poetry", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 – Modern Texts and Poetry", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-2/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-2/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Shakespeare and the 19th Century Novel", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Shakespeare and Post-1914 Literature", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – 19th-Century Novel and Poetry Since 1789", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Shakespeare and Post-1914 Literature", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Component 1 – Shakespeare and Poetry Pre-1900", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/OCR/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/OCR/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Component 2 – Exploring Modern and Literary Heritage Texts", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/OCR/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/OCR/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Component 1 – Shakespeare and Poetry Pre-1900", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/OCR/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/English-Literature/GCSE/Past-Papers/OCR/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-2F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-2F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Biology/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Chemistry/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2019, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-2H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-2H/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Physics/GCSE/Past-Papers/OCR/Paper-1H/MS/June%202023%20MS.pdf" },
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
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Physics Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1H/MS/June%202023%20MS.pdf" },
          { title: "Biology Paper 1 (Foundation)", year: 2023, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1F/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/AQA/Paper-1F/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Biology Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Chemistry Paper 1 (Higher)", year: 2024, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202024%20MS.pdf" },
          { title: "Biology Paper 1 (Foundation)", year: 2024, series: "June", tier: "Foundation", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1F/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1F/MS/June%202024%20MS.pdf" },
          { title: "Biology Paper 1 (Higher)", year: 2023, series: "June", tier: "Higher", paperUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1H/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Combined-Science/GCSE/Past-Papers/Edexcel/Paper-1H/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – Understanding the Modern World", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Shaping the Nation", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Understanding the Modern World", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 – Shaping the Nation", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-2/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-2/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Understanding the Modern World", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Thematic Study and Historic Environment", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Period Study and British Depth Study", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 3 – Modern Depth Study", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-3/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-3/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Thematic Study and Historic Environment", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Living Under Nazi Rule", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/OCR/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/OCR/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – The People's Health", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/OCR/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/OCR/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Living Under Nazi Rule", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/OCR/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/History/GCSE/Past-Papers/OCR/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – Living with the Physical Environment", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Challenges in the Human Environment", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 3 – Geographical Applications", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-3/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-3/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Living with the Physical Environment", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Living with the Physical Environment", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – The Physical Environment", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – The Human Environment", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – The Physical Environment", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Living in a Globalised World", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/OCR/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/OCR/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Geographical Debate", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/OCR/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/OCR/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Living in a Globalised World", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/OCR/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Geography/GCSE/Past-Papers/OCR/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – Computational Thinking and Programming", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Computing Concepts", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Computational Thinking and Programming", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 – Computing Concepts", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-2/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-2/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Computational Thinking and Programming", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Principles of Computer Science", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Application of Computational Thinking", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Principles of Computer Science", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
        ],
      },
      {
        board: "OCR",
        papers: [
          { title: "Paper 1 – Computer Systems", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/OCR/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/OCR/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Computational Thinking, Algorithms and Programming", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/OCR/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/OCR/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Computer Systems", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/OCR/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Computer-Science/GCSE/Past-Papers/OCR/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – How Markets Work", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – How the Economy Works", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – How Markets Work", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – How Markets Work", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Microeconomics", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Macroeconomics", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Microeconomics", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Economics/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Paper 1 – Cognition and Development", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Social Context and Behaviour", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Cognition and Development", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-1/MS/June%202023%20MS.pdf" },
          { title: "Paper 2 – Social Context and Behaviour", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-2/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-2/MS/June%202023%20MS.pdf" },
          { title: "Paper 1 – Cognition and Development", year: 2019, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-1/QP/June%202019%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/AQA/Paper-1/MS/June%202019%20MS.pdf" },
        ],
      },
      {
        board: "Edexcel",
        papers: [
          { title: "Paper 1 – Psychological Foundations", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202024%20MS.pdf" },
          { title: "Paper 2 – Applications of Psychology", year: 2024, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/Edexcel/Paper-2/QP/June%202024%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/Edexcel/Paper-2/MS/June%202024%20MS.pdf" },
          { title: "Paper 1 – Psychological Foundations", year: 2023, series: "June", paperUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/Edexcel/Paper-1/QP/June%202023%20QP.pdf", markSchemeUrl: "https://pmt.physicsandmathstutor.com/download/Psychology/GCSE/Past-Papers/Edexcel/Paper-1/MS/June%202023%20MS.pdf" },
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
          { title: "Verbal Reasoning Practice Paper 1", year: 2023, series: "Sample", paperUrl: "https://www.gl-assessment.co.uk/media/352483/vr-practice-paper-1.pdf", markSchemeUrl: "https://www.gl-assessment.co.uk/media/352483/vr-practice-paper-1-answers.pdf" },
          { title: "Non-Verbal Reasoning Practice Paper 1", year: 2023, series: "Sample", paperUrl: "https://www.gl-assessment.co.uk/media/352484/nvr-practice-paper-1.pdf", markSchemeUrl: "https://www.gl-assessment.co.uk/media/352484/nvr-practice-paper-1-answers.pdf" },
          { title: "Maths Practice Paper 1", year: 2023, series: "Sample", paperUrl: "https://www.gl-assessment.co.uk/media/352485/maths-practice-paper-1.pdf", markSchemeUrl: "https://www.gl-assessment.co.uk/media/352485/maths-practice-paper-1-answers.pdf" },
          { title: "English Practice Paper 1", year: 2023, series: "Sample", paperUrl: "https://www.gl-assessment.co.uk/media/352486/english-practice-paper-1.pdf", markSchemeUrl: "https://www.gl-assessment.co.uk/media/352486/english-practice-paper-1-answers.pdf" },
        ],
      },
      {
        board: "CEM (Durham)",
        papers: [
          { title: "CEM Style Verbal Reasoning Practice Paper", year: 2023, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/verbal-reasoning-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/verbal-reasoning-sample-answers.pdf" },
          { title: "CEM Style Non-Verbal Reasoning Practice Paper", year: 2023, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/non-verbal-reasoning-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/non-verbal-reasoning-sample-answers.pdf" },
          { title: "CEM Style Maths Practice Paper", year: 2023, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/maths-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/maths-sample-answers.pdf" },
          { title: "CEM Style English Practice Paper", year: 2023, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/english-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/english-sample-answers.pdf" },
        ],
      },
      {
        board: "Bond 11+",
        papers: [
          { title: "Bond 11+ Verbal Reasoning Assessment Paper", year: 2022, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/verbal-reasoning-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/verbal-reasoning-sample-answers.pdf" },
          { title: "Bond 11+ Non-Verbal Reasoning Assessment Paper", year: 2022, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/non-verbal-reasoning-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/non-verbal-reasoning-sample-answers.pdf" },
          { title: "Bond 11+ Maths Assessment Paper", year: 2022, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/maths-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/maths-sample-answers.pdf" },
          { title: "Bond 11+ English Assessment Paper", year: 2022, series: "Sample", paperUrl: "https://www.bond11plus.co.uk/free-papers/english-sample.pdf", markSchemeUrl: "https://www.bond11plus.co.uk/free-papers/english-sample-answers.pdf" },
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
