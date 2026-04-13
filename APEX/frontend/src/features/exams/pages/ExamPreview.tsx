import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Clock, FileText, Code2, CheckSquare, HelpCircle, Eye,
} from "lucide-react";
import { useExam } from "@/hooks/useExams";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ErrorState } from "@/components/ErrorState";

function parseJSON(val: any, fallback: any = []) {
  if (!val) return fallback;
  if (typeof val !== "string") return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

const typeIcon: Record<string, React.ElementType> = {
  mcq: CheckSquare,
  written: FileText,
  coding: Code2,
};

const typeLabel: Record<string, string> = {
  mcq: "Multiple Choice",
  written: "Written",
  coding: "Coding",
};

export default function ExamPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const examId = Number(id);
  const { data: exam, isLoading, error, refetch } = useExam(examId);

  if (isLoading) return <PageSkeleton cards={2} rows={5} />;
  if (error) return <ErrorState message="Failed to load exam" onRetry={refetch} />;

  if (!exam) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/exams")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Exams
        </Button>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Exam Not Found</h2>
            <p className="text-sm text-muted-foreground">No preview data available for this exam.</p>
          </div>
        </div>
      </div>
    );
  }

  const problems: any[] = exam.problems || [];
  const totalPoints = problems.reduce((s: number, p: any) => s + (p.points || 0), 0);
  const mcqCount = problems.filter((p: any) => p.type === "mcq").length;
  const writtenCount = problems.filter((p: any) => p.type === "written").length;
  const codingCount = problems.filter((p: any) => p.type === "coding").length;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/dashboard/exams")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Exams
      </Button>

      {/* Preview banner */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
        <Eye className="h-5 w-5 text-accent shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Preview Mode</p>
          <p className="text-xs text-muted-foreground">This is how the exam appears to students. No answers will be recorded.</p>
        </div>
      </div>

      {/* Header */}
      <Card className="bg-card/80 backdrop-blur-md border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <p className="text-sm text-muted-foreground mt-2">{exam.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{exam.duration_minutes || 60} minutes</span>
              </div>
              <Badge variant="secondary" className="text-xs">{totalPoints} points</Badge>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{problems.length} questions</span>
            </div>
            {mcqCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckSquare className="h-4 w-4" />
                <span>{mcqCount} MCQ</span>
              </div>
            )}
            {writtenCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{writtenCount} Written</span>
              </div>
            )}
            {codingCount > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Code2 className="h-4 w-4" />
                <span>{codingCount} Coding</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {problems.map((p: any, i: number) => {
          const TypeIcon = typeIcon[p.type] || FileText;
          const options = parseJSON(p.options, []);
          const testCases: any[] = p.test_cases || [];

          return (
            <Card key={p.id} className="bg-card/80 backdrop-blur-md border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <Badge variant="outline" className="gap-1 capitalize">
                      <TypeIcon className="h-3 w-3" />
                      {typeLabel[p.type] || p.type}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs">{p.points} pts</Badge>
                </div>
                <CardTitle className="text-base mt-3">{p.title || p.description}</CardTitle>
              </CardHeader>
              <CardContent>
                {p.type === "mcq" && (
                  <div className="space-y-2">
                    {options.map((opt: any) => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 p-3 text-sm text-foreground"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border text-[10px] font-medium text-muted-foreground shrink-0">
                          {opt.id.toUpperCase()}
                        </div>
                        <span>{opt.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {p.type === "written" && (
                  <div className="rounded-lg border border-dashed border-border/50 bg-secondary/10 p-6 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Text response area {p.max_word_count ? `\u2022 ${p.max_word_count} word limit` : ""}
                    </p>
                  </div>
                )}

                {p.type === "coding" && (
                  <div className="space-y-3">
                    {p.description && p.title && (
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    )}
                    {p.starter_code && (
                      <div className="rounded-lg border border-border/50 bg-muted/50 p-4 font-mono text-xs text-muted-foreground whitespace-pre">
                        {p.starter_code}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{testCases.length} test cases</span>
                      <span>&bull;</span>
                      <span>{testCases.filter((t: any) => t.is_sample).length} sample</span>
                      <span>&bull;</span>
                      <span>Time limit: {p.time_limit_ms || 2000}ms</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
