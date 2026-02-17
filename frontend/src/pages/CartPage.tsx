import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCartStore } from "@/store/useCartStore";
import api from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { 
  Trash2, Plus, Minus, ShoppingBag, 
  Loader2, MapPin, CheckCircle2, AlertCircle 
} from "lucide-react";
import PaymentNotification from "@/components/PaymentNotification";
import PageHeader from "@/components/PageHeader";

const MIN_ADDRESS_LENGTH = 10;

// Helper function to format address with null checks
const formatAddress = (addr: any): string => {
  const addressParts = [
    addr.street,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country
  ].filter(part => part && part.trim() !== '');
  return addressParts.join(', ');
};

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotal, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressStr, setSelectedAddressStr] = useState<string>("");
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showFailedNotification, setShowFailedNotification] = useState(false);

  const handleDecreaseQuantity = async (itemId: number, currentQty: number) => {
    if (currentQty <= 1) {
      alert("Quantity cannot be less than 1. Use delete button to remove item.");
      return;
    }
    await updateQuantity(itemId, -1);
  };

  const handleIncreaseQuantity = async (itemId: number, currentQty: number, stock: number) => {
    if (currentQty >= stock) {
      alert(`Only ${stock} items available in stock.`);
      return;
    }
    await updateQuantity(itemId, 1);
  };

  useEffect(() => {
    fetchCart();
    const fetchAddresses = async () => {
      try {

        const { data } = await api.get("/Addresses/MyAddresses"); 
        
        const list = Array.isArray(data) ? data : (data?.items || []);
        
        setAddresses(list);
        
        if (list.length > 0) {

          const first = list[0];
          setSelectedAddressStr(formatAddress(first));
        } else {

          setShowManualInput(true);
        }
      } catch (err) {
        console.error("Failed to fetch addresses:", err);

        setShowManualInput(true);
      } finally {
        setIsLoadingAddresses(false);
      }
    };
    fetchAddresses();

    // Check if we came from failed payment
    if (searchParams.get("payment") === "failed") {
      setShowFailedNotification(true);
      // Remove the parameter from URL
      setSearchParams({});
    }

  }, [searchParams, setSearchParams]);

  const handleCheckout = async () => {
    if (!items.length) return;
    
    // Validate address before proceeding
    if (!selectedAddressStr || selectedAddressStr.trim().length === 0) {
      alert("Please enter a valid delivery address");
      return;
    }
    
    if (selectedAddressStr.trim().length < MIN_ADDRESS_LENGTH) {
      alert(`Please enter a complete delivery address (at least ${MIN_ADDRESS_LENGTH} characters)`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Save selected address to localStorage for later use after payment
      localStorage.setItem("selectedAddress", selectedAddressStr);
      
      console.log("[CART] Creating checkout session...");
      
      // Create Stripe checkout session with shipping address
      const response = await api.post("/payment/create-checkout-session", {
        shippingAddress: selectedAddressStr
      });

      console.log("[CART] Checkout session created:", response.data);

      if (response.data && response.data.sessionUrl) {
        // Redirect to Stripe checkout page
        window.location.href = response.data.sessionUrl;
      } else {
        throw new Error("No session URL received");
      }
    } catch (err: any) {
      console.error("[CART] Error creating checkout session:", err);
      alert(err.response?.data?.message || "Failed to create payment session. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
        <ShoppingBag size={64} className="text-neutral-800" />
        <h1 className="text-2xl font-black italic uppercase text-center leading-tight">
          Your Cart <br /> is Empty
        </h1>
        <Button onClick={() => navigate("/kits")} variant="outline" className="border-white text-white rounded-full px-8">
          BROWSE KITS
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      {/* Failed Payment Notification Modal */}
      {showFailedNotification && (
        <PaymentNotification 
          type="failed" 
          onClose={() => setShowFailedNotification(false)}
        />
      )}

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        <div className="lg:col-span-2">
          <PageHeader title="Checkout" showBackButton={true} />

          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-6 bg-gray-800 p-5 rounded-xl border border-gray-700">
                <div className="w-20 h-20 bg-gray-900 rounded-2xl overflow-hidden shrink-0">
                  {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />}
                </div>
                <div className="flex-1">
                  <h3 className="text-md font-black uppercase italic leading-tight">{item.name}</h3>
                  <p className="font-mono text-neutral-500 text-sm">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-4 bg-gray-900 border border-gray-700 rounded-xl p-1.5">
                  <button 
                    onClick={() => handleDecreaseQuantity(item.id, item.quantity)} 
                    disabled={isSubmitting || item.quantity <= 1}
                    className="disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-bold w-5 text-center text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => handleIncreaseQuantity(item.id, item.quantity, item.stock)} 
                    disabled={isSubmitting || item.quantity >= item.stock}
                    className="disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-neutral-700 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Shipping To</h3>
              
              <button 
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-[10px] uppercase text-neutral-400 hover:text-white font-black tracking-widest"
              >
                {showManualInput ? "Select Saved" : "Enter Manual"}
              </button>
            </div>

            {isLoadingAddresses ? (
              <Loader2 className="animate-spin text-neutral-700 mx-auto" />
            ) : showManualInput ? (
              <div className="space-y-3 animate-in fade-in">
                <p className="text-xs text-neutral-400">Enter full delivery address:</p>
                <textarea 
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-gray-600 min-h-[80px]"
                  placeholder="Street, City, Zip Code..."
                  value={selectedAddressStr}
                  onChange={(e) => setSelectedAddressStr(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.length === 0 && (
                  <div className="text-center py-4">
                    <AlertCircle className="mx-auto text-neutral-700 mb-2" size={24} />
                    <p className="text-xs text-neutral-500">No saved addresses found.</p>
                  </div>
                )}
                {addresses.map((addr) => {
                  const fullAddr = formatAddress(addr);
                  const isSelected = selectedAddressStr === fullAddr;
                  return (
                    <div key={addr.id || Math.random()} onClick={() => setSelectedAddressStr(fullAddr)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden ${
                        isSelected ? "border-white bg-white/5" : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin size={16} className={isSelected ? "text-white" : "text-neutral-700"} />
                        <div>
                          <p className="text-xs font-bold uppercase">{addr.street}</p>
                          <p className="text-[10px] text-neutral-500 uppercase">
                            {[addr.city, addr.state, addr.zipCode].filter(part => part && part.trim() !== '').join(', ')}
                          </p>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={14} className="absolute top-4 right-4 text-white" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white text-black rounded-3xl p-8 shadow-2xl">
            <p className="text-[10px] font-black uppercase opacity-50 tracking-widest">Total Amount</p>
            <p className="text-4xl font-black italic tracking-tighter">
               ₹{isNaN(getTotal()) ? 0 : getTotal()}
            </p>
            
            {/* Show message if no address */}
            {!selectedAddressStr || selectedAddressStr.trim().length === 0 ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs text-red-600 font-bold text-center">
                  Please add a shipping address before checkout
                </p>
                <Button 
                  size="lg"
                  onClick={() => navigate("/address")}
                  className="w-full bg-black text-white hover:bg-neutral-800 rounded-2xl font-black italic uppercase py-8 text-xl"
                >
                  ADD ADDRESS
                </Button>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={handleCheckout} 
                disabled={isSubmitting || items.length === 0}
                className="w-full mt-6 bg-black text-white hover:bg-neutral-800 rounded-2xl font-black italic uppercase py-8 text-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </span>
                ) : (
                  "PROCEED TO PAYMENT"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}