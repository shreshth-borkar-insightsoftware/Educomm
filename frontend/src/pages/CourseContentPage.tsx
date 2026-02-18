import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "@/api/axiosInstance";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button"; 
import { Loader2, AlertCircle, CheckCircle2, X, List, ChevronRight, PlayCircle, FileText } from "lucide-react";
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
  const [allContent, setAllContent] = useState<CourseContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<CourseContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // Fetch all content for this course
        const { data } = await api.get(`/CourseContents/${id}`);
        const contentList: CourseContent[] = Array.isArray(data) ? data : [];
        
        // Sort by sequenceOrder
        contentList.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
        setAllContent(contentList);
        
        // Fetch progress if enrolled
        let completedSet = new Set<number>();
        if (enrollmentId) {
          try {
            const progressData = await api.get(`/progress/${enrollmentId}`);
            const details: ContentProgress[] = progressData.data.contentDetails || [];
            details.forEach((item) => {
              if (item.isCompleted) completedSet.add(item.courseContentId);
            });
          } catch (err) {
            console.error("Error fetching progress:", err);
          }
        }
        setCompletedModules(completedSet);
        
        // Select the right module
        if (courseContentId) {
          const target = contentList.find(c => c.contentId === Number(courseContentId));
          setSelectedContent(target || contentList[0] || null);
        } else {
          // Auto-select first incomplete module, or first module
          const firstIncomplete = contentList.find(c => !completedSet.has(c.contentId));
          setSelectedContent(firstIncomplete || contentList[0] || null);
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

  const handleSelectModule = (content: CourseContent) => {
    setSelectedContent(content);
    setSidebarOpen(false);
  };

  const handleMarkComplete = async () => {
    if (!enrollmentId || !selectedContent) return;
    
    const parsedEnrollmentId = Number(enrollmentId);
    if (!Number.isInteger(parsedEnrollmentId) || parsedEnrollmentId <= 0) {
      console.error("Invalid enrollmentId:", enrollmentId);
      return;
    }

    try {
      setMarkingComplete(true);
      await api.post("/progress/complete", {
        enrollmentId: parsedEnrollmentId,
        courseContentId: selectedContent.contentId
      });
      setCompletedModules(prev => new Set(prev).add(selectedContent.contentId));
    } catch (err) {
      console.error("Error marking content as complete:", err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleNextModule = () => {
    if (!selectedContent) return;
    const currentIdx = allContent.findIndex(c => c.contentId === selectedContent.contentId);
    if (currentIdx < allContent.length - 1) {
      setSelectedContent(allContent[currentIdx + 1]);
    }
  };

  const isCurrentCompleted = selectedContent ? completedModules.has(selectedContent.contentId) : false;
  const currentIndex = selectedContent ? allContent.findIndex(c => c.contentId === selectedContent.contentId) : -1;
  const hasNext = currentIndex < allContent.length - 1;

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-white w-10 h-10" />
    </div>
  );

  if (allContent.length === 0) return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-neutral-700 w-12 h-12 mb-4" />
      <h1 className="text-xl font-bold uppercase tracking-widest mb-2">Content Not Found</h1>
      <p className="text-neutral-500 mb-6 max-w-xs">No lessons found for this course ID in the database.</p>
      <Button onClick={() => navigate("/my-courses")} variant="outline">BACK TO COURSES</Button>
    </div>
  );

  const isDirectVideo = selectedContent?.contentUrl?.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden">
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 z-50 px-4 py-3 flex items-center justify-between">
        {/* Left side: Module list toggle + Exit */}
        <div className="flex items-center gap-3">
          {allContent.length > 1 && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-800 flex items-center gap-2"
              aria-label="Toggle module list"
            >
              <List className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">
                {currentIndex + 1}/{allContent.length}
              </span>
            </button>
          )}
          <BackButton to="/my-courses" className="font-bold italic uppercase tracking-wide text-white hover:text-gray-300">
            EXIT LESSON
          </BackButton>
        </div>

        {/* Center: Current module title */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
          <span className="text-neutral-400 text-xs font-mono uppercase tracking-wider">
            {selectedContent?.title}
          </span>
        </div>

        {/* Right side: Completion + Next + Close */}
        <div className="flex items-center gap-3">
          {enrollmentId && selectedContent && (
            <>
              {isCurrentCompleted ? (
                <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase hidden sm:inline">Done</span>
                </div>
              ) : (
                <Button
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  size="sm"
                  className="bg-white text-black hover:bg-neutral-200 font-bold uppercase text-xs"
                >
                  {markingComplete ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    "Complete"
                  )}
                </Button>
              )}
              {hasNext && (
                <Button
                  onClick={handleNextModule}
                  size="sm"
                  variant="outline"
                  className="text-white border-neutral-600 hover:bg-neutral-800 font-bold uppercase text-xs gap-1"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
          <button
            onClick={() => navigate("/my-courses")}
            className="text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-gray-800"
            aria-label="Close lesson"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main area below header */}
      <div className="flex-1 flex mt-14 overflow-hidden">
        {/* Module Sidebar - slides in from left */}
        {allContent.length > 1 && (
          <>
            {/* Backdrop */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/60 z-30 mt-14"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div className={`fixed left-0 top-14 bottom-0 w-80 bg-gray-900 border-r border-neutral-700 z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-4">
                <h3 className="text-white font-black uppercase tracking-tight text-sm mb-1">Course Modules</h3>
                <p className="text-neutral-500 text-xs font-mono mb-4">
                  {completedModules.size}/{allContent.length} completed
                </p>
                {/* Progress bar */}
                <div className="w-full bg-neutral-700 rounded-full h-1.5 mb-5">
                  <div 
                    className="bg-white/90 h-1.5 rounded-full transition-all"
                    style={{ width: `${allContent.length > 0 ? (completedModules.size / allContent.length * 100) : 0}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {allContent.map((module, idx) => {
                    const isActive = selectedContent?.contentId === module.contentId;
                    const isDone = completedModules.has(module.contentId);
                    return (
                      <button
                        key={module.contentId}
                        onClick={() => handleSelectModule(module)}
                        className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${
                          isActive 
                            ? 'bg-white/10 border border-neutral-600' 
                            : 'hover:bg-neutral-800 border border-transparent'
                        }`}
                      >
                        {/* Module number / check */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isDone 
                            ? 'bg-green-500/20 text-green-400' 
                            : isActive 
                              ? 'bg-white text-black' 
                              : 'bg-neutral-700 text-neutral-400'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                            {module.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {module.contentType === "Video" ? (
                              <PlayCircle className="w-3 h-3 text-neutral-500" />
                            ) : (
                              <FileText className="w-3 h-3 text-neutral-500" />
                            )}
                            <span className="text-neutral-500 text-xs">{module.contentType}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {selectedContent && (
            isDirectVideo ? (
              <video 
                key={selectedContent.contentId}
                src={selectedContent.contentUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain" 
              />
            ) : (
              <iframe 
                key={selectedContent.contentId}
                src={selectedContent.contentUrl} 
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; encrypted-media"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}