import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  Calendar, 
  MapPin, 
  CheckCircle2 
} from "lucide-react";
import PaymentNotification from "@/components/PaymentNotification";
import { usePagination } from "@/hooks/usePagination";
import { useState } from "react";

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const { items: orders, loading, hasMore, loadMore } = usePagination<any>("/Orders/MyOrders", 10);

  useEffect(() => {
    // Check if we came from successful payment
    if (searchParams.get("payment") === "success") {
      setShowSuccessNotification(true);
      // Remove the parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Success Notification Modal - Auto-dismiss after 3 seconds */}
      {showSuccessNotification && (
        <PaymentNotification 
          type="success" 
          onClose={() => setShowSuccessNotification(false)}
          autoCloseDelay={3000}
        />
      )}

      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")} 
            className="text-white hover:bg-neutral-800"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">ORDER HISTORY</h1>
            <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">
              Track your educational gear
            </p>
          </div>
        </header>

        {loading && orders.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-white w-10 h-10" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
            <Package size={48} className="mx-auto text-neutral-800 mb-4" />
            <p className="uppercase tracking-widest text-sm text-neutral-500">No orders found yet.</p>
            <Button 
              variant="link" 
              onClick={() => navigate("/kits")} 
              className="text-white mt-2 uppercase font-black italic"
            >
              Browse Kits →
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-10">
            {orders.map((order: any) => (
              <div key={order.orderId} className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
                
                <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white text-black rounded-xl shadow-lg">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Order ID</p>
                      <p className="font-mono font-bold text-sm">#{order.orderId.toString().toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Calendar size={18} className="text-neutral-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Placed On</p>
                      <p className="text-sm font-bold">
                        {new Date(order.orderDate).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-neutral-800/50 text-grey-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    {order.status || "Confirmed"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="p-6 space-y-6 md:col-span-2 border-b md:border-b-0 md:border-r border-neutral-800">
                    {order.orderItems.map((item: any) => (
                      <div key={item.orderItemId} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center border border-neutral-800 font-black text-white group-hover:border-white transition-colors">
                            {item.quantity}x
                          </div>
                          <div>
                            <p className="font-black uppercase italic tracking-tight text-lg leading-none mb-1">
                                {item.kit?.name}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">
                              Unit Price: ₹{item.priceAtPurchase}
                            </p>
                            {item.kit?.course && (
                              <div className="mt-2 flex items-center gap-2">
                                <p className="text-xs text-neutral-400">
                                  Course: <span className="font-semibold text-white">{item.kit.course.name}</span>
                                </p>
                                <button
                                  onClick={() => navigate(`/courses/${item.kit?.course?.courseId}`)}
                                  className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                  Go to Course →
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="font-mono font-bold text-lg">₹{item.quantity * item.priceAtPurchase}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-neutral-900/20 space-y-6">
                    <div>
                        <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-3">Delivery Address</p>
                        <div className="flex gap-3">
                            <MapPin size={18} className="text-white mt-1 shrink-0" />
                            <div className="text-sm space-y-1">
                                <p className="font-bold text-white uppercase">{order.userName || "Customer"}</p>
                                <p className="text-neutral-400 font-medium leading-relaxed">
                                    {order.shippingAddress || "Address details not provided."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-800">
                        <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">Payment Status</p>
                        <p className="text-xs font-bold text-green-400 uppercase tracking-tighter italic">Prepaid via System</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white text-black flex justify-between items-center">
                   <div>
                       <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Total Transaction</p>
                       <p className="text-sm font-medium opacity-70 italic font-mono">Inclusive of all Fanum taxes</p>
                   </div>
                   <div className="text-right">
                       <p className="text-3xl font-black italic tracking-tighter leading-none">₹{order.totalAmount}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12">
              <Button
                onClick={loadMore}
                disabled={loading}
                className="bg-white text-black hover:bg-neutral-200 font-black uppercase px-8 py-6 rounded-2xl border-2 border-white transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}