import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TablePagination from "@/components/ui/TablePagination";

interface Category {
  categoryId: number;
  name: string;
  description: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCategories = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/categories", { params: { page, pageSize } });
      setCategories(response.data.items);
      setTotalPages(response.data.totalPages);
      setTotalCount(response.data.totalCount);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(1);
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setMessage({ type: "error", text: "Both name and description are required" });
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/categories", formData);
      setMessage({ type: "success", text: "Category added successfully!" });
      setFormData({ name: "", description: "" });
      setShowAddModal(false);
      fetchCategories(currentPage);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error adding category:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to add category" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the category "${name}"?`
    );
    
    if (!confirmed) return;

    try {
      await api.delete(`/categories/${id}`);
      setMessage({ type: "success", text: "Category deleted successfully!" });
      fetchCategories(currentPage);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error deleting category:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to delete category" 
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 h-full flex items-center justify-center">
        <p className="text-neutral-500 text-lg italic">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading categories</p>
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
            Category Management
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Manage course categories
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> Add Category
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
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">
                  Description
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 italic">
                    No categories found. Add your first category!
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.categoryId}
                    className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono">{category.categoryId}</td>
                    <td className="px-6 py-4 font-semibold">{category.name}</td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">
                      {category.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={() => handleDeleteCategory(category.categoryId, category.name)}
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
            fetchCategories(page);
          }}
        />
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setFormData({ name: "", description: "" });
                setMessage(null);
              }}
              className="absolute top-4 right-4 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold tracking-tighter uppercase mb-6">
              Add New Category
            </h2>

            <form onSubmit={handleAddCategory} className="space-y-6">
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
                  placeholder="e.g., Programming"
                  required
                />
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
                  placeholder="Brief description of this category"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: "", description: "" });
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
                  {submitting ? "Adding..." : "Add Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
