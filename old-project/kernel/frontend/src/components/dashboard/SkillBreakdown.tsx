import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";

const categories = [
  { name: "JavaScript", score: 88 },
  { name: "Python", score: 92 },
  { name: "React", score: 75 },
  { name: "SQL", score: 78 },
  { name: "Data Structures", score: 65 },
];

export function SkillBreakdown() {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="h-5 w-5 text-primary" />
          Skill Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{cat.name}</span>
              <span className="font-semibold text-foreground">{cat.score}%</span>
            </div>
            <Progress value={cat.score} className="h-2.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
