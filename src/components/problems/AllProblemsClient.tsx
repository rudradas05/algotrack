// "use client";

// import { useMemo, useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { RetryNotesModal } from "./RetryNotesModal";
// import { toast } from "sonner";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Trophy,
//   BarChart3,
//   RotateCcw,
//   CheckCircle2,
//   Github,
//   Search,
//   SlidersHorizontal,
//   ChevronDown,
//   ChevronUp,
//   X,
//   ExternalLink,
// } from "lucide-react";

// interface Problem {
//   id: string;
//   title: string;
//   platform: string;
//   difficulty: string;
//   topic: string;
//   githubUrl: string;
//   solvedAt: string;
//   solvedByMe: boolean;
//   needsRetry: boolean;
//   retryNotes: string | null;
//   slug: string;
// }

// interface AllProblemsClientProps {
//   initialProblems: Problem[];
//   availableDifficulties: string[];
//   availableTopics: string[];
//   stats: {
//     total: number;
//     easy: number;
//     medium: number;
//     hard: number;
//     retry: number;
//     solvedByMe: number;
//   };
// }

// const difficultyColor: Record<string, string> = {
//   Easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
//   Medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
//   Hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
// };

// export function AllProblemsClient({
//   initialProblems,
//   availableDifficulties,
//   availableTopics,
//   stats,
// }: AllProblemsClientProps) {
//   const [problems, setProblems] = useState(initialProblems);
//   const [search, setSearch] = useState("");
//   const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(
//     new Set(availableDifficulties),
//   );
//   const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
//     new Set(availableTopics),
//   );
//   const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "help">(
//     "all",
//   );
//   const [retryFilter, setRetryFilter] = useState<"all" | "yes" | "no">("all");
//   const [loadingId, setLoadingId] = useState<string | null>(null);
//   const [filtersOpen, setFiltersOpen] = useState(false);

//   // Filter problems based on search and filters
//   const filteredProblems = useMemo(() => {
//     return problems.filter((problem) => {
//       // Search filter
//       if (
//         search.trim() &&
//         !problem.title.toLowerCase().includes(search.toLowerCase())
//       ) {
//         return false;
//       }

//       // Difficulty filter
//       if (!selectedDifficulties.has(problem.difficulty)) {
//         return false;
//       }

//       // Topic filter
//       if (!selectedTopics.has(problem.topic)) {
//         return false;
//       }

//       // Status filter
//       if (statusFilter === "solved" && !problem.solvedByMe) return false;
//       if (statusFilter === "help" && problem.solvedByMe) return false;

//       // Retry filter
//       if (retryFilter === "yes" && !problem.needsRetry) return false;
//       if (retryFilter === "no" && problem.needsRetry) return false;

//       return true;
//     });
//   }, [
//     problems,
//     search,
//     selectedDifficulties,
//     selectedTopics,
//     statusFilter,
//     retryFilter,
//   ]);

//   const handleDifficultyChange = (difficulty: string) => {
//     const newSet = new Set(selectedDifficulties);
//     if (newSet.has(difficulty)) {
//       newSet.delete(difficulty);
//     } else {
//       newSet.add(difficulty);
//     }
//     setSelectedDifficulties(newSet);
//   };

//   const handleTopicChange = (topic: string) => {
//     const newSet = new Set(selectedTopics);
//     if (newSet.has(topic)) {
//       newSet.delete(topic);
//     } else {
//       newSet.add(topic);
//     }
//     setSelectedTopics(newSet);
//   };

//   const handleStatusUpdate = async (
//     problemId: string,
//     newSolvedByMe: boolean,
//   ) => {
//     setLoadingId(problemId);
//     try {
//       const response = await fetch(`/api/problems/${problemId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ solvedByMe: newSolvedByMe }),
//       });

//       if (!response.ok) throw new Error("Failed to update");

//       // Update local state
//       setProblems(
//         problems.map((p) =>
//           p.id === problemId ? { ...p, solvedByMe: newSolvedByMe } : p,
//         ),
//       );

