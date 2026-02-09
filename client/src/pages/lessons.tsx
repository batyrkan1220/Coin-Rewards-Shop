import { useLessons } from "@/hooks/use-lessons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, PlayCircle, Loader2 } from "lucide-react";

export default function LessonsPage() {
  const { data: lessons, isLoading } = useLessons();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group by course
  const groupedLessons = lessons?.reduce((acc, lesson) => {
    if (!acc[lesson.course]) acc[lesson.course] = [];
    acc[lesson.course].push(lesson);
    return acc;
  }, {} as Record<string, typeof lessons>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Обучение</h2>
        <p className="text-muted-foreground mt-1">Развивайте свои навыки и получайте знания</p>
      </div>

      <div className="space-y-10">
        {Object.entries(groupedLessons || {}).map(([course, courseLessons]) => (
          <div key={course} className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Badge variant="outline" className="text-base py-1 px-3 border-primary/20 bg-primary/5 text-primary">
                Курс
              </Badge>
              {course}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseLessons.map((lesson) => (
                <Card key={lesson.id} className="hover:border-primary/50 transition-colors group">
                  <CardHeader>
                    <CardTitle className="leading-snug text-lg group-hover:text-primary transition-colors">
                      {lesson.title}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                      Урок #{lesson.orderIndex}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lesson.contentType === "LINK" ? (
                      <Button asChild className="w-full" variant="secondary">
                        <a href={lesson.content} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Открыть материал
                        </a>
                      </Button>
                    ) : (
                      <div className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {lesson.content}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {lessons?.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">Уроков пока нет</p>
          </div>
        )}
      </div>
    </div>
  );
}
