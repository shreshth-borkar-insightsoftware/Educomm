import { useEffect, useState } from "react";
import api from "@/api/axiosInstance";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from "recharts";
import {
  DollarSign, ShoppingCart, Users, Package, BookOpen, TrendingUp,
  AlertTriangle, Loader2
} from "lucide-react";

interface Stats {
  counts: {
    totalUsers: number;
    totalCourses: number;
    totalKits: number;
    totalCategories: number;
    totalOrders: number;
    totalEnrollments: number;
  };
  totalRevenue: number;
  ordersByStatus: { status: string; count: number }[];
  monthlySales: { year: number; month: number; revenue: number; orderCount: number }[];
  salesByCategory: { category: string; totalQuantity: number; totalRevenue: number }[];
  topKits: { kitId: number; name: string; totalSold: number; totalRevenue: number }[];
  topCourses: { courseId: number; name: string; totalEnrollments: number; completionRate: number }[];
  lowStockKits: { kitId: number; name: string; stockQuantity: number; price: number }[];
  recentOrders: { orderId: number; orderDate: string; totalAmount: number; status: string; itemCount: number }[];
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#ec4899", "#6366f1", "#14b8a6"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-red-400">
        <p>{error || "No data available."}</p>
      </div>
    );
  }

  const monthlySalesData = stats.monthlySales.map((m) => ({
    name: `${MONTHS[m.month - 1]} ${m.year}`,
    revenue: m.revenue,
    orders: m.orderCount,
  }));

  const categoryPieData = stats.salesByCategory.map((c) => ({
    name: c.category,
    value: c.totalRevenue,
    quantity: c.totalQuantity,
  }));

  const orderStatusData = stats.ordersByStatus.map((s) => ({
    name: s.status,
    value: s.count,
  }));

  const topKitsData = stats.topKits.map((k) => ({
    name: k.name.length > 20 ? k.name.slice(0, 20) + "…" : k.name,
    sold: k.totalSold,
    revenue: k.totalRevenue,
  }));

  const statCards = [
    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-green-400" },
    { label: "Total Orders", value: stats.counts.totalOrders, icon: ShoppingCart, color: "text-purple-400" },
    { label: "Total Users", value: stats.counts.totalUsers, icon: Users, color: "text-cyan-400" },
    { label: "Total Kits", value: stats.counts.totalKits, icon: Package, color: "text-amber-400" },
    { label: "Total Courses", value: stats.counts.totalCourses, icon: BookOpen, color: "text-pink-400" },
    { label: "Enrollments", value: stats.counts.totalEnrollments, icon: TrendingUp, color: "text-indigo-400" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase">Analytics & Stats</h1>
        <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase mt-1">
          Sales performance & insights
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                {card.label}
              </span>
              <card.icon size={16} className={card.color} />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Sales Line Chart + Category Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Line Chart */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Monthly Revenue
          </h3>
          {monthlySalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={{ stroke: "#404040" }}
                />
                <YAxis
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={{ stroke: "#404040" }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#8b5cf6" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-16">No sales data yet.</p>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Revenue by Category
          </h3>
          {categoryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-16">No category data.</p>
          )}
        </div>
      </div>

      {/* Charts Row 2: Top Kits Bar + Order Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Kits */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Top Selling Kits
          </h3>
          {topKitsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topKitsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis
                  type="number"
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={{ stroke: "#404040" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fill: "#a3a3a3", fontSize: 11 }}
                  axisLine={{ stroke: "#404040" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="sold" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-16">No kit sales yet.</p>
          )}
        </div>

        {/* Order Status Pie */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Order Status
          </h3>
          {orderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {orderStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#171717",
                    border: "1px solid #262626",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: 12,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-16">No orders yet.</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Top Courses + Low Stock + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Courses */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Top Enrolled Courses
          </h3>
          {stats.topCourses.length > 0 ? (
            <div className="space-y-3">
              {stats.topCourses.map((course, i) => (
                <div key={course.courseId} className="flex items-center gap-3">
                  <span className="text-xs font-black text-neutral-500 w-5">{i + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{course.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-neutral-400">
                        {course.totalEnrollments} enrolled
                      </span>
                      <span className="text-[10px] text-neutral-600">•</span>
                      <span className="text-[10px] text-green-400">
                        {course.completionRate.toFixed(0)}% completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-8">No enrollments yet.</p>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Low Stock Alert
            </h3>
          </div>
          {stats.lowStockKits.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockKits.map((kit) => (
                <div
                  key={kit.kitId}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{kit.name}</p>
                    <p className="text-[10px] text-neutral-400">₹{kit.price}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      kit.stockQuantity === 0
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {kit.stockQuantity === 0 ? "Out of Stock" : `${kit.stockQuantity} left`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-400 text-sm text-center py-8">All kits are well stocked!</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-4">
            Recent Orders
          </h3>
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      Order #{order.orderId}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(order.orderDate).toLocaleDateString()} • {order.itemCount} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      ₹{order.totalAmount.toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        order.status === "Confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : order.status === "Pending"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-neutral-700 text-neutral-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-8">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
