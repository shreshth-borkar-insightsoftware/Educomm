import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Package, 
  Monitor, 
  Star, 
  Zap, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Video,
  FileText
} from "lucide-react";
import api from "@/api/axiosInstance";

interface Kit {
  kitId: number;
  name: string;
  price: number;
  imageUrl?: string;
}

interface EnrollmentDto {
  enrollmentId: number;
  courseId: number;
  courseName: string;
  progressPercentage: number;
  isCompleted: boolean;
  totalModules: number;
  completedModules: number;
}

interface CourseProgress {
  enrollmentId: number;
  courseId: number;
  courseName: string;
  contentDetails: Array<{
    courseContentId: number;
    title: string;
    orderIndex: number;
    contentType: string;
    isCompleted: boolean;
    completedAt: string | null;
  }>;
  summary: {
    totalModules: number;
    completedModules: number;
    progressPercentage: number;
  };
}

interface Order {
  orderId: number;
  orderDate: string;
  status: string;
  orderItems: Array<{
    kit?: {
      name: string;
    };
  }>;
}

const kitTags = ["Popular", "New", "Best Value"];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [kits, setKits] = useState<Kit[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState({
    kits: true,
    enrollments: true,
    orders: true,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [courseProgress, setCourseProgress] = useState<Record<number, CourseProgress>>({});

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all data in parallel
      const [kitsResult, enrollmentsResult, ordersResult] = await Promise.allSettled([
        api.get("/kits", { params: { page: 1, pageSize: 3 } }),
        // Fetch reasonable amount of enrollments, sorted by most recent
        api.get("/enrollments/MyEnrollments", { params: { page: 1, pageSize: 50 } }),
        api.get("/Orders/MyOrders", { params: { page: 1, pageSize: 3 } }),
      ]);

      // Handle kits
      if (kitsResult.status === "fulfilled") {
        setKits(kitsResult.value.data.items || []);
      } else {
        console.error("Failed to fetch kits:", kitsResult.reason);
      }
      setLoading((prev) => ({ ...prev, kits: false }));

      // Handle enrollments
      if (enrollmentsResult.status === "fulfilled") {
        const allEnrollments = enrollmentsResult.value.data.items || [];
        setEnrollments(allEnrollments);
      } else {
        console.error("Failed to fetch enrollments:", enrollmentsResult.reason);
      }
      setLoading((prev) => ({ ...prev, enrollments: false }));

      // Handle orders
      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value.data.items || []);
      } else {
        console.error("Failed to fetch orders:", ordersResult.reason);
      }
      setLoading((prev) => ({ ...prev, orders: false }));
    };

    fetchData();
  }, []);

  const fetchCourseProgress = async (enrollmentId: number) => {
    if (courseProgress[enrollmentId]) {
      return; // Already fetched
    }
    try {
      const { data } = await api.get(`/progress/${enrollmentId}`);
      setCourseProgress((prev) => ({
        ...prev,
        [enrollmentId]: data
      }));
    } catch (err) {
      console.error("Error fetching course progress:", err);
    }
  };

  const toggleCourseExpansion = async (enrollmentId: number) => {
    if (expandedCourse === enrollmentId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(enrollmentId);
      await fetchCourseProgress(enrollmentId);
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    const type = contentType?.toLowerCase() || "";
    if (type.includes("video")) {
      return <Video className="w-4 h-4 text-gray-400" />;
    }
    return <FileText className="w-4 h-4 text-gray-400" />;
  };

  // Sort enrollments: in-progress by highest progress, then completed
  const sortedEnrollments = [...enrollments].sort((a, b) => {
    if (a.isCompleted && !b.isCompleted) return 1;
    if (!a.isCompleted && b.isCompleted) return -1;
    return b.progressPercentage - a.progressPercentage;
  });

  const displayEnrollments = isExpanded ? sortedEnrollments : sortedEnrollments.filter(e => !e.isCompleted).slice(0, 3);

  const getStatusBadgeClass = (status: string) => {
    const normalized = status?.toLowerCase() || "pending";
    switch (normalized) {
      case "confirmed":
        return "border border-green-500/50 text-green-400 bg-green-500/10";
      case "processing":
        return "border border-purple-500/50 text-purple-400 bg-purple-500/10";
      case "delivered":
        return "bg-green-500 text-white";
      case "cancelled":
        return "border border-red-500/50 text-red-400 bg-red-500/10";
      default:
        return "border border-gray-500/50 text-gray-400 bg-gray-500/10";
    }
  };

  const formatOrderId = (id: number, orderDate: string) => {
    const year = new Date(orderDate).getFullYear();
    return `ORD-${year}-${String(id).padStart(3, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase mt-1">Here's what's happening with your learning journey</p>
        </header>

        {/* Top Section - Hero Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hardware Kits Card */}
          <div 
            onClick={() => navigate("/kits")}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 transition-colors"
          >
            <Package className="w-8 h-8 text-purple-400 mb-4" />
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Hardware Kits</h2>
            <p className="text-neutral-400 text-sm mb-4">
              Browse and order physical resources for hands-on learning.
            </p>
            <button className="text-white text-sm font-medium flex items-center gap-1 hover:text-gray-300 transition-colors">
              SHOP NOW <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Digital Courses Card */}
          <div 
            onClick={() => navigate("/courses")}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-gray-700 transition-colors"
          >
            <Monitor className="w-8 h-8 text-purple-400 mb-4" />
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Digital Courses</h2>
            <p className="text-neutral-400 text-sm mb-4">
              Access curated courses in electronics and programming.
            </p>
            <button className="text-white text-sm font-medium flex items-center gap-1 hover:text-gray-300 transition-colors">
              BROWSE COURSES <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Kits */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Featured Kits</h3>
              </div>
              <button 
                onClick={() => navigate("/kits")}
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
              >
                View All
              </button>
            </div>

            {loading.kits ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : kits.length === 0 ? (
              <p className="text-neutral-400 text-sm py-8 text-center">
                No kits available.{" "}
                <button 
                  onClick={() => navigate("/kits")}
                  className="text-white hover:text-gray-300"
                >
                  Browse catalog
                </button>
              </p>
            ) : (
              <div className="space-y-3">
                {kits.map((kit, index) => (
                  <div 
                    key={kit.kitId}
                    onClick={() => navigate(`/kits/${kit.kitId}`)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium text-sm">{kit.name}</p>
                        <p className="text-gray-300 text-xs">₹{kit.price}</p>
                      </div>
                    </div>
                    <span className="text-xs text-white bg-transparent border border-gray-700 px-2 py-1 rounded">
                      {kitTags[index % kitTags.length]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continue Learning */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between mb-4">
              <div 
                id="continue-learning-header"
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => enrollments.length > 0 && setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={enrollments.length > 0 ? 0 : undefined}
                aria-disabled={enrollments.length === 0}
                aria-expanded={enrollments.length > 0 ? isExpanded : false}
                aria-controls="continue-learning-content"
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && enrollments.length > 0) {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }
                }}
                aria-label={
                  enrollments.length === 0 
                    ? "No courses to expand" 
                    : isExpanded 
                      ? "Collapse Continue Learning section" 
                      : "Expand Continue Learning section"
                }
              >
                <Zap className="w-5 h-5 text-purple-400 pointer-events-none" />
                <h3 className="text-lg font-black uppercase tracking-tight text-white pointer-events-none">Continue Learning</h3>
                {enrollments.length > 0 && (
                  <span 
                    className="text-white transition-colors pointer-events-none"
                    aria-hidden="true"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => navigate("/my-courses")}
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
              >
                My Learning
              </button>
            </div>

            {loading.enrollments ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : displayEnrollments.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-neutral-400 text-sm mb-2">
                  No courses started yet. Browse courses to get started!
                </p>
                <button 
                  onClick={() => navigate("/courses")}
                  className="text-white text-sm font-medium hover:text-gray-300"
                >
                  Browse New Courses
                </button>
              </div>
            ) : (
              <>
                <div 
                  id="continue-learning-content"
                  role="region"
                  aria-labelledby="continue-learning-header"
                  className={`space-y-4 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-screen overflow-y-auto' : 'max-h-none'}`}
                >
                  {displayEnrollments.map((enrollment) => (
                    <div key={enrollment.enrollmentId} className="border-b border-gray-800 pb-4 last:border-b-0">
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/courses/${enrollment.courseId}`)}
                              className="text-white font-medium text-sm hover:text-gray-300 transition-colors text-left"
                              aria-label={`View details for ${enrollment.courseName || "Untitled Course"} course`}
                            >
                              {enrollment.courseName || "Untitled Course"}
                            </button>
                            {enrollment.isCompleted && (
                              <span className="text-xs bg-green-500/20 border border-green-500/50 text-green-400 px-2 py-0.5 rounded">
                                Completed
                              </span>
                            )}
                          </div>
                          <span className="text-gray-300 text-xs font-medium">
                            {enrollment.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${enrollment.progressPercentage}%` }}
                          />
                        </div>
                        {isExpanded && (
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <span>{enrollment.completedModules} of {enrollment.totalModules} modules</span>
                            <button 
                              type="button"
                              className="hover:text-white transition-colors flex items-center gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCourseExpansion(enrollment.enrollmentId);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleCourseExpansion(enrollment.enrollmentId);
                                }
                              }}
                              aria-label={expandedCourse === enrollment.enrollmentId 
                                ? `Hide modules for ${enrollment.courseName}` 
                                : `View modules for ${enrollment.courseName}`}
                            >
                              {expandedCourse === enrollment.enrollmentId ? "Hide" : "View"} modules
                              {expandedCourse === enrollment.enrollmentId ? (
                                <ChevronUp className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <ChevronDown className="w-3 h-3" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Expanded module list */}
                      {isExpanded && expandedCourse === enrollment.enrollmentId && courseProgress[enrollment.enrollmentId] && (
                        <div className="mt-3 space-y-2 ml-4">
                          {courseProgress[enrollment.enrollmentId].contentDetails
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((module) => (
                              <div 
                                key={module.courseContentId}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/courses/${enrollment.courseId}/content?enrollmentId=${enrollment.enrollmentId}&courseContentId=${module.courseContentId}`);
                                }}
                              >
                                <div className="flex-shrink-0">
                                  {module.isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                                {getContentTypeIcon(module.contentType)}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${module.isCompleted ? 'text-gray-400' : 'text-white'} truncate`}>
                                    {module.orderIndex}. {module.title}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {isExpanded && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/my-courses");
                    }}
                    className="text-white text-sm font-medium flex items-center gap-1 hover:text-gray-300 transition-colors mt-4"
                  >
                    View All in My Learning <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom Section - Recent Orders */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Recent Orders</h3>
            </div>
            <button 
              onClick={() => navigate("/my-orders")}
              className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
            >
              View All
            </button>
          </div>

          {loading.orders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-neutral-400 text-sm py-8 text-center">
              No orders yet.{" "}
              <button 
                onClick={() => navigate("/kits")}
                className="text-white hover:text-gray-300"
              >
                Start shopping!
              </button>
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div 
                  key={order.orderId}
                  onClick={() => navigate("/my-orders")}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {order.orderItems.length > 0 
                        ? (order.orderItems[0].kit?.name || "Order")
                        : "Order"}
                      {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-neutral-400 text-xs">
                        {formatOrderId(order.orderId, order.orderDate)}
                      </span>
                      <span className="text-neutral-400 text-xs">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(order.status)}`}>
                    {order.status || "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}