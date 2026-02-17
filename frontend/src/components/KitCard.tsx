import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface KitCardProps {
  kit: {
    kitId: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
  };
  onAddToCart?: (kit: KitCardProps['kit']) => void;
}

export default function KitCard({ kit, onAddToCart }: KitCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/kits/${kit.kitId}`)}
      className="bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors cursor-pointer overflow-hidden"
    >
      <div className="aspect-video bg-gray-900 relative">
        {kit.imageUrl ? (
          <img
            src={kit.imageUrl}
            alt={kit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-400">
            No image
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">
          {kit.name}
        </h3>
        <p className="text-neutral-400 mb-4 line-clamp-2">
          {kit.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">
            ₹{kit.price.toLocaleString()}
          </span>
          {onAddToCart && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(kit);
              }}
              className="bg-white text-black hover:bg-neutral-200"
            >
              Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
