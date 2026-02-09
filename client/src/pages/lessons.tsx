import { useState } from "react";
import { useLessons } from "@/hooks/use-lessons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, FileText, Link as LinkIcon, ArrowLeft, Loader2, BookOpen, ChevronRight } from "lucide-react";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return (
      <div className="bg-muted/30 rounded-md p-8 text-center">
        <p className="text-muted-foreground">Не удалось загрузить видео. Проверьте ссылку.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm mt-2 inline-block">
          Открыть в YouTube
        </a>
      </div>
    );
  }
  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full rounded-md"
        src={`https://www.youtube.com/embed/${videoId}?rel=0`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        data-testid="video-player"
      />
    </div>
  );
}

function LessonDetail({ lesson, onBack }: { lesson: any; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-lessons">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
              {lesson.course}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Урок #{lesson.orderIndex}
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-1 truncate">{lesson.title}</h2>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {lesson.contentType === "VIDEO" ? (
            <YouTubeEmbed url={lesson.content} />
          ) : lesson.contentType === "ARTICLE" ? (
            <div className="prose prose-sm max-w-none dark:prose-invert" data-testid="article-content">
              {lesson.content.split("\n").map((paragraph: string, idx: number) => (
                <p key={idx} className={paragraph.trim() === "" ? "h-4" : "text-foreground leading-relaxed"}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">Материал доступен по ссылке ниже:</p>
              <div className="bg-muted/30 rounded-md p-4 border border-border">
                <iframe
                  src={lesson.content}
                  className="w-full border-0 rounded-md"
                  style={{ height: "70vh" }}
                  title={lesson.title}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                  data-testid="link-iframe"
                  onError={() => {}}
                />
              </div>
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <a href={lesson.content} target="_blank" rel="noopener noreferrer" data-testid="link-open-external">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Открыть в новой вкладке
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LessonsPage() {
  const { data: lessons, isLoading } = useLessons();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedLesson) {
    return <LessonDetail lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />;
  }

  const activeLessons = lessons?.filter((l: any) => l.isActive) || [];

  const groupedLessons = activeLessons.reduce((acc: Record<string, any[]>, lesson: any) => {
    if (!acc[lesson.course]) acc[lesson.course] = [];
    acc[lesson.course].push(lesson);
    return acc;
  }, {} as Record<string, any[]>);

  Object.values(groupedLessons).forEach((courseLessons) => {
    (courseLessons as any[]).sort((a: any, b: any) => a.orderIndex - b.orderIndex);
  });

  const contentTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return <PlayCircle className="w-4 h-4 text-primary" />;
      case "ARTICLE": return <FileText className="w-4 h-4 text-primary" />;
      default: return <LinkIcon className="w-4 h-4 text-primary" />;
    }
  };

  const contentTypeLabel = (type: string) => {
    switch (type) {
      case "VIDEO": return "Видео";
      case "ARTICLE": return "Статья";
      default: return "Ссылка";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold">Обучение</h2>
        <p className="text-muted-foreground mt-1">Развивайте свои навыки и получайте знания</p>
      </div>

      <div className="space-y-8">
        {(Object.entries(groupedLessons) as [string, any[]][]).map(([course, courseLessons]) => (
          <div key={course} className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">{course}</h3>
              <Badge variant="secondary" className="text-xs">{courseLessons.length} {courseLessons.length === 1 ? "урок" : courseLessons.length < 5 ? "урока" : "уроков"}</Badge>
            </div>
            <div className="space-y-2">
              {courseLessons.map((lesson: any, idx: number) => (
                <Card
                  key={lesson.id}
                  className="cursor-pointer hover-elevate transition-colors"
                  onClick={() => setSelectedLesson(lesson)}
                  data-testid={`card-lesson-${lesson.id}`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">{lesson.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {contentTypeIcon(lesson.contentType)}
                        <span className="text-xs text-muted-foreground">{contentTypeLabel(lesson.contentType)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {activeLessons.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Уроков пока нет</p>
          </div>
        )}
      </div>
    </div>
  );
}