//       toast.success(
//         `Marked as "${newSolvedByMe ? "Solved" : "Solved with Help"}"`,
//       );
//     } catch (error) {
//       console.error("Error updating problem:", error);
//       toast.error("Failed to update problem");
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   const handleRetryUpdate = async (
//     problemId: string,
//     data: { needsRetry: boolean; retryNotes: string },
//   ) => {
//     setLoadingId(problemId);
//     try {
//       const response = await fetch(`/api/problems/${problemId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });

//       if (!response.ok) throw new Error("Failed to update");

//       // Update local state
//       setProblems(
//         problems.map((p) =>
//           p.id === problemId
//             ? { ...p, needsRetry: data.needsRetry, retryNotes: data.retryNotes }
//             : p,
//         ),
//       );

//       toast.success("Retry status updated");
//     } catch (error) {
//       console.error("Error updating retry status:", error);
//       toast.error("Failed to update retry status");
//     } finally {
//       setLoadingId(null);
//     }
//   };

//   const activeFilterCount = useMemo(() => {
//     let count = 0;
//     if (search.trim()) count++;
//     if (selectedDifficulties.size !== availableDifficulties.length) count++;
//     if (selectedTopics.size !== availableTopics.length) count++;
//     if (statusFilter !== "all") count++;
//     if (retryFilter !== "all") count++;
//     return count;
//   }, [
//     search,
//     selectedDifficulties,
//     selectedTopics,
//     statusFilter,
//     retryFilter,
//     availableDifficulties.length,
//     availableTopics.length,
//   ]);

//   const clearAllFilters = () => {
//     setSearch("");
//     setSelectedDifficulties(new Set(availableDifficulties));
//     setSelectedTopics(new Set(availableTopics));
//     setStatusFilter("all");
//     setRetryFilter("all");
//   };

//   if (problems.length === 0) {
//     return (
//       <Card className="glass-card">
//         <CardContent className="text-center py-12">
//           <p className="text-muted-foreground">
//             No problems solved yet. Start solving on LeetCode!
//           </p>
//         </CardContent>
//       </Card>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Stats Summary */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
//         {([
//           { label: "Total", value: stats.total, bgColor: "bg-blue-500/10", textColor: "text-blue-500", icon: Trophy },
//           { label: "Easy", value: stats.easy, bgColor: "bg-green-500/10", textColor: "text-green-500", icon: CheckCircle2 },
//           { label: "Medium", value: stats.medium, bgColor: "bg-yellow-500/10", textColor: "text-yellow-500", icon: BarChart3 },
//           { label: "Hard", value: stats.hard, bgColor: "bg-red-500/10", textColor: "text-red-500", icon: BarChart3 },
//           { label: "Solo", value: stats.solvedByMe, bgColor: "bg-purple-500/10", textColor: "text-purple-500", icon: CheckCircle2 },
//           { label: "Retry", value: stats.retry, bgColor: "bg-orange-500/10", textColor: "text-orange-500", icon: RotateCcw },
//         ] as const).map(({ label, value, bgColor, textColor, icon: Icon }) => (
//           <Card key={label} className="glass-card rounded-2xl">
//             <CardContent className="flex items-center gap-3 p-4">
//               <div className={`rounded-xl p-2.5 ${bgColor}`}>
//                 <Icon className={`h-4 w-4 ${textColor}`} />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold leading-none">{value}</p>
//                 <p className="text-xs text-muted-foreground mt-1">{label}</p>
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {/* Search + Filters */}
//       <Card className="glass-card rounded-2xl">
//         <CardContent className="p-4 space-y-4">
//           <div className="flex gap-3 items-center">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//               <Input
//                 placeholder="Search by problem title..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="pl-9 rounded-xl"
//               />
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setFiltersOpen(!filtersOpen)}
//               className="flex items-center gap-2 rounded-xl relative"
//             >
//               <SlidersHorizontal className="h-4 w-4" />
//               Filters
//               {activeFilterCount > 0 && (
//                 <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-medium">
//                   {activeFilterCount}
//                 </span>
//               )}
//               {filtersOpen ? (
//                 <ChevronUp className="h-3.5 w-3.5" />
//               ) : (
//                 <ChevronDown className="h-3.5 w-3.5" />
//               )}
//             </Button>
//           </div>

