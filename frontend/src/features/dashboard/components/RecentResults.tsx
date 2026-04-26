import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, CheckCircle2, AlertCircle } from "lucide-react";

const pastResults = [
  { id: 1, name: "Python Basics", date: "Feb 15, 2026", score: 92, total: 100, status: "passed" },
  { id: 2, name: "SQL Masterclass", date: "Feb 10, 2026", score: 78, total: 100, status: "passed" },
  { id: 3, name: "Node.js Advanced", date: "Feb 05, 2026", score: 45, total: 100, status: "failed" },
  { id: 4, name: "Git & Version Control", date: "Jan 28, 2026", score: 88, total: 100, status: "passed" },
  { id: 5, name: "HTML5 Essentials", date: "Jan 20, 2026", score: 95, total: 100, status: "passed" },
];

export function RecentResults() {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-accent" />
          Recent Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exam</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pastResults.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.date}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={r.score} className="h-2 w-16" />
                    <span className="text-sm font-medium">{r.score}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {r.status === "passed" ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Failed</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
