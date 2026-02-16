import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(-1)} 
      className="hover:bg-neutral-800 p-2 rounded-full transition-all"
      aria-label="Go back"
    >
      <ArrowLeft className="w-6 h-6 text-gray-300 hover:text-white transition-colors" />
    </button>
  );
}
