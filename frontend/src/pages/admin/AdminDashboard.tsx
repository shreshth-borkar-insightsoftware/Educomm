import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import api from "../../api/axiosInstance";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  GraduationCap 
} from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  count: number;
  isLoading: boolean;
  onClick: () => void;
}

const StatCard = ({ icon: Icon, label, count, isLoading, onClick }: StatCardProps) => {
  return (
    <Card 
      onClick={onClick}
      className="rounded-2xl border-2 border-black dark:border-white bg-white/50 backdrop-blur-sm hover:bg-black hover:text-white dark:bg-black/50 dark:hover:bg-white dark:hover:text-black transition-all group cursor-pointer"
    >
      <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
        <Icon size={48} className="group-hover:scale-110 transition-transform" />
        {isLoading ? (
          <div className="h-10 w-20 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded"></div>
        ) : (
          <h3 className="text-4xl font-black tracking-tighter">{count}</h3>
        )}
        <p className="text-sm uppercase tracking-widest opacity-60">{label}</p>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    kits: 0,
    categories: 0,
    orders: 0,
    enrollments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all counts in parallel
        const [
          usersRes,
          coursesRes,
          kitsRes,
          categoriesRes,
          ordersRes,
          enrollmentsRes,
        ] = await Promise.all([
          api.get("/users"),
          api.get("/courses"),
          api.get("/kits"),
          api.get("/categories"),
          api.get("/Orders/Admin/AllOrders"),
          api.get("/enrollments/Admin/AllEnrollments"),
        ]);

        setStats({
          users: usersRes.data.length || 0,
          courses: coursesRes.data.length || 0,
          kits: kitsRes.data.length || 0,
          categories: categoriesRes.data.length || 0,
          orders: ordersRes.data.length || 0,
          enrollments: enrollmentsRes.data.length || 0,
        });
      } catch (err: any) {
        console.error("Error fetching stats:", err);
        setError(err.response?.data?.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const user = useAuthStore((state) => state.user);

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading dashboard</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">
            Admin Dashboard
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Overview of platform statistics, {user?.firstName}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard
          icon={Users}
          label="Total Users"
          count={stats.users}
          isLoading={loading}
          onClick={() => navigate("/admin/users")}
        />
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          count={stats.courses}
          isLoading={loading}
          onClick={() => navigate("/admin/courses")}
        />
        <StatCard
          icon={Package}
          label="Total Kits"
          count={stats.kits}
          isLoading={loading}
          onClick={() => navigate("/admin/kits")}
        />
        <StatCard
          icon={FolderOpen}
          label="Total Categories"
          count={stats.categories}
          isLoading={loading}
          onClick={() => navigate("/admin/categories")}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          count={stats.orders}
          isLoading={loading}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          icon={GraduationCap}
          label="Total Enrollments"
          count={stats.enrollments}
          isLoading={loading}
          onClick={() => navigate("/admin/enrollments")}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
