import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Kit {
  kitId: number;
  courseId: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
}

interface Course {
  courseId: number;
  name: string;
}

interface KitWithCourse extends Kit {
  courseName?: string;
}

const AdminKits = () => {
  const [kits, setKits] = useState<KitWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingKitId, setEditingKitId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    courseId: "",
    price: "",
    stockQuantity: "",
    imageUrl: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kitsRes, coursesRes] = await Promise.all([
        api.get("/kits"),
        api.get("/courses"),
      ]);
      
      const kitsData: Kit[] = kitsRes.data;
      const coursesData: Course[] = coursesRes.data;
      
      setCourses(coursesData);
      
      // Map kits with course names
      const kitsWithCourses = kitsData.map(kit => ({
        ...kit,
        courseName: coursesData.find(course => course.courseId === kit.courseId)?.name || "Unknown"
      }));
      
      setKits(kitsWithCourses);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load kits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      courseId: "",
      price: "",
      stockQuantity: "",
      imageUrl: "",
      isActive: true,
    });
    setEditMode(false);
    setEditingKitId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (kit: Kit) => {
    setFormData({
      name: kit.name,
      description: kit.description,
      courseId: kit.courseId.toString(),
      price: kit.price.toString(),
      stockQuantity: kit.stockQuantity.toString(),
      imageUrl: kit.imageUrl || "",
      isActive: kit.isActive,
    });
    setEditMode(true);
    setEditingKitId(kit.kitId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim() || !formData.courseId || 
        !formData.price || !formData.stockQuantity) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        courseId: parseInt(formData.courseId),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        imageUrl: formData.imageUrl || "",
        isActive: formData.isActive,
      };

      if (editMode && editingKitId) {
        await api.put(`/kits/${editingKitId}`, payload);
        setMessage({ type: "success", text: "Kit updated successfully!" });
      } else {
        await api.post("/kits", payload);
        setMessage({ type: "success", text: "Kit added successfully!" });
      }
      
      handleCloseModal();
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error saving kit:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || `Failed to ${editMode ? 'update' : 'add'} kit` 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKit = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the kit "${name}"?`
    );
    
    if (!confirmed) return;

    try {
      await api.delete(`/kits/${id}`);
      setMessage({ type: "success", text: "Kit deleted successfully!" });
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting kit:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to delete kit" 
      });
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-red-600 dark:text-red-400 font-bold";
    if (stock < 5) return "text-orange-600 dark:text-orange-400 font-semibold";
    return "text-green-600 dark:text-green-400";
  };

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 h-full flex items-center justify-center">
        <p className="text-neutral-500 text-lg italic">Loading kits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading kits</p>
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
            Kit Management
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Manage product kits and inventory
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Kit
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
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Course</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {kits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 italic">
                    No kits found. Add your first kit!
                  </td>
                </tr>
              ) : (
                kits.map((kit) => (
                  <tr
                    key={kit.kitId}
                    className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono">{kit.kitId}</td>
                    <td className="px-6 py-4 font-semibold">{kit.name}</td>
                    <td className="px-6 py-4 text-sm">{kit.courseName}</td>
                    <td className="px-6 py-4 font-semibold">{formatPrice(kit.price)}</td>
                    <td className={`px-6 py-4 text-sm ${getStockColor(kit.stockQuantity)}`}>
                      {kit.stockQuantity}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          kit.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {kit.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleOpenEditModal(kit)}
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        >
                          <Pencil size={18} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteKit(kit.kitId, kit.name)}
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Kit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-2xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">
              {editMode ? "Edit Kit" : "Add New Kit"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="e.g., Python Starter Kit"
                    required
                  />
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

              <div>
                <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest">
                  Description *
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-2 w-full rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-3 min-h-[100px] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  placeholder="Brief description of this kit"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="price" className="text-sm font-bold uppercase tracking-widest">
                    Price (₹) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white"
                    placeholder="499.99"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="stockQuantity" className="text-sm font-bold uppercase tracking-widest">
                    Stock Quantity *
                  </Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="mt-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white"
                    placeholder="100"
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
                <Label htmlFor="imageUrl" className="text-sm font-bold uppercase tracking-widest">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="mt-2 rounded-lg border-2 border-neutral-200 dark:border-neutral-800 focus-visible:ring-black dark:focus-visible:ring-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleCloseModal}
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
                  {submitting ? (editMode ? "Updating..." : "Adding...") : (editMode ? "Update Kit" : "Add Kit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKits;
