import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MoveLeft, Loader2 } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";

interface Course {
  id: number;
  name: string;
  description: string;
  kitId: number | null;
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const { items: rawCourses, loading, hasMore, loadMore } = usePagination<any>("/courses", 12);

  const courses = useMemo(() => 
    rawCourses.map((c: any) => ({
      id: c.courseId || c.Id || c.id,
      name: c.name || c.Name,
      description: c.description || c.Description,
      kitId: c.kits && c.kits.length > 0 ? (c.kits[0].kitId || c.kits[0].id) : null
    })),
    [rawCourses]
  );

  return (
    <div className="min-h-screen bg-black p-8 text-white font-sans">
      <div className="flex items-center gap-4 mb-12">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="hover:bg-neutral-800 p-2 rounded-full transition-all"
        >
          <MoveLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Courses</h1>
          <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">Academic Catalog</p>
        </div>
      </div>

      {loading && courses.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-white" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
          <p className="text-neutral-500 uppercase tracking-widest text-sm">No courses found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card 
                key={course.id} 
                className="bg-neutral-950 border-neutral-800 rounded-3xl overflow-hidden flex flex-col border-t-4 border-t-neutral-700 shadow-2xl"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-white uppercase tracking-tight leading-tight">
                    {course.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {course.description}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-neutral-900">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Required Hardware</p>
                    <Button 
                      onClick={() => navigate(`/kits/${course.kitId}`)}
                      disabled={!course.kitId}
                      className="w-full bg-black text-white border border-neutral-800 hover:bg-white hover:text-black font-black rounded-xl flex items-center justify-center gap-2 py-6 transition-all duration-300"
                    >
                      <Package className="w-5 h-5" />
                      {course.kitId ? "GET LINKED KIT" : "NO KIT REQUIRED"}
                    </Button>
                  </div>
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