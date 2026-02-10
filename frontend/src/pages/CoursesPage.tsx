import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MoveLeft } from "lucide-react";

interface Course {
  id: number;
  name: string;
  description: string;
  kitId: number | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await api.get("/courses");
        const formatted = data.map((c: any) => ({
          id: c.courseId || c.Id || c.id,
          name: c.name || c.Name,
          description: c.description || c.Description,
          kitId: c.kits && c.kits.length > 0 ? (c.kits[0].kitId || c.kits[0].id) : null
        }));
        setCourses(formatted);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
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
      )}
    </div>
  );
}