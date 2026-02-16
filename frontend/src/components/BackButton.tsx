import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick?: () => void;
  to?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function BackButton({ onClick, to, className = "", children }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className={`text-gray-300 hover:text-white hover:bg-neutral-800 p-2 rounded-full transition-all flex items-center gap-2 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-6 h-6" />
      {children}
    </button>
  );
}
