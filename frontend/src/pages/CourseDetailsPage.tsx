import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { MoveLeft, PackageSearch, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CourseDetails {
  id: number;
  name: string;
  description: string;
  linkedKitId?: number;
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const { data } = await api.get(`/Courses/${id}`);
        setCourse({
          id: data.id || data.courseId,
          name: data.name || data.Name,
          description: data.description || data.Description,
          linkedKitId: data.kitId || data.linkedKitId || data.KitId
        });
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
      <Loader2 className="animate-spin text-white w-10 h-10" />
    </div>
  );
  if (!course) return <div className="min-h-screen bg-black text-white p-8">Course not found.</div>;

  return (
    <div className="min-h-screen bg-black p-8 text-white font-sans">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="hover:bg-neutral-800 p-2 rounded-full transition-colors">
          <MoveLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-bold tracking-tighter uppercase">Course Details</h1>
      </div>

      <Card className="max-w-3xl bg-neutral-950 border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-neutral-900 pb-6">
          <p className="text-xs font-mono text-neutral-500 mb-2 uppercase tracking-widest">ID: {course.id}</p>
          <CardTitle className="text-3xl font-bold uppercase tracking-tight text-white">{course.name}</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-8">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">About this Course</h3>
            <p className="text-neutral-300 leading-relaxed text-lg">{course.description}</p>
          </div>

          <div className="pt-6 border-t border-neutral-900">
            <div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl">
                  <PackageSearch className="text-black w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg uppercase tracking-tight">Required Learning Kit</h4>
                  <p className="text-sm text-neutral-500">This course requires a specific hardware kit to complete.</p>
                </div>
              </div>

              <Button 
                onClick={() => navigate(`/kits/${course.linkedKitId}`)}
                disabled={!course.linkedKitId}
                className="bg-white text-black hover:bg-neutral-200 font-bold px-8 rounded-xl h-12"
              >
                {course.linkedKitId ? "VIEW LINKED KIT" : "NO KIT LINKED"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}