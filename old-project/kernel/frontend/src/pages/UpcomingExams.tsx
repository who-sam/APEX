import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { useStudentExams } from "@/hooks/useExams";
import { PageSkeleton } from "@/components/PageSkeleton";

export default function UpcomingExamsPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { data: rawExams, isLoading } = useStudentExams();

  const exams = (rawExams || [])
    .filter((e: any) => {
      if (!e.start_time && !e.end_time) return true;
      const end = e.end_time ? new Date(e.end_time) : new Date(e.start_time);
      return end >= new Date();
    })
    .map((e: any) => ({
      id: e.id,
      name: e.title,
      date: e.start_time ? new Date(e.start_time) : new Date(),
      duration: `${e.duration_minutes || 60} min`,
      description: e.description || "",
    }));

  const examDates = exams.map((e: any) => e.date);
  const selectedExam = selectedDate ? exams.find((e: any) => isSameDay(e.date, selectedDate)) : null;
  const sortedExams = [...exams].sort((a: any, b: any) => a.date.getTime() - b.date.getTime());

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Upcoming Exams</h1>
        <p className="mt-1 text-muted-foreground">View your exam schedule and prepare ahead.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Calendar */}
        <Card className="xl:col-span-1 border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="p-3 pointer-events-auto"
              modifiers={{ exam: examDates }}
              modifiersClassNames={{ exam: "bg-primary/20 text-primary font-bold rounded-full" }}
            />
            {selectedExam && (
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                <p className="font-semibold text-foreground">{selectedExam.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {selectedExam.duration}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam list */}
        <Card className="xl:col-span-2 border-border/50 bg-card/80 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Exam Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedExams.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No upcoming exams</p>
            ) : sortedExams.map((exam: any) => {
              const isSelected = selectedDate && isSameDay(exam.date, selectedDate);
              return (
                <div
                  key={exam.id}
                  onClick={() => setSelectedDate(exam.date)}
                  className={`flex items-center justify-between rounded-xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-sm"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="text-xs font-medium leading-none">{format(exam.date, "MMM")}</span>
                      <span className="text-lg font-bold leading-none">{format(exam.date, "d")}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{exam.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{format(exam.date, "EEEE, MMM d")}</span>
                        <span>·</span>
                        <span>{exam.duration}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1 text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/exam/${exam.id}`); }}>
                    Take <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
