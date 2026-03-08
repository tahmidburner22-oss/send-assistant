import { useState } from "react";
import { subjects, allYears, allBoards } from "@/lib/pastPapers";
import { ScrollText, FileText, CheckSquare, ChevronDown, ChevronUp, Filter, X, ExternalLink } from "lucide-react";

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-700" },
  green:   { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   badge: "bg-green-100 text-green-700" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  badge: "bg-purple-100 text-purple-700" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-700" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  badge: "bg-indigo-100 text-indigo-700" },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    badge: "bg-teal-100 text-teal-700" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700" },
  cyan:    { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    badge: "bg-cyan-100 text-cyan-700" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   badge: "bg-slate-100 text-slate-700" },
  yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  text: "text-yellow-700",  badge: "bg-yellow-100 text-yellow-700" },
  pink:    { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",    badge: "bg-pink-100 text-pink-700" },
};

export default function PastPapers() {
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedBoard, setSelectedBoard] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const filteredSubjects = subjects
    .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(s => ({
      ...s,
      filteredBoards: s.examBoards
        .filter(eb => selectedBoard === "All" || eb.board === selectedBoard)
        .map(eb => ({
          ...eb,
          papers: eb.papers.filter(p => selectedYear === "All" || p.year === parseInt(selectedYear)),
        }))
        .filter(eb => eb.papers.length > 0),
    }))
    .filter(s => s.filteredBoards.length > 0);

  const clearFilters = () => {
    setSelectedYear("All");
    setSelectedBoard("All");
    setSearchQuery("");
  };

  const hasFilters = selectedYear !== "All" || selectedBoard !== "All" || searchQuery !== "";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <ScrollText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">GCSE Past Papers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Free question papers and mark schemes from AQA, Edexcel and OCR — click any button to download the PDF directly.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-border/60 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="w-4 h-4" /> Filters
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          />
          {/* Year */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            <option value="All">All Years</option>
            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Board */}
          <select
            value={selectedBoard}
            onChange={e => setSelectedBoard(e.target.value)}
            className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            <option value="All">All Exam Boards</option>
            {allBoards.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedYear !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                {selectedYear}
                <button onClick={() => setSelectedYear("All")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedBoard !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                {selectedBoard}
                <button onClick={() => setSelectedBoard("All")}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing <strong>{filteredSubjects.length}</strong> subject{filteredSubjects.length !== 1 ? "s" : ""}
      </p>

      {/* Subject cards */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No papers found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubjects.map(subject => {
            const colors = colorMap[subject.color] ?? colorMap.blue;
            const isExpanded = expandedSubject === subject.id;
            const totalPapers = subject.filteredBoards.reduce((sum, eb) => sum + eb.papers.length, 0);

            return (
              <div key={subject.id} className={`rounded-2xl border-2 ${colors.border} overflow-hidden shadow-sm`}>
                {/* Subject header — click to expand */}
                <button
                  onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                  className={`w-full flex items-center justify-between p-4 ${colors.bg} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{subject.icon}</span>
                    <div className="text-left">
                      <p className={`font-semibold ${colors.text}`}>{subject.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {totalPapers} paper{totalPapers !== 1 ? "s" : ""} · {subject.filteredBoards.map(eb => eb.board).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                      {subject.level}
                    </span>
                    {isExpanded
                      ? <ChevronUp className={`w-5 h-5 ${colors.text}`} />
                      : <ChevronDown className={`w-5 h-5 ${colors.text}`} />}
                  </div>
                </button>

                {/* Papers list */}
                {isExpanded && (
                  <div className="bg-white divide-y divide-border/40">
                    {subject.filteredBoards.map(eb => (
                      <div key={eb.board} className="p-4">
                        {/* Board badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colors.badge}`}>
                            {eb.board}
                          </span>
                          <span className="text-xs text-muted-foreground">{eb.papers.length} paper{eb.papers.length !== 1 ? "s" : ""}</span>
                        </div>

                        {/* Paper rows */}
                        <div className="space-y-2">
                          {eb.papers.map((paper, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{paper.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {paper.tier && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      paper.tier === "Higher" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                                    }`}>{paper.tier}</span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{paper.series} {paper.year}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                  href={paper.paperUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" /> Paper
                                </a>
                                <a
                                  href={paper.markSchemeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" /> Mark Scheme
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Direct PDF downloads from Physics &amp; Maths Tutor
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
        <strong>About these resources:</strong> Clicking Paper or Mark Scheme downloads the PDF directly — no sign-in required. Papers are hosted by Physics &amp; Maths Tutor and sourced from AQA, Edexcel and OCR.
      </div>
    </div>
  );
}
