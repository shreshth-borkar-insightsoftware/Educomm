import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TablePagination from "@/components/ui/TablePagination";

interface Course {
  courseId: number;
  categoryId: number;
  name: string;
  description: string;
  difficulty: string;
  durationMinutes: number;
  thumbnailUrl: string;
  isActive: boolean;
}

interface Category {
  categoryId: number;
  name: string;
}

interface CourseWithCategory extends Course {
  categoryName?: string;
}

const AdminCourses = () => {
  const [courses, setCourses] = useState<CourseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15; // Small size for testing
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    difficulty: "Beginner",
    durationMinutes: "",
    thumbnailUrl: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const [coursesRes, categoriesRes] = await Promise.all([
        api.get("/courses", { params: { page, pageSize } }),
        api.get("/categories", { params: { page: 1, pageSize: 100 } }), // Get all categories
      ]);
      
      const coursesData: Course[] = coursesRes.data.items;
      const categoriesData: Category[] = categoriesRes.data.items;
      
      setTotalPages(coursesRes.data.totalPages);
      setTotalCount(coursesRes.data.totalCount);
      setCategories(categoriesData);
      
      // Map courses with category names
      const coursesWithCategories = coursesData.map(course => ({
        ...course,
        categoryName: categoriesData.find(cat => cat.categoryId === course.categoryId)?.name || "Unknown"
      }));
      
      setCourses(coursesWithCategories);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.categoryId || !formData.durationMinutes) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/courses", {
        name: formData.name,
        description: formData.description,
        categoryId: parseInt(formData.categoryId),
        difficulty: formData.difficulty,
        durationMinutes: parseInt(formData.durationMinutes),
        thumbnailUrl: formData.thumbnailUrl || "",
        isActive: formData.isActive,
      });
      
      setMessage({ type: "success", text: "Course added successfully!" });
      setFormData({
        name: "",
        description: "",
        categoryId: "",
        difficulty: "Beginner",
        durationMinutes: "",
        thumbnailUrl: "",
        isActive: true,
      });
      setShowAddModal(false);
      fetchData(currentPage);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error adding course:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to add course" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the course "${name}"? This will also affect associated kits and content.`
    );
    
    if (!confirmed) return;

    try {
      await api.delete(`/courses/${id}`);
      setMessage({ type: "success", text: "Course deleted successfully!" });
      fetchData(currentPage);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting course:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to delete course" 
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 h-full flex items-center justify-center">
        <p className="text-neutral-500 text-lg italic">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading courses</p>
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
            Course Management
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Manage educational courses
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Course
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
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Difficulty</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 italic">
                    No courses found. Add your first course!
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr
                    key={course.courseId}
                    className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono">{course.courseId}</td>
                    <td className="px-6 py-4 font-semibold">{course.name}</td>
                    <td className="px-6 py-4 text-sm">{course.categoryName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                        {course.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{course.durationMinutes} min</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          course.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {course.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleDeleteCourse(course.courseId, course.name)}
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
        </div>

        {/* Pagination */}
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

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-2xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddModal(false);
                setFormData({
                  name: "",
                  description: "",
                  categoryId: "",
                  difficulty: "Beginner",
                  durationMinutes: "",
                  thumbnailUrl: "",
                  isActive: true,
                });
                setMessage(null);
              }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">
              Add New Course
            </h2>

            <form onSubmit={handleAddCourse} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white"
                    placeholder="e.g., Introduction to Python"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId" className="text-sm font-bold uppercase tracking-widest">
                    Category *
                  </Label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-2 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-2 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest">
                  Description *
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-3 min-h-[100px] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="Brief description of this course"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="difficulty" className="text-sm font-bold uppercase tracking-widest">
                    Difficulty *
                  </Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="mt-2 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-2 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="durationMinutes" className="text-sm font-bold uppercase tracking-widest">
                    Duration (min) *
                  </Label>
                  <Input
                    id="durationMinutes"
                    type="number"
                    min="1"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="mt-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white"
                    placeholder="60"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-700"
                    />
                    <span className="text-sm font-bold uppercase tracking-widest">Active</span>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="thumbnailUrl" className="text-sm font-bold uppercase tracking-widest">
                  Thumbnail URL
                </Label>
                <Input
                  id="thumbnailUrl"
                  type="text"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="mt-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      name: "",
                      description: "",
                      categoryId: "",
                      difficulty: "Beginner",
                      durationMinutes: "",
                      thumbnailUrl: "",
                      isActive: true,
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
                  {submitting ? "Adding..." : "Add Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
