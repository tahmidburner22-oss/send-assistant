import { useState, useMemo } from "react";
import { subjects, allYears, allBoards, Subject, PastPaper } from "@/data/pastPapers";
import { ExternalLink, FileText, CheckSquare, ChevronDown, ChevronUp, BookOpen, Filter, X } from "lucide-react";

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; icon: string }> = {
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-700",    icon: "bg-blue-100" },
  green:   { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   badge: "bg-green-100 text-green-700",   icon: "bg-green-100" },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  badge: "bg-purple-100 text-purple-700",  icon: "bg-purple-100" },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", icon: "bg-emerald-100" },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-700",  icon: "bg-orange-100" },
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  badge: "bg-indigo-100 text-indigo-700",  icon: "bg-indigo-100" },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    badge: "bg-teal-100 text-teal-700",    icon: "bg-teal-100" },
  amber:   { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700",   icon: "bg-amber-100" },
  cyan:    { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    badge: "bg-cyan-100 text-cyan-700",    icon: "bg-cyan-100" },
  slate:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-700",   badge: "bg-slate-100 text-slate-700",   icon: "bg-slate-100" },
  yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  text: "text-yellow-700",  badge: "bg-yellow-100 text-yellow-700",  icon: "bg-yellow-100" },
  pink:    { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",    badge: "bg-pink-100 text-pink-700",    icon: "bg-pink-100" },
};

function PaperRow({ paper, board }: { paper: PastPaper; board: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-800 truncate">{paper.title}</span>
          {paper.tier && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              paper.tier === "Higher"
                ? "bg-purple-100 text-purple-700"
                : paper.tier === "Foundation"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {paper.tier}
            </span>
          )}
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
            {paper.series} {paper.year}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
        <a
          href={paper.paperUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          title="View Question Paper"
        >
          <FileText className="w-3.5 h-3.5" />
          Paper
        </a>
        <a
          href={paper.markSchemeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          title="View Mark Scheme"
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Mark Scheme
        </a>
      </div>
    </div>
  );
}

function SubjectCard({ subject, selectedYear, selectedBoard }: {
  subject: Subject;
  selectedYear: string;
  selectedBoard: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = colorMap[subject.color] ?? colorMap.blue;

  // Filter exam boards and papers based on selections
  const filteredBoards = useMemo(() => {
    return subject.examBoards
      .filter(eb => selectedBoard === "All" || eb.board === selectedBoard)
      .map(eb => ({
        ...eb,
        papers: eb.papers.filter(p =>
          selectedYear === "All" || p.year === parseInt(selectedYear)
        ),
      }))
      .filter(eb => eb.papers.length > 0);
  }, [subject, selectedYear, selectedBoard]);

  const totalPapers = filteredBoards.reduce((sum, eb) => sum + eb.papers.length, 0);

  if (totalPapers === 0) return null;

  return (
    <div className={`rounded-xl border-2 ${colors.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-4 ${colors.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center text-xl`}>
            {subject.icon}
          </div>
          <div className="text-left">
            <h3 className={`font-semibold text-base ${colors.text}`}>{subject.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {totalPapers} paper{totalPapers !== 1 ? "s" : ""} available
              {filteredBoards.length > 0 && (
                <span className="ml-1">
                  · {filteredBoards.map(eb => eb.board).join(", ")}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors.badge}`}>
            GCSE
          </span>
          {expanded ? (
            <ChevronUp className={`w-5 h-5 ${colors.text}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${colors.text}`} />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="bg-white divide-y divide-gray-100">
          {filteredBoards.map(eb => (
            <div key={eb.board} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                  {eb.board}
                </span>
                <span className="text-xs text-gray-400">
                  {eb.papers.length} paper{eb.papers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {eb.papers.map((paper, idx) => (
                  <PaperRow key={idx} paper={paper} board={eb.board} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Links open the official {eb.board} assessment resources page where you can download PDFs directly.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PastPapers() {
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedBoard, setSelectedBoard] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      // Search filter
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Check if any papers match the filters
      const hasMatchingPapers = s.examBoards
        .filter(eb => selectedBoard === "All" || eb.board === selectedBoard)
        .some(eb =>
          eb.papers.some(p => selectedYear === "All" || p.year === parseInt(selectedYear))
        );
      return hasMatchingPapers;
    });
  }, [selectedYear, selectedBoard, searchQuery]);

  const totalPapersCount = useMemo(() => {
    return subjects.reduce((total, s) => {
      return total + s.examBoards
        .filter(eb => selectedBoard === "All" || eb.board === selectedBoard)
        .reduce((sum, eb) => {
          return sum + eb.papers.filter(p =>
            selectedYear === "All" || p.year === parseInt(selectedYear)
          ).length;
        }, 0);
    }, 0);
  }, [selectedYear, selectedBoard]);

  const clearFilters = () => {
    setSelectedYear("All");
    setSelectedBoard("All");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedYear !== "All" || selectedBoard !== "All" || searchQuery !== "";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">GCSE Past Papers</h1>
          </div>
          <p className="text-gray-500 text-sm max-w-2xl">
            Access past papers and mark schemes from official exam boards. Links open directly to
            the AQA, Edexcel, or OCR assessment resource pages where you can download PDFs free of charge.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-bold text-blue-600">{totalPapersCount}</div>
          <div className="text-xs text-gray-400">papers available</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter Papers</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search Subject</label>
            <input
              type="text"
              placeholder="e.g. Maths, Biology..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
            >
              <option value="All">All Years</option>
              {allYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Exam Board Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Exam Board</label>
            <select
              value={selectedBoard}
              onChange={e => setSelectedBoard(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
            >
              <option value="All">All Boards</option>
              {allBoards.map(board => (
                <option key={board} value={board}>{board}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
            {selectedYear !== "All" && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                Year: {selectedYear}
                <button onClick={() => setSelectedYear("All")} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBoard !== "All" && (
              <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
                Board: {selectedBoard}
                <button onClick={() => setSelectedBoard("All")} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="hover:text-green-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{filteredSubjects.length}</span> subject{filteredSubjects.length !== 1 ? "s" : ""}
          {hasActiveFilters && " matching your filters"}
        </p>
        <p className="text-xs text-gray-400">
          Click a subject to expand and view papers
        </p>
      </div>

      {/* Subject Cards */}
      {filteredSubjects.length > 0 ? (
        <div className="space-y-3">
          {filteredSubjects.map(subject => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              selectedYear={selectedYear}
              selectedBoard={selectedBoard}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-3">📄</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No papers found</h3>
          <p className="text-sm text-gray-400 mb-4">
            Try adjusting your filters or search query.
          </p>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="text-blue-500 mt-0.5">
            <ExternalLink className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">About these resources</h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              All past papers and mark schemes are sourced from official exam board websites (AQA, Edexcel/Pearson, OCR).
              Clicking <strong>Paper</strong> or <strong>Mark Scheme</strong> will open the official assessment resources page
              for that subject, where you can filter and download PDFs directly. Resources are free to access and updated
              annually after each exam series.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
