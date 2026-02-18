import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import PageHeader from "@/components/PageHeader";

interface Enrollment {
  enrollmentId?: number;
  id?: number;
  courseId?: number;
  courseName?: string;
  progressPercentage?: number;
  isCompleted?: boolean;
  totalModules?: number;
  completedModules?: number;
  course?: {
    courseId?: number;
    name?: string;
    description?: string;
  };
}

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const { items: rawEnrollments, loading, hasMore, loadMore } = usePagination<Enrollment>("/Enrollments/MyEnrollments", 10);

  const courses = useMemo(() => 
    rawEnrollments.map((e: Enrollment) => ({
      enrollmentId: e.enrollmentId || e.id,
      courseId: e.course?.courseId || e.courseId,
      courseName: e.courseName || e.course?.name || "Untitled Course",
      courseDescription: e.course?.description || "",
      progressPercentage: e.progressPercentage ?? 0,
      isCompleted: e.isCompleted ?? false,
      totalModules: e.totalModules ?? 0,
      completedModules: e.completedModules ?? 0,
    })),
    [rawEnrollments]
  );

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <PageHeader title="My Learning" showBackButton={true} />

      {loading && courses.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin text-white w-10 h-10" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
          <p className="text-neutral-500 uppercase tracking-widest text-sm">No courses joined yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.enrollmentId} className="bg-neutral-800 border border-neutral-700 text-white hover:border-neutral-600 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="uppercase font-bold tracking-tight">{course.courseName}</CardTitle>
                    {course.isCompleted && (
                      <span className="text-xs bg-green-500/20 border border-green-500/50 text-green-400 px-2 py-0.5 rounded shrink-0">
                        Completed
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.courseDescription && (
                    <p className="text-neutral-400 text-sm line-clamp-2">{course.courseDescription}</p>
                  )}
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-neutral-400 text-xs font-mono">
                        {course.completedModules}/{course.totalModules} modules
                      </span>
                      <span className="text-neutral-300 text-xs font-medium">
                        {course.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${course.isCompleted ? 'bg-green-500' : 'bg-white/90'}`}
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-white text-black hover:bg-neutral-200 font-bold"
                    onClick={() => navigate(`/courses/${course.courseId}/content?enrollmentId=${course.enrollmentId}`)}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> {course.isCompleted ? "REVIEW LESSON" : course.progressPercentage > 0 ? "CONTINUE LESSON" : "START LESSON"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button
                onClick={loadMore}
                disabled={loading}
                className="bg-white text-black hover:bg-neutral-200 font-black uppercase px-8 py-6 rounded-2xl border-2 border-white transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}