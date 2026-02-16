import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import BackButton from "./BackButton";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  children?: ReactNode;
}

export default function PageHeader({ title, subtitle, showBackButton = false, children }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-6">
      {showBackButton && <BackButton />}
      <div className="flex-1">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">{title}</h1>
        {subtitle && (
          <p className="text-neutral-500 text-xs font-mono tracking-widest uppercase">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
