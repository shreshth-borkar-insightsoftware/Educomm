import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { useCartStore } from "@/store/useCartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Loader2, ShoppingCart, ShoppingBag } from "lucide-react";

interface Kit {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { items, addToCart, fetchCart } = useCartStore();

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchCart();

    const fetchKits = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/Kits");
        const rawData = Array.isArray(data) ? data : [];
        const formattedKits = rawData.map((k: any) => ({
          id: k.kitId || k.Id || k.id,
          name: k.name || k.Name || "Unnamed Kit",
          description: k.description || k.Description || "",
          price: k.price || k.Price || 0,
          imageUrl: k.imageUrl || k.ImageUrl || null,
        }));
        setKits(formattedKits);
      } catch (err) {
        console.error("API Error:", err);
        setKits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchKits();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8 relative">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <Button variant="ghost" size="icon" className="text-white hover:bg-neutral-800" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">KITS</h1>
            <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">Hardware Store</p>
          </div>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-white" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kits.map((kit) => (
              <Card key={kit.id} className="bg-neutral-950 border-neutral-800 rounded-3xl overflow-hidden flex flex-col border-t-4 border-t-neutral-700 shadow-2xl relative min-h-[450px]">
                <div onClick={() => navigate(`/kits/${kit.id}`)} className="w-full h-56 bg-neutral-900 flex items-center justify-center overflow-hidden border-b border-neutral-800 cursor-pointer group relative">
                  {kit.imageUrl ? (
                    <img src={kit.imageUrl} alt={kit.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center text-neutral-600"><Package size={56} /></div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="text-white font-black italic text-xl tracking-[0.2em] uppercase">VIEW KIT</span>
                  </div>
                </div>

                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-2xl font-black uppercase text-white tracking-tight">{kit.name}</CardTitle>
                </CardHeader>

                <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                  <p className="text-sm text-neutral-400 line-clamp-2 mb-6">{kit.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-neutral-900">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase">Price</span>
                      <p className="text-xl font-mono font-bold">₹{kit.price}</p>
                    </div>
                    {/* Add To Cart Button */}
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addToCart(kit); 
                      }}
                      className="p-3 bg-neutral-900 rounded-full hover:bg-white hover:text-black transition-all border border-neutral-800"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {cartCount > 0 && (
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
        )}
      </div>
    </div>
  );
}