import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Package, 
  Monitor, 
  Star, 
  Zap, 
  Clock, 
  ArrowRight
} from "lucide-react";
import api from "@/api/axiosInstance";

interface Kit {
  kitId: number;
  name: string;
  price: number;
  imageUrl?: string;
}

interface Enrollment {
  enrollmentId: number;
  course?: {
    courseId: number;
    name: string;
  };
  progressPercentage: number;
  isCompleted: boolean;
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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState({
    kits: true,
    enrollments: true,
    orders: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all data in parallel
      const [kitsResult, enrollmentsResult, ordersResult] = await Promise.allSettled([
        api.get("/kits", { params: { page: 1, pageSize: 3 } }),
        api.get("/enrollments/MyEnrollments", { params: { page: 1, pageSize: 10 } }),
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
        // Filter for incomplete enrollments and take top 3
        const incompleteEnrollments = allEnrollments.filter((e: Enrollment) => !e.isCompleted).slice(0, 3);
        setEnrollments(incompleteEnrollments);
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Continue Learning</h3>
              </div>
              <button 
                onClick={() => navigate("/courses")}
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
              >
                All Courses
              </button>
            </div>

            {loading.enrollments ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : enrollments.length === 0 ? (
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
                <div className="space-y-4 mb-4">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.enrollmentId}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium text-sm">
                          {enrollment.course?.name || "Untitled Course"}
                        </p>
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
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate("/courses")}
                  className="text-white text-sm font-medium flex items-center gap-1 hover:text-gray-300 transition-colors"
                >
                  View All Courses <ArrowRight className="w-4 h-4" />
                </button>
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