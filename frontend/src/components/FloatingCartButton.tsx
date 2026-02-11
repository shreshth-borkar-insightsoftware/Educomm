import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export default function FloatingCartButton() {
  const navigate = useNavigate();
  const { items } = useCartStore();
  
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

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
