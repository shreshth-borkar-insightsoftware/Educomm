import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button"; 
import { Loader2, AlertCircle } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function CourseContentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuthStore(); 
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/CourseContents/${id}`);

        if (Array.isArray(data) && data.length > 0) {
          setContent(data[0]); 
        } else {
          setContent(null); 
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id, logout]);

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-white w-10 h-10" />
    </div>
  );

  if (!content) return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-neutral-700 w-12 h-12 mb-4" />
      <h1 className="text-xl font-bold uppercase tracking-widest mb-2">Content Not Found</h1>
      <p className="text-neutral-500 mb-6 max-w-xs">No lessons found for this course ID in the database.</p>
      <Button onClick={() => navigate("/my-courses")} variant="outline">BACK TO COURSES</Button>
    </div>
  );

  const isDirectVideo = content.contentUrl?.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 p-8 z-50 flex items-center gap-4">
        <BackButton />
        <span className="text-white font-bold italic uppercase tracking-wide">EXIT LESSON</span>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black">
        {isDirectVideo ? (
          <video 
            src={content.contentUrl} 
            controls 
            autoPlay 
            className="w-full h-full object-contain" 
          />
        ) : (
          <iframe 
            src={content.contentUrl} 
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
          />
        )}
      </div>
    </div>
  );
}