//           {filtersOpen && (
//             <div className="space-y-5 border-t pt-4">
//               {/* Difficulty chips */}
//               <div>
//                 <Label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                   Difficulty
//                 </Label>
//                 <div className="flex flex-wrap gap-2">
//                   {availableDifficulties.map((difficulty) => {
//                     const isSelected = selectedDifficulties.has(difficulty);
//                     const colorMap: Record<string, string> = {
//                       Easy: isSelected
//                         ? "bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20"
//                         : "bg-transparent text-muted-foreground border-border hover:bg-muted",
//                       Medium: isSelected
//                         ? "bg-yellow-500/15 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20"
//                         : "bg-transparent text-muted-foreground border-border hover:bg-muted",
//                       Hard: isSelected
//                         ? "bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/20"
//                         : "bg-transparent text-muted-foreground border-border hover:bg-muted",
//                     };
//                     return (
//                       <button
//                         key={difficulty}
//                         onClick={() => handleDifficultyChange(difficulty)}
//                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${colorMap[difficulty] || (isSelected ? "bg-primary/10 text-primary border-primary/30" : "bg-transparent text-muted-foreground border-border hover:bg-muted")}`}
//                       >
//                         {difficulty}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Topic chips */}
//               <div>
//                 <Label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                   Topics
//                 </Label>
//                 <div className="flex flex-wrap gap-2">
//                   {availableTopics.map((topic) => {
//                     const isSelected = selectedTopics.has(topic);
//                     return (
//                       <button
//                         key={topic}
//                         onClick={() => handleTopicChange(topic)}
//                         className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
//                           isSelected
//                             ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15"
//                             : "bg-transparent text-muted-foreground border-border hover:bg-muted"
//                         }`}
//                       >
//                         {topic}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Dropdowns + Clear */}
//               <div className="flex flex-wrap items-end gap-4">
//                 <div className="flex-1 min-w-[160px]">
//                   <Label
//                     htmlFor="status-filter"
//                     className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
//                   >
//                     Solve Status
//                   </Label>
//                   <Select
//                     value={statusFilter}
//                     onValueChange={(v) => v && setStatusFilter(v)}
//                   >
//                     <SelectTrigger
//                       id="status-filter"
//                       className="mt-2 rounded-xl"
//                     >
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All</SelectItem>
//                       <SelectItem value="solved">Solved by me</SelectItem>
//                       <SelectItem value="help">With Help</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="flex-1 min-w-[160px]">
//                   <Label
//                     htmlFor="retry-filter"
//                     className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
//                   >
//                     Retry Status
//                   </Label>
//                   <Select
//                     value={retryFilter}
//                     onValueChange={(v) => v && setRetryFilter(v)}
//                   >
//                     <SelectTrigger
//                       id="retry-filter"
//                       className="mt-2 rounded-xl"
//                     >
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All</SelectItem>
//                       <SelectItem value="yes">Needs Retry</SelectItem>
//                       <SelectItem value="no">No Retry</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {activeFilterCount > 0 && (
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearAllFilters}
//                     className="text-muted-foreground hover:text-foreground mb-0.5"
//                   >
//                     <X className="h-3.5 w-3.5 mr-1" />
//                     Clear all
//                   </Button>
//                 )}
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Results */}
//       <Card className="glass-card rounded-2xl">
//         <CardHeader className="pb-2">
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-lg">Problems</CardTitle>
//             <span className="text-sm text-muted-foreground font-medium">
//               {filteredProblems.length} of {problems.length}
//             </span>
//           </div>
//         </CardHeader>
//         <CardContent className="px-0 pb-2">
//           {filteredProblems.length === 0 ? (
//             <p className="text-muted-foreground text-center py-12">
//               No problems match your filters
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow className="hover:bg-transparent border-b-2">
//                     <TableHead className="w-10 text-center pl-4">#</TableHead>
//                     <TableHead>Problem</TableHead>
//                     <TableHead>Difficulty</TableHead>
//                     <TableHead>Topic</TableHead>
//                     <TableHead className="text-center">Code</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead className="text-center">Retry</TableHead>
//                     <TableHead className="pr-4">Solved</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {filteredProblems.map((problem, index) => (
//                     <TableRow
//                       key={problem.id}
//                       className="group hover:bg-blue-500/[0.03] transition-colors"
//                     >
//                       <TableCell className="text-center text-xs text-muted-foreground font-mono pl-4">
//                         {index + 1}
//                       </TableCell>
//                       <TableCell>
//                         <a
//                           href={`https://leetcode.com/problems/${problem.slug}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-foreground hover:text-primary font-medium transition-colors inline-flex items-center gap-1.5 group/link"
//                         >
//                           {problem.title}
//                           <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
//                         </a>
//                       </TableCell>
//                       <TableCell>
//                         <Badge
//                           variant="secondary"
//                           className={difficultyColor[problem.difficulty] || ""}
//                         >
//                           {problem.difficulty}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground">
//                           {problem.topic}
//                         </span>
//                       </TableCell>
//                       <TableCell className="text-center">
//                         <a
//                           href={problem.githubUrl}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
//                           title="View on GitHub"
//                         >
//                           <Github className="h-4 w-4" />
//                         </a>
//                       </TableCell>
//                       <TableCell>
//                         <Select
//                           value={problem.solvedByMe ? "solved" : "help"}
//                           onValueChange={(value) =>
//                             handleStatusUpdate(problem.id, value === "solved")
//                           }
//                           disabled={loadingId === problem.id}
//                         >
//                           <SelectTrigger className="w-auto inline-flex border-0 bg-transparent p-0 h-auto">
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="solved">Solved by me</SelectItem>
//                             <SelectItem value="help">With Help</SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </TableCell>
//                       <TableCell className="text-center">
//                         <RetryNotesModal
//                           problemId={problem.id}
//                           currentNeedRetry={problem.needsRetry}
//                           currentNotes={problem.retryNotes}
//                           onUpdate={(data) =>
//                             handleRetryUpdate(problem.id, data)
//                           }
//                           isSaving={loadingId === problem.id}
//                         />
//                       </TableCell>
//                       <TableCell className="text-muted-foreground text-xs pr-4">
//                         {new Date(problem.solvedAt).toLocaleDateString(
//                           "en-US",
//                           {
//                             month: "short",
//                             day: "numeric",
//                           },
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProblemUrl } from "@/lib/problem-url";
import { RetryNotesModal } from "./RetryNotesModal";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  Github,
  Search,
  X,
  ExternalLink,
  Layers,
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  githubUrl: string;
  solvedAt: string;
  solvedByMe: boolean;
  needsRetry: boolean;
  retryNotes: string | null;
  slug: string;
}

