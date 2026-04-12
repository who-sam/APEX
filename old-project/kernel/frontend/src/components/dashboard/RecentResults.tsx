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
import { useStudentSubmissions } from "@/hooks/useSubmissions";
import { formatRelativeTime } from "@/lib/mappers";

export function RecentResults() {
  const { data: submissions, isLoading } = useStudentSubmissions();

  const pastResults = (submissions || []).slice(0, 5).map((sub: any) => ({
    id: sub.id,
    name: sub.problem?.title || "Unknown",
    date: formatRelativeTime(sub.submitted_at),
    score: Math.round(sub.score ?? 0),
    total: 100,
    status: sub.status === "passed" || sub.status === "accepted" ? "passed" : sub.status === "failed" ? "failed" : sub.status,
  }));

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-accent" />
          Recent Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : pastResults.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastResults.map((r: any) => (
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
                    {r.status === "passed" || r.status === "accepted" ? (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Passed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium capitalize">{r.status}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
