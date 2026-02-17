import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosInstance";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button"; 
import { Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import BackButton from "@/components/BackButton";

interface CourseContent {
  contentId: number;
  courseId: number;
  contentType: string;
  title: string;
  contentUrl: string;
  sequenceOrder: number;
  durationSeconds: number;
}

interface ContentProgress {
  courseContentId: number;
  title: string;
  orderIndex: number;
  contentType: string;
  isCompleted: boolean;
  completedAt: string | null;
}

export default function CourseContentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get("enrollmentId");
  const courseContentId = searchParams.get("courseContentId");
  const navigate = useNavigate();
  const { logout } = useAuthStore(); 
  const [content, setContent] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        let fetchedContent: CourseContent | null = null;
        
        // If courseContentId is provided, fetch that specific content
        if (courseContentId) {
          const { data } = await api.get(`/CourseContents/${courseContentId}`);
          if (Array.isArray(data) && data.length > 0) {
            fetchedContent = data[0]; 
          }
        } else {
          // Otherwise, fetch by courseId (original behavior)
          const { data } = await api.get(`/CourseContents/${id}`);
          if (Array.isArray(data) && data.length > 0) {
            fetchedContent = data[0]; 
          }
        }
        
        setContent(fetchedContent);
        
        // Fetch progress status if enrollmentId and content are available
        if (enrollmentId && fetchedContent) {
          try {
            const progressData = await api.get(`/progress/${enrollmentId}`);
            const contentProgress = progressData.data.contentDetails.find(
              (item: ContentProgress) => item.courseContentId === fetchedContent!.contentId
            );
            if (contentProgress) {
              setIsCompleted(contentProgress.isCompleted);
            }
          } catch (err) {
            console.error("Error fetching progress:", err);
          }
        }
      } catch (err: unknown) {
        console.error("Fetch error:", err);
        if (err && typeof err === 'object' && 'response' in err) {
          const error = err as { response?: { status?: number } };
          if (error.response?.status === 401) {
            logout();
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id, courseContentId, enrollmentId, logout]);

  const handleMarkComplete = async () => {
    if (!enrollmentId || !content) return;
    
    const parsedEnrollmentId = Number(enrollmentId);
    if (!Number.isInteger(parsedEnrollmentId) || parsedEnrollmentId <= 0) {
      console.error("Invalid enrollmentId:", enrollmentId);
      return;
    }

    try {
      setMarkingComplete(true);
      await api.post("/progress/complete", {
        enrollmentId: parsedEnrollmentId,
        courseContentId: content.contentId
      });
      setIsCompleted(true);
    } catch (err) {
      console.error("Error marking content as complete:", err);
    } finally {
      setMarkingComplete(false);
    }
  };

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
      {/* Fixed top bar with solid background and proper z-index */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 z-50 px-4 py-3 flex items-center justify-between">
        {/* Left side: Exit Lesson button */}
        <BackButton to="/my-courses" className="font-bold italic uppercase tracking-wide text-white hover:text-gray-300">
          EXIT LESSON
        </BackButton>

        {/* Right side: Completion badge + close icon */}
        <div className="flex items-center gap-4">
          {enrollmentId && (
            <>
              {isCompleted ? (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium uppercase">Completed</span>
                </div>
              ) : (
                <Button
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="bg-white text-black hover:bg-neutral-200 font-bold uppercase"
                >
                  {markingComplete ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Marking...
                    </>
                  ) : (
                    "Mark as Complete"
                  )}
                </Button>
              )}
            </>
          )}
          
          {/* Close (X) icon */}
          <button
            onClick={() => navigate("/my-courses")}
            className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-800"
            aria-label="Close lesson"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content area with top offset to account for fixed header */}
      <div className="flex-1 flex items-center justify-center bg-black mt-16">
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