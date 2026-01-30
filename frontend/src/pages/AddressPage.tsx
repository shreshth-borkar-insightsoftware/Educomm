import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axiosInstance";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Trash2, Loader2, Home, ArrowLeft, Phone } from "lucide-react";

export default function AddressPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newAddress, setNewAddress] = useState({ 
    title: "Home",      
    street: "", 
    city: "", 
    state: "Default",
    zipCode: "", 
    country: "India",
    phoneNumber: "" 
  });

  const navigate = useNavigate();

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/Addresses/MyAddresses"); 
      setAddresses(data);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      await api.post("/Addresses", newAddress);
      setNewAddress({ 
        title: "Home", 
        street: "", 
        city: "", 
        state: "Default", 
        zipCode: "", 
        country: "India", 
        phoneNumber: "" 
      });
      setShowForm(false);
      fetchAddresses(); 
    } catch (err) {
      console.error("Error adding address:", err);
      alert("Failed to save address. Check backend console.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <Loader2 className="animate-spin text-white w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
                <ArrowLeft size={24} />
             </Button>
             <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">MY ADDRESSES</h1>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-white text-black font-bold uppercase italic rounded-full px-6"
          >
            {showForm ? "Cancel" : <><Plus size={18} className="mr-2"/> Add New</>}
          </Button>
        </header>

        {showForm && (
          <form onSubmit={handleAdd} className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 mb-12 space-y-4 shadow-2xl">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Street Address</label>
              <input 
                placeholder="House No, Street Name..." 
                className="w-full bg-black p-4 rounded-xl border border-neutral-800 focus:border-white outline-none transition-all" 
                value={newAddress.street}
                onChange={e => setNewAddress({...newAddress, street: e.target.value})} 
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">City</label>
                 <input placeholder="City" className="w-full bg-black p-4 rounded-xl border border-neutral-800 focus:border-white outline-none" 
                  value={newAddress.city}
                  onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Zip Code</label>
                 <input placeholder="Zip Code" className="w-full bg-black p-4 rounded-xl border border-neutral-800 focus:border-white outline-none" 
                  value={newAddress.zipCode}
                  onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})} required />
               </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-neutral-500 ml-1">Phone Number</label>
              <input placeholder="Mobile Number" className="w-full bg-black p-4 rounded-xl border border-neutral-800 focus:border-white outline-none" 
                value={newAddress.phoneNumber}
                onChange={e => setNewAddress({...newAddress, phoneNumber: e.target.value})} required />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full bg-white text-black font-black uppercase italic py-7 rounded-2xl text-lg">
              {isSaving ? <Loader2 className="animate-spin" /> : "SAVE SHIPPING ADDRESS"}
            </Button>
          </form>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-neutral-800 rounded-3xl">
            <MapPin size={48} className="mx-auto text-neutral-800 mb-4" />
            <p className="uppercase tracking-widest text-sm text-neutral-500 font-bold">No addresses found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {addresses.map((addr) => (
              <div key={addr.addressId} className="flex justify-between items-center p-8 bg-neutral-950 border border-neutral-800 rounded-3xl hover:border-neutral-600 transition-all group">
                <div className="flex gap-6 items-center">
                  <div className="p-4 bg-neutral-900 rounded-2xl group-hover:bg-white group-hover:text-black transition-colors">
                    <Home size={24} />
                  </div>
                  <div>
                    {/* title added here to help distinguish multiple addresses */}
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">{addr.title}</p>
                    <p className="font-black uppercase italic text-xl tracking-tight">{addr.street}</p>
                    <p className="text-sm text-neutral-500 font-mono">{addr.city}, {addr.zipCode}</p>
                    <p className="text-xs text-neutral-600 mt-1 uppercase font-bold tracking-widest">{addr.phoneNumber}</p>
                  </div>
                </div>
                <button className="text-neutral-800 hover:text-red-500 transition-colors p-2">
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}