interface AllProblemsClientProps {
  initialProblems: Problem[];
  availableDifficulties: string[];
  availableTopics: string[];
  stats: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    retry: number;
    solvedByMe: number;
  };
}

function extractTopics(topicField: string): string[] {
  return topicField
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);
}

export function AllProblemsClient({
  initialProblems,
  availableDifficulties,
  availableTopics,
  stats,
}: AllProblemsClientProps) {
  const [problems, setProblems] = useState(initialProblems);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "help">(
    "all",
  );
  const [retryFilter, setRetryFilter] = useState<"all" | "yes" | "no">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (
        search.trim() &&
        !p.title.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (diffFilter !== "all" && p.difficulty !== diffFilter) return false;
      if (
        topicFilter !== "all" &&
        !extractTopics(p.topic).includes(topicFilter)
      )
        return false;
      if (statusFilter === "solved" && !p.solvedByMe) return false;
      if (statusFilter === "help" && p.solvedByMe) return false;
      if (retryFilter === "yes" && !p.needsRetry) return false;
      if (retryFilter === "no" && p.needsRetry) return false;
      return true;
    });
  }, [problems, search, diffFilter, topicFilter, statusFilter, retryFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, diffFilter, topicFilter, statusFilter, retryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProblems.length / ITEMS_PER_PAGE),
  );
  const paginatedProblems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProblems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProblems, currentPage, ITEMS_PER_PAGE]);

  const hasActiveFilters =
    search.trim() ||
    diffFilter !== "all" ||
    topicFilter !== "all" ||
    statusFilter !== "all" ||
    retryFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setDiffFilter("all");
    setTopicFilter("all");
    setStatusFilter("all");
    setRetryFilter("all");
  };

  const handleStatusUpdate = async (
    problemId: string,
    newSolvedByMe: boolean,
  ) => {
    setLoadingId(problemId);
    try {
      const res = await fetch(`/api/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solvedByMe: newSolvedByMe }),
      });
      if (!res.ok) throw new Error();
      setProblems((prev) =>
        prev.map((p) =>
          p.id === problemId ? { ...p, solvedByMe: newSolvedByMe } : p,
        ),
      );
      toast.success(
        `Marked as "${newSolvedByMe ? "Solved by me" : "With help"}"`,
      );
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRetryUpdate = async (
    problemId: string,
    data: { needsRetry: boolean; retryNotes: string },
  ) => {
    setLoadingId(problemId);
    try {
      const res = await fetch(`/api/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setProblems((prev) =>
        prev.map((p) =>
          p.id === problemId
            ? { ...p, needsRetry: data.needsRetry, retryNotes: data.retryNotes }
            : p,
        ),
      );
      toast.success("Retry status updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Stat pills ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Trophy,
            cls: "bg-sky-500/10 text-sky-400 border-sky-500/20",
          },
          {
            label: "Easy",
            value: stats.easy,
            icon: CheckCircle2,
            cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          },
          {
            label: "Medium",
            value: stats.medium,
            icon: Layers,
            cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          },
          {
            label: "Hard",
            value: stats.hard,
            icon: Flame,
            cls: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          },
          {
            label: "Solo",
            value: stats.solvedByMe,
            icon: CheckCircle2,
            cls: "bg-violet-500/10 text-violet-400 border-violet-500/20",
          },
          {
            label: "Retry",
            value: stats.retry,
            icon: RotateCcw,
            cls: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div
            key={label}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${cls}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="font-bold">{value}</span>
            <span className="opacity-70">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/30">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Search & filters</span>
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {
                [
                  !!search.trim(),
                  diffFilter !== "all",
                  topicFilter !== "all",
                  statusFilter !== "all",
                  retryFilter !== "all",
                ].filter(Boolean).length
              }
            </span>
          )}
        </div>
        <div className="p-4 space-y-4">
          {/* Search row */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by problem title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 h-10 rounded-xl bg-background border-border text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors rounded p-0.5"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter row: difficulty + dropdowns */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Difficulty
              </label>
              <div className="flex gap-2 flex-wrap">
                {["all", ...availableDifficulties].map((d) => {
                  const active = diffFilter === d;
                  const colorMap: Record<string, string> = {
                    all: active
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-muted/80 hover:border-muted-foreground/20",
                    Easy: active
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "border-border hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-600",
                    Medium: active
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-border hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-600",
                    Hard: active
                      ? "bg-rose-500 text-white border-rose-500"
                      : "border-border hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-600",
                  };
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiffFilter(d)}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors ${colorMap[d] ?? (active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted/80")}`}
                    >
                      {d === "all" ? "All" : d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Topic
              </label>
              <Select
                value={topicFilter}
                onValueChange={(v) => v && setTopicFilter(v)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-64">
                  <SelectItem value="all">All topics</SelectItem>
                  {availableTopics.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Solve status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="solved">Solo solved</SelectItem>
                  <SelectItem value="help">With help</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[120px]">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Retry
              </label>
              <Select
                value={retryFilter}
                onValueChange={(v) => setRetryFilter(v as typeof retryFilter)}
              >
                <SelectTrigger className="h-10 w-full rounded-xl border-border bg-background text-sm">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Needs retry</SelectItem>
                  <SelectItem value="no">No retry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground border-dashed"
              >
                <X className="h-4 w-4 mr-1.5" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table card header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-base font-semibold text-foreground">Problems</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground">
              {filteredProblems.length}
            </span>
            {filteredProblems.length !== problems.length && (
              <span> / {problems.length}</span>
            )}
          </span>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/60 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No problems found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or add problems from LeetCode or GFG.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 rounded-xl"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2 border-border bg-muted/40">
                    <TableHead className="w-12 pl-5 pr-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                      #
                    </TableHead>
                    <TableHead className="min-w-[200px] px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Problem
                    </TableHead>
                    <TableHead className="w-24 px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Difficulty
                    </TableHead>
                    <TableHead className="min-w-[120px] px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Topic
                    </TableHead>
                    <TableHead className="w-14 px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
                      Code
                    </TableHead>
                    <TableHead className="min-w-[110px] px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="min-w-[190px] px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Retry
                    </TableHead>
                    <TableHead className="min-w-[90px] pl-3 pr-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Solved
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProblems.map((problem, idx) => (
                    <TableRow
                      key={problem.id}
                      className="group border-b border-border/50 hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="pl-5 pr-3 py-3.5 text-center text-xs text-muted-foreground font-mono tabular-nums">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell className="px-3 py-3.5 max-w-[280px]">
                        <a
                          href={getProblemUrl(problem.platform, problem.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 group/link"
                        >
                          <span className="truncate">{problem.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover/link:opacity-70 transition-opacity" />
                        </a>
                      </TableCell>
                      <TableCell className="px-3 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                            problem.difficulty === "Easy"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : problem.difficulty === "Medium"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {problem.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/70 text-xs font-medium text-muted-foreground border border-border/50 max-w-[140px] truncate">
                          {problem.topic}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3.5 text-center">
                        <a
                          href={problem.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="View on GitHub"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      </TableCell>
                      <TableCell className="px-3 py-3.5">
                        <Select
                          value={problem.solvedByMe ? "solved" : "help"}
                          onValueChange={(v) =>
                            handleStatusUpdate(problem.id, v === "solved")
                          }
                          disabled={loadingId === problem.id}
                        >
                          <SelectTrigger className="h-8 w-auto min-w-[100px] border border-border/60 bg-background/50 text-xs font-medium rounded-lg [&>svg]:opacity-50">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 mr-1.5 ${problem.solvedByMe ? "bg-emerald-500" : "bg-amber-500"}`}
                            />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="solved">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Solo solved
                              </span>
                            </SelectItem>
                            <SelectItem value="help">
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                With help
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-3 py-3.5 align-top">
                        <RetryNotesModal
                          currentNeedRetry={problem.needsRetry}
                          currentNotes={problem.retryNotes}
                          onUpdate={(data) =>
                            handleRetryUpdate(problem.id, data)
                          }
                          isSaving={loadingId === problem.id}
                        />
                      </TableCell>
                      <TableCell className="pl-3 pr-5 py-3.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(problem.solvedAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
                <span className="text-sm text-muted-foreground tabular-nums">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredProblems.length,
                    )}
                  </span>{" "}
                  of {filteredProblems.length}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First page"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {(() => {
                    const pages: (number | "ellipsis")[] = [];
                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (currentPage > 3) pages.push("ellipsis");
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (currentPage < totalPages - 2) pages.push("ellipsis");
                      pages.push(totalPages);
                    }
                    return pages.map((page, i) =>
                      page === "ellipsis" ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="inline-flex items-center justify-center h-8 w-8 text-sm text-muted-foreground/60"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "secondary" : "ghost"}
                          size="icon"
                          className="h-8 w-8 rounded-lg text-xs font-semibold"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ),
                    );
                  })()}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last page"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
