import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Clock, BookOpen, Zap, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const practiceExams = [
  { id: 1, name: "JavaScript Fundamentals", category: "JavaScript", questions: 40, duration: "45 min", difficulty: "Easy", completed: 75, description: "Variables, loops, functions, and basic DOM manipulation." },
  { id: 2, name: "Data Structures", category: "CS Core", questions: 30, duration: "90 min", difficulty: "Medium", completed: 40, description: "Arrays, linked lists, stacks, queues, and basic algorithms." },
  { id: 3, name: "Algorithms & Graphs", category: "CS Core", questions: 25, duration: "120 min", difficulty: "Hard", completed: 10, description: "Graph algorithms, dynamic programming, and sorting." },
  { id: 4, name: "JS Basics Review", category: "JavaScript", questions: 35, duration: "45 min", difficulty: "Easy", completed: 90, description: "Second pass on variables, loops, functions, and DOM basics." },
  { id: 5, name: "Data Structures II", category: "CS Core", questions: 30, duration: "90 min", difficulty: "Medium", completed: 0, description: "Advanced practice on stacks, queues, trees, and hash tables." },
  { id: 6, name: "Algorithms Challenge", category: "CS Core", questions: 20, duration: "120 min", difficulty: "Hard", completed: 0, description: "Challenging problems on graphs, DP, and sorting algorithms." },
];

const categories = ["All", "JavaScript", "CS Core"];

const diffColor = (d: string) => {
  if (d === "Easy") return "bg-green-500/15 text-green-500 border-green-500/30";
  if (d === "Medium") return "bg-accent/15 text-accent border-accent/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

export default function PracticePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = practiceExams.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Practice</h1>
          <p className="mt-1 text-muted-foreground">Sharpen your skills with practice exams.</p>
        </div>
        <Button
          size="lg"
          className="gap-2 text-base font-semibold shadow-lg shadow-primary/25"
          onClick={() => { const ids = ["1", "mid-ds", "algo-final"]; navigate(`/dashboard/exam/${ids[Math.floor(Math.random() * ids.length)]}`); }}
        >
          <Zap className="h-5 w-5" />
          Quick Random Quiz
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search practice exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              className="rounded-full text-xs"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Exam cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((exam) => (
          <Card key={exam.id} className="border-border/50 bg-card/80 backdrop-blur-md hover:border-primary/30 transition-all hover:shadow-md group">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{exam.name}</h3>
                  <p className="text-xs text-muted-foreground">{exam.description}</p>
                </div>
                <Badge variant="outline" className={diffColor(exam.difficulty)}>
                  {exam.difficulty}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {exam.questions} Qs</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration}</span>
                <Badge variant="secondary" className="text-xs">{exam.category}</Badge>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{exam.completed}%</span>
                </div>
                <Progress value={exam.completed} className="h-2" />
              </div>

              <Button
                className="w-full gap-2"
                variant={exam.completed > 0 ? "outline" : "default"}
                onClick={() => navigate(`/dashboard/exam/${exam.id}`)}
              >
                <Play className="h-4 w-4" />
                {exam.completed > 0 ? "Continue" : "Start Practice"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No practice exams match your filters.</p>
        </div>
      )}
    </div>
  );
}
