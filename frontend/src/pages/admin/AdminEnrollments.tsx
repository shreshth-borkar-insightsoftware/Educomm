import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TablePagination from "@/components/ui/TablePagination";

interface Enrollment {
  enrollmentId: number;
  userId: number;
  courseId: number;
  enrollmentDate: string;
  status: string;
  progress: number;
}

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Course {
  courseId: number;
  name: string;
}

interface EnrollmentWithDetails extends Enrollment {
  userName?: string;
  courseName?: string;
}

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    courseId: "",
    status: "Active",
    progress: "0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const [enrollmentsRes, usersRes, coursesRes] = await Promise.all([
        api.get("/enrollments/Admin/AllEnrollments", { params: { page, pageSize } }),
        api.get("/users", { params: { page: 1, pageSize: 100 } }),
        api.get("/courses", { params: { page: 1, pageSize: 100 } }),
      ]);
      
      const enrollmentsData: Enrollment[] = enrollmentsRes.data.items;
      const usersData: User[] = usersRes.data.items || usersRes.data;
      const coursesData: Course[] = coursesRes.data.items || coursesRes.data;
      
      setUsers(usersData);
      setCourses(coursesData);
      setTotalPages(enrollmentsRes.data.totalPages);
      setTotalCount(enrollmentsRes.data.totalCount);
      
      // Map enrollments with user and course details
      const enrollmentsWithDetails = enrollmentsData.map(enrollment => {
        const user = usersData.find(u => u.userId === enrollment.userId);
        const course = coursesData.find(c => c.courseId === enrollment.courseId);
        
        return {
          ...enrollment,
          userName: user 
            ? (user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email)
            : "Unknown User",
          courseName: course?.name || "Unknown Course"
        };
      });
      
      setEnrollments(enrollmentsWithDetails);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handleAddEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.courseId) {
      setMessage({ type: "error", text: "User and Course are required" });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/enrollments", {
        userId: parseInt(formData.userId),
        courseId: parseInt(formData.courseId),
        status: formData.status,
        progress: parseInt(formData.progress),
      });
      
      setMessage({ type: "success", text: "Enrollment added successfully!" });
      setFormData({
        userId: "",
        courseId: "",
        status: "Active",
        progress: "0",
      });
      setShowAddModal(false);
      fetchData(currentPage);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error adding enrollment:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to add enrollment" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEnrollment = async (id: number, userName: string, courseName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the enrollment for "${userName}" in "${courseName}"?`
    );
    
    if (!confirmed) return;

    try {
      await api.delete(`/enrollments/${id}`);
      setMessage({ type: "success", text: "Enrollment deleted successfully!" });
      fetchData(currentPage);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting enrollment:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to delete enrollment" 
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500 dark:bg-red-600";
    if (progress < 70) return "bg-orange-500 dark:bg-orange-600";
    return "bg-green-500 dark:bg-green-600";
  };

  const getProgressTextColor = (progress: number) => {
    if (progress < 30) return "text-red-600 dark:text-red-400";
    if (progress < 70) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  const getStatusBadgeColor = (status: string) => {
    if (!status) return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400";
    
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "dropped":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400";
    }
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 h-full flex items-center justify-center">
        <p className="text-neutral-500 text-lg italic">Loading enrollments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading enrollments</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">
            Enrollment Management
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Manage student course enrollments
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Enrollment
        </Button>
      </header>

      {/* Success/Error Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-2xl border-2 ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200"
              : "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-2 border-black dark:border-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black text-white dark:bg-white dark:text-black">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Course</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Enrolled</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {enrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
                    No enrollments found. Add your first enrollment!
                  </td>
                </tr>
              ) : (
                enrollments.map((enrollment) => (
                  <tr
                    key={enrollment.enrollmentId}
                    className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono">{enrollment.enrollmentId}</td>
                    <td className="px-6 py-4 font-semibold">{enrollment.userName}</td>
                    <td className="px-6 py-4 text-sm">{enrollment.courseName}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(enrollment.enrollmentDate)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleDeleteEnrollment(enrollment.enrollmentId, enrollment.userName || "", enrollment.courseName || "")}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={(page) => {
              setCurrentPage(page);
              fetchData(page);
            }}
          />
        </div>
      </div>

      {/* Add Enrollment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-2xl p-8 max-w-2xl w-full relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setFormData({
                  userId: "",
                  courseId: "",
                  status: "Active",
                  progress: "0",
                });
                setMessage(null);
              }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">
              Add New Enrollment
            </h2>

            <form onSubmit={handleAddEnrollment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="userId" className="text-sm font-bold uppercase tracking-widest">
                    User *
                  </Label>
                  <select
                    id="userId"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="mt-2 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-2 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName} (${user.email})`
                          : user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="courseId" className="text-sm font-bold uppercase tracking-widest">
                    Course *
                  </Label>
                  <select
                    id="courseId"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    className="mt-2 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-2 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.courseId} value={course.courseId}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      userId: "",
                      courseId: "",
                      status: "Active",
                      progress: "0",
                    });
                    setMessage(null);
                  }}
                  variant="outline"
                  className="flex-1 rounded-lg border-2 border-black dark:border-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg"
                >
                  {submitting ? "Adding..." : "Add Enrollment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
