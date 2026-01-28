import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Kit {
  id: number;
  name: string;
  description: string;
  price?: number;
  stock?: number;
}

export default function KitDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKitDetails = async () => {
      try {
        const { data } = await api.get(`/Kits/${id}`);
        
        setKit({
          id: data.id || data.kitId || data.Id,
          name: data.name || data.Name,
          description: data.description || data.Description,
          price: data.price || data.Price,
          stock: data.stock || data.Stock
        });
      } catch (err) {
        console.error("Error fetching kit details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKitDetails();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-black text-white p-8">Loading...</div>;
  if (!kit) return <div className="min-h-screen bg-black text-white p-8">Kit not found.</div>;

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => navigate(-1)} className="hover:bg-neutral-800 p-2 rounded-full">
          <MoveLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-bold tracking-tighter uppercase">Kit Details</h1>
      </div>

      <Card className="max-w-3xl bg-neutral-950 border-neutral-800 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-neutral-900 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono text-neutral-500 mb-2 uppercase">Product ID: {kit.id}</p>
              <CardTitle className="text-3xl font-bold uppercase tracking-tight text-white">{kit.name}</CardTitle>
            </div>
            {kit.price && (
              <div className="text-2xl font-bold text-white bg-neutral-900 px-4 py-2 rounded-xl">
                ₹{kit.price}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-widest">Description</h3>
            <p className="text-neutral-300 leading-relaxed text-lg">{kit.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
             <div className="bg-neutral-900 p-4 rounded-xl">
               <p className="text-xs text-neutral-500 uppercase mb-1">Stock Availability</p>
               <p className="text-xl font-bold">{kit.stock ?? 'N/A'}</p>
             </div>
          </div>

          <Button className="w-full bg-white text-black hover:bg-neutral-200 h-12 text-md font-bold rounded-xl mt-4">
            ADD TO INVENTORY
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}