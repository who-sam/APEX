import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Download,
  Users,
  Trophy,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getExam,
  getExamResults,
  getExamResultsExportUrl,
  type ExamData,
  type StudentResult,
} from "@/lib/api";

export default function ExamResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [examData, resultsData] = await Promise.all([
          getExam(Number(id)),
          getExamResults(Number(id)),
        ]);
        setExam(examData);
        setResults(resultsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load results"
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleExportCSV() {
    if (!id) return;
    const url = getExamResultsExportUrl(Number(id));
    const token = localStorage.getItem("token");
    // Open in new window with auth
    window.open(`${url}?token=${token}`, "_blank");
  }

  // Compute statistics
  const totalStudents = results.length;
  const avgScore =
    totalStudents > 0
      ? results.reduce((sum, r) => sum + r.avg_score, 0) / totalStudents
      : 0;
  const highestScore =
    totalStudents > 0 ? Math.max(...results.map((r) => r.total_score)) : 0;
  const passRate =
    totalStudents > 0
      ? (results.filter((r) => r.avg_score >= 50).length / totalStudents) * 100
      : 0;

  // Score distribution buckets
  const distribution = [
    { range: "0-20", count: 0, color: "bg-destructive" },
    { range: "21-40", count: 0, color: "bg-destructive/70" },
    { range: "41-60", count: 0, color: "bg-accent" },
    { range: "61-80", count: 0, color: "bg-green-500/70" },
    { range: "81-100", count: 0, color: "bg-green-500" },
  ];
  results.forEach((r) => {
    const score = r.avg_score;
    if (score <= 20) distribution[0].count++;
    else if (score <= 40) distribution[1].count++;
    else if (score <= 60) distribution[2].count++;
    else if (score <= 80) distribution[3].count++;
    else distribution[4].count++;
  });
  const maxBucket = Math.max(...distribution.map((d) => d.count), 1);

  const scoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500/15 text-green-500 border-green-500/30";
    if (score >= 50) return "bg-accent/15 text-accent border-accent/30";
    return "bg-destructive/15 text-destructive border-destructive/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => navigate("/teacher/exams")}>
          Back to Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="mt-1"
            onClick={() => navigate("/teacher/exams")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Exam Results
            </h1>
            <p className="mt-1 text-muted-foreground">
              {exam?.title ?? "Loading..."}
            </p>
          </div>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalStudents}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold text-foreground">
                  {avgScore.toFixed(1)}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
            </div>
            <Progress value={avgScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Highest Score</p>
                <p className="text-3xl font-bold text-green-500">
                  {highestScore}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <Trophy className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-3xl font-bold text-foreground">
                  {passRate.toFixed(0)}%
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <Progress value={passRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Score Distribution
          </CardTitle>
          <CardDescription>
            How students scored across this exam
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalStudents === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No results to display.
            </p>
          ) : (
            <div className="space-y-3">
              {distribution.map((bucket) => (
                <div key={bucket.range} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-muted-foreground text-right">
                    {bucket.range}%
                  </span>
                  <div className="flex-1">
                    <div
                      className={`h-8 rounded-lg ${bucket.color} transition-all flex items-center px-3`}
                      style={{
                        width: `${Math.max((bucket.count / maxBucket) * 100, bucket.count > 0 ? 8 : 0)}%`,
                      }}
                    >
                      {bucket.count > 0 && (
                        <span className="text-xs font-medium text-white">
                          {bucket.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="w-8 text-sm text-muted-foreground">
                    {bucket.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Student Results
          </CardTitle>
          <CardDescription>
            Per-student breakdown of scores and submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No students have submitted solutions yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Submissions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results
                  .sort((a, b) => b.total_score - a.total_score)
                  .map((student, index) => (
                    <TableRow key={student.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index === 0 && totalStudents > 1 && (
                            <Trophy className="h-4 w-4 text-accent" />
                          )}
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {student.total_score}
                          </span>
                          <Progress
                            value={student.total_score}
                            className="h-1.5 w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={scoreColor(student.avg_score)}
                        >
                          {student.avg_score.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.submissions.length} submission
                        {student.submissions.length !== 1 ? "s" : ""}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
