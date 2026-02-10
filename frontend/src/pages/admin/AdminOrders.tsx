import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Order {
  orderId: number;
  userId: number;
  orderDate: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
}

interface OrderItem {
  orderItemId: number;
  orderId: number;
  kitId: number;
  quantity: number;
  price: number;
  kitName?: string;
}

interface User {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface Kit {
  kitId: number;
  name: string;
}

interface OrderWithDetails extends Order {
  userName?: string;
  items?: OrderItem[];
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [loadingItems, setLoadingItems] = useState<number | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersRes, usersRes, kitsRes] = await Promise.all([
        api.get("/Orders/Admin/AllOrders"),
        api.get("/users"),
        api.get("/kits"),
      ]);
      
      const ordersData: Order[] = ordersRes.data;
      const usersData: User[] = usersRes.data;
      const kitsData: Kit[] = kitsRes.data;
      
      setUsers(usersData);
      setKits(kitsData);
      
      // Map orders with user details
      const ordersWithDetails = ordersData.map(order => {
        const user = usersData.find(u => u.userId === order.userId);
        return {
          ...order,
          userName: user 
            ? (user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user.email)
            : "Unknown User"
        };
      });
      
      setOrders(ordersWithDetails);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchOrderItems = async (orderId: number) => {
    try {
      setLoadingItems(orderId);
      const response = await api.get("/Orders/Admin/AllOrders");
      const allOrders = response.data;
      const orderData = allOrders.find((o: Order) => o.orderId === orderId);
      
      if (orderData && orderData.orderItems) {
        // Map kit names to order items
        const itemsWithNames = orderData.orderItems.map((item: OrderItem) => ({
          ...item,
          kitName: kits.find(k => k.kitId === item.kitId)?.name || "Unknown Kit"
        }));
        
        // Update the order with items
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === orderId 
              ? { ...order, items: itemsWithNames }
              : order
          )
        );
      }
    } catch (err: any) {
      console.error("Error fetching order items:", err);
      setMessage({ 
        type: "error", 
        text: "Failed to load order items" 
      });
    } finally {
      setLoadingItems(null);
    }
  };

  const toggleExpandOrder = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      const order = orders.find(o => o.orderId === orderId);
      if (!order?.items) {
        await fetchOrderItems(orderId);
      }
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await api.put(`/Orders/Admin/UpdateStatus/${orderId}`, JSON.stringify(newStatus), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setMessage({ type: "success", text: "Order status updated successfully!" });
      fetchData();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating order status:", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to update order status" 
      });
    } finally {
      setUpdatingStatus(null);
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

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400";
    }
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 h-full flex items-center justify-center">
        <p className="text-neutral-500 text-lg italic">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading orders</p>
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
            Order Management
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Manage customer orders and status
          </p>
        </div>
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
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Expand</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Order Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Shipping Address</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-500 italic">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <>
                    <tr
                      key={order.orderId}
                      className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpandOrder(order.orderId)}
                          className="text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                          {expandedOrderId === order.orderId ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono">#{order.orderId}</td>
                      <td className="px-6 py-4 font-semibold">{order.userName}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(order.orderDate)}</td>
                      <td className="px-6 py-4 font-semibold">{formatPrice(order.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm max-w-xs truncate" title={order.shippingAddress}>
                        {order.shippingAddress}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadgeColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.orderId, e.target.value)}
                          disabled={updatingStatus === order.orderId}
                          className="rounded-lg border-2 border-neutral-200 dark:border-neutral-800 p-2 text-sm bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    {/* Expanded Order Items Row */}
                    {expandedOrderId === order.orderId && (
                      <tr className="bg-neutral-50 dark:bg-neutral-950">
                        <td colSpan={8} className="px-6 py-4">
                          {loadingItems === order.orderId ? (
                            <div className="text-center py-4">
                              <p className="text-neutral-500 italic">Loading order items...</p>
                            </div>
                          ) : order.items && order.items.length > 0 ? (
                            <div className="ml-12">
                              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-neutral-700 dark:text-neutral-300">
                                Order Items
                              </h3>
                              <table className="w-full">
                                <thead className="bg-neutral-200 dark:bg-neutral-900">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-widest">Kit Name</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-widest">Quantity</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-widest">Price/Item</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-widest">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                  {order.items.map((item) => (
                                    <tr key={item.orderItemId}>
                                      <td className="px-4 py-3 text-sm">{item.kitName}</td>
                                      <td className="px-4 py-3 text-sm">{item.quantity}</td>
                                      <td className="px-4 py-3 text-sm">{formatPrice(item.price)}</td>
                                      <td className="px-4 py-3 text-sm font-semibold">
                                        {formatPrice(item.quantity * item.price)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-neutral-500 italic">No items found for this order</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
