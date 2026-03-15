"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Trophy,
  BarChart3,
  RotateCcw,
  CheckCircle2,
  Github,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
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

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  Medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  Hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export function AllProblemsClient({
  initialProblems,
  availableDifficulties,
  availableTopics,
  stats,
}: AllProblemsClientProps) {
  const [problems, setProblems] = useState(initialProblems);
  const [search, setSearch] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(
    new Set(availableDifficulties),
  );
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    new Set(availableTopics),
  );
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "help">(
    "all",
  );
  const [retryFilter, setRetryFilter] = useState<"all" | "yes" | "no">("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter problems based on search and filters
  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search filter
      if (
        search.trim() &&
        !problem.title.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      // Difficulty filter
      if (!selectedDifficulties.has(problem.difficulty)) {
        return false;
      }

      // Topic filter
      if (!selectedTopics.has(problem.topic)) {
        return false;
      }

      // Status filter
      if (statusFilter === "solved" && !problem.solvedByMe) return false;
      if (statusFilter === "help" && problem.solvedByMe) return false;

      // Retry filter
      if (retryFilter === "yes" && !problem.needsRetry) return false;
      if (retryFilter === "no" && problem.needsRetry) return false;

      return true;
    });
  }, [
    problems,
    search,
    selectedDifficulties,
    selectedTopics,
    statusFilter,
    retryFilter,
  ]);

  const handleDifficultyChange = (difficulty: string) => {
    const newSet = new Set(selectedDifficulties);
    if (newSet.has(difficulty)) {
      newSet.delete(difficulty);
    } else {
      newSet.add(difficulty);
    }
    setSelectedDifficulties(newSet);
  };

  const handleTopicChange = (topic: string) => {
    const newSet = new Set(selectedTopics);
    if (newSet.has(topic)) {
      newSet.delete(topic);
    } else {
      newSet.add(topic);
    }
    setSelectedTopics(newSet);
  };

  const handleStatusUpdate = async (
    problemId: string,
    newSolvedByMe: boolean,
  ) => {
    setLoadingId(problemId);
    try {
      const response = await fetch(`/api/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solvedByMe: newSolvedByMe }),
      });

      if (!response.ok) throw new Error("Failed to update");

      // Update local state
      setProblems(
        problems.map((p) =>
          p.id === problemId ? { ...p, solvedByMe: newSolvedByMe } : p,
        ),
      );

      toast.success(
        `Marked as "${newSolvedByMe ? "Solved" : "Solved with Help"}"`,
      );
    } catch (error) {
      console.error("Error updating problem:", error);
      toast.error("Failed to update problem");
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
      const response = await fetch(`/api/problems/${problemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update");

      // Update local state
      setProblems(
        problems.map((p) =>
          p.id === problemId
            ? { ...p, needsRetry: data.needsRetry, retryNotes: data.retryNotes }
            : p,
        ),
      );

      toast.success("Retry status updated");
    } catch (error) {
      console.error("Error updating retry status:", error);
      toast.error("Failed to update retry status");
    } finally {
      setLoadingId(null);
    }
  };

  if (problems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">
            No problems solved yet. Start solving on LeetCode!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg p-2 bg-blue-500">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg p-2 bg-green-500">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Easy</p>
              <p className="text-xl font-bold">{stats.easy}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg p-2 bg-yellow-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Medium</p>
              <p className="text-xl font-bold">{stats.medium}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg p-2 bg-red-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hard</p>
              <p className="text-xl font-bold">{stats.hard}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg p-2 bg-purple-500">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Solved Solo</p>
              <p className="text-xl font-bold">{stats.solvedByMe}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg p-2 bg-orange-500">
              <RotateCcw className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Need Retry</p>
              <p className="text-xl font-bold">{stats.retry}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by problem title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {filtersOpen && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label className="mb-2 block text-sm font-medium">Difficulty</Label>
                <div className="flex flex-wrap gap-2">
                  {availableDifficulties.map((difficulty) => (
                    <div key={difficulty} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`difficulty-${difficulty}`}
                        checked={selectedDifficulties.has(difficulty)}
                        onCheckedChange={() => handleDifficultyChange(difficulty)}
                      />
                      <Label
                        htmlFor={`difficulty-${difficulty}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {difficulty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Topic</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTopics.map((topic) => (
                    <div key={topic} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`topic-${topic}`}
                        checked={selectedTopics.has(topic)}
                        onCheckedChange={() => handleTopicChange(topic)}
                      />
                      <Label
                        htmlFor={`topic-${topic}`}
                        className="font-normal cursor-pointer text-sm"
                      >
                        {topic}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status-filter">Solve Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                    <SelectTrigger id="status-filter" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="solved">Solved by me</SelectItem>
                      <SelectItem value="help">With Help</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="retry-filter">Retry Status</Label>
                  <Select value={retryFilter} onValueChange={(v) => v && setRetryFilter(v)}>
                    <SelectTrigger id="retry-filter" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="yes">Needs Retry</SelectItem>
                      <SelectItem value="no">No Retry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Problems ({filteredProblems.length} / {problems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProblems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No problems match your filters
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead className="text-center">Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Retry</TableHead>
                    <TableHead>Solved At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProblems.map((problem) => (
                    <TableRow key={problem.id}>
                      <TableCell>
                        <a
                          href={`https://leetcode.com/problems/${problem.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                        >
                          {problem.title}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={difficultyColor[problem.difficulty] || ""}
                        >
                          {problem.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>{problem.topic}</TableCell>
                      <TableCell className="text-center">
                        <a
                          href={problem.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                          title="View on GitHub"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={problem.solvedByMe ? "solved" : "help"}
                          onValueChange={(value) =>
                            handleStatusUpdate(problem.id, value === "solved")
                          }
                          disabled={loadingId === problem.id}
                        >
                          <SelectTrigger className="w-auto inline-flex border-0 bg-transparent p-0 h-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solved">
                              Solved by me
                            </SelectItem>
                            <SelectItem value="help">With Help</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                        <RetryNotesModal
                          problemId={problem.id}
                          currentNeedRetry={problem.needsRetry}
                          currentNotes={problem.retryNotes}
                          onUpdate={(data) =>
                            handleRetryUpdate(problem.id, data)
                          }
                          isSaving={loadingId === problem.id}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(problem.solvedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
