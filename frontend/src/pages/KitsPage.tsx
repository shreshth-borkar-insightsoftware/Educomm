import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeft, Loader2, ShoppingCart } from "lucide-react";

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

  useEffect(() => {
    const fetchKits = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/Kits");
        
        // Ensure data is an array before mapping to prevent crashes
        const rawData = Array.isArray(data) ? data : [];

        const formattedKits = rawData.map((k: any) => ({
          id: k.kitId || k.Id || k.id,
          name: k.name || k.Name || "Unnamed Kit",
          description: k.description || k.Description || "",
          price: k.price || k.Price || 0,
          imageUrl: k.imageUrl || k.ImageUrl || null, // Image URL mapping
        }));

        setKits(formattedKits);
      } catch (err) {
        console.error("API Error:", err);
        setKits([]); // Clear state on error to stop infinite loading
      } finally {
        setLoading(false); // Always stop loader
      }
    };
    fetchKits();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-neutral-800" 
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">KITS</h1>
            <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">Hardware Store</p>
          </div>
        </header>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-white" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {kits.map((kit) => (
              <Card
                key={kit.id}
                className="bg-neutral-950 border-neutral-800 rounded-3xl overflow-hidden flex flex-col border-t-4 border-t-neutral-700 shadow-2xl relative min-h-[450px]"
              >
                {/* CLICKABLE IMAGE AREA */}
                <div 
                  onClick={() => navigate(`/kits/${kit.id}`)}
                  className="w-full h-56 bg-neutral-900 flex items-center justify-center overflow-hidden border-b border-neutral-800 cursor-pointer group relative"
                >
                  {kit.imageUrl ? (
                    <img 
                      src={kit.imageUrl} 
                      alt={kit.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-neutral-600 group-hover:text-white transition-colors">
                      <Package size={56} />
                    </div>
                  )}

                  {/* CENTERED TEXT (No Box) */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <span className="text-white font-black italic text-xl tracking-[0.2em] uppercase drop-shadow-md">
                      VIEW KIT
                    </span>
                  </div>
                </div>

                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-2xl font-black uppercase text-white tracking-tight leading-none">
                    {kit.name}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                  <p className="text-sm text-neutral-400 line-clamp-2 mb-6">
                    {kit.description}
                  </p>

                  <div className="flex justify-between items-center pt-4 border-t border-neutral-900">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter">Price</span>
                      <p className="text-xl font-mono font-bold tracking-tighter text-white">₹{kit.price}</p>
                    </div>
                    
                    <button className="p-3 bg-neutral-900 rounded-full hover:bg-white hover:text-black transition-all duration-300 border border-neutral-800 shadow-lg">
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && kits.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800">
            <p className="uppercase tracking-widest text-sm text-neutral-500">No kits found in the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}