import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoveLeft, Loader2, PlayCircle } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";

interface EnrolledCourse {
  enrollmentId: number;
  courseId: number;
  courseName: string;
  courseDescription: string;
}

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const { items: rawEnrollments, loading, hasMore, loadMore } = usePagination<any>("/Enrollments/MyEnrollments", 10);

  const courses = useMemo(() => 
    rawEnrollments.map((e: any) => ({
      enrollmentId: e.enrollmentId || e.id,
      courseId: e.course?.courseId || e.courseId,
      courseName: e.course?.name || "Standard Course",
      courseDescription: e.course?.description || "No description available."
    })),
    [rawEnrollments]
  );

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="flex items-center gap-4 mb-10">
        <Button variant="ghost" className="hover:bg-neutral-800" onClick={() => navigate("/dashboard")}>
          <MoveLeft />
        </Button>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">My Learning</h1>
      </div>

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
              <Card key={course.enrollmentId} className="bg-neutral-950 border-neutral-800 text-white hover:border-neutral-700 transition-all">
                <CardHeader>
                  <CardTitle className="uppercase font-bold tracking-tight">{course.courseName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-neutral-500 text-sm line-clamp-2">{course.courseDescription}</p>
                  <Button 
                    className="w-full bg-white text-black hover:bg-neutral-200 font-bold"
                    onClick={() => navigate(`/courses/${course.courseId}/content`)}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> START LESSON
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