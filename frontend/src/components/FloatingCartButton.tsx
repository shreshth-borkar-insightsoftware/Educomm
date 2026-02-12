import { useNavigate } from "react-router-dom";
import { ShoppingBag, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export default function FloatingCartButton() {
  const navigate = useNavigate();
  const { items, error, fetchCart, resetError } = useCartStore();
  
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Handle retry when error icon is clicked
  const handleRetry = async () => {
    resetError();
    await fetchCart();
  };

  // Show error state
  if (error) {
    return (
      <button
        onClick={handleRetry}
        title={`Error: ${error}. Click to retry.`}
        className="fixed bottom-10 right-10 z-50 bg-white text-black px-8 py-5 rounded-full font-black italic flex items-center gap-4 shadow-2xl hover:scale-105 transition-transform"
      >
        <AlertCircle size={24} />
        <span className="tracking-tighter">RETRY</span>
      </button>
    );
  }

  if (cartCount === 0) return null;

  return (
    <button
      onClick={() => navigate("/cart")}
      className="fixed bottom-10 right-10 z-50 bg-white text-black px-8 py-5 rounded-full font-black italic flex items-center gap-4 shadow-2xl hover:scale-105 transition-transform"
    >
      <ShoppingBag size={24} />
      <span className="tracking-tighter">VIEW CART</span>
      <span className="bg-black text-white w-7 h-7 rounded-full text-xs flex items-center justify-center font-mono">
        {cartCount}
      </span>
    </button>
  );
}
