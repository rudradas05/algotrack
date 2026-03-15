import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: string;
  topic: string;
  githubUrl: string;
  solvedAt: string;
}

const difficultyColor: Record<string, string> = {
  Easy: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  Medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  Hard: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export function RecentProblems({ problems }: { problems: Problem[] }) {
  if (problems.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Problems</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No problems solved yet. Start solving on LeetCode!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Recent Problems</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Solved At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((problem) => (
              <TableRow key={problem.id}>
                <TableCell>
                  <a
                    href={problem.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {problem.title}
                  </a>
                </TableCell>
                <TableCell>{problem.platform}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={difficultyColor[problem.difficulty] || ""}
                  >
                    {problem.difficulty}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs">
                    {problem.topic}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(problem.solvedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
