import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  GraduationCap,
  Activity,
  ArrowRight,
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
  getClasses,
  getExams,
  getExamResults,
  type ClassData,
  type ExamData,
  type StudentResult,
} from "@/lib/api";

export default function OverviewPage() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [recentResults, setRecentResults] = useState<
    Array<{ examTitle: string; examId: number; results: StudentResult[] }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [classData, examData] = await Promise.all([
          getClasses(),
          getExams(),
        ]);
        setClasses(classData);
        setExams(examData);

        // Fetch results for the most recent exams (up to 3)
        const recentExams = [...examData]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          .slice(0, 3);

        const resultsData = await Promise.all(
          recentExams.map(async (exam) => {
            try {
              const results = await getExamResults(exam.id);
              return { examTitle: exam.title, examId: exam.id, results };
            } catch {
              return { examTitle: exam.title, examId: exam.id, results: [] };
            }
          })
        );
        setRecentResults(resultsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalStudents = classes.reduce((sum, c) => sum + c.member_count, 0);

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
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Teacher Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your classes, exams, and student activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-3xl font-bold text-foreground">
                  {classes.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {classes.length > 0
                ? `Latest: ${classes[classes.length - 1].name}`
                : "No classes yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Exams</p>
                <p className="text-3xl font-bold text-foreground">
                  {exams.length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <GraduationCap className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {exams.reduce((s, e) => s + e.problem_count, 0)} total problems
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground">
                  {totalStudents}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Across {classes.length} classes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          className="border-border/50 cursor-pointer transition-all hover:bg-secondary/40"
          onClick={() => navigate("/teacher/classes")}
        >
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Manage Classes</p>
                <p className="text-sm text-muted-foreground">
                  Create and manage your classes
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card
          className="border-border/50 cursor-pointer transition-all hover:bg-secondary/40"
          onClick={() => navigate("/teacher/exams")}
        >
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-foreground">Manage Exams</p>
                <p className="text-sm text-muted-foreground">
                  Create exams and view results
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Recent Exam Results
          </CardTitle>
          <CardDescription>
            Latest student submissions across your exams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentResults.length === 0 ||
          recentResults.every((r) => r.results.length === 0) ? (
            <p className="py-8 text-center text-muted-foreground">
              No exam results yet. Create an exam and assign it to a class to
              get started.
            </p>
          ) : (
            <div className="space-y-6">
              {recentResults
                .filter((r) => r.results.length > 0)
                .map((examResult) => (
                  <div key={examResult.examId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-foreground">
                        {examResult.examTitle}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary"
                        onClick={() =>
                          navigate(
                            `/teacher/exams/${examResult.examId}/results`
                          )
                        }
                      >
                        View All <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Average</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {examResult.results.slice(0, 5).map((student) => (
                          <TableRow key={student.user_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {student.email}
                                </p>
                              </div>
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
                                className={
                                  student.avg_score >= 70
                                    ? "bg-green-500/15 text-green-500 border-green-500/30"
                                    : student.avg_score >= 50
                                      ? "bg-accent/15 text-accent border-accent/30"
                                      : "bg-destructive/15 text-destructive border-destructive/30"
                                }
                              >
                                {student.avg_score.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
