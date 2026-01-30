import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Package, BookOpen } from "lucide-react";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">
            Hello, {user?.firstName}
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            Select a category to begin.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Kits Card */}
        <div onClick={() => navigate("/kits")} className="group cursor-pointer">
          <Card className="rounded-2xl border-2 border-black dark:border-white bg-white/50 backdrop-blur-sm hover:bg-black hover:text-white dark:bg-black/50 dark:hover:bg-white dark:hover:text-black transition-all">
            <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
              <Package
                size={64}
                className="group-hover:scale-110 transition-transform"
              />
              <h2 className="text-3xl font-black tracking-tighter uppercase">
                Kits
              </h2>
              <p className="text-sm uppercase tracking-widest opacity-60">
                Physical Resources
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Courses Card */}
        <div onClick={() => navigate("/courses")} className="group cursor-pointer">
          <Card className="rounded-2xl border-2 border-black dark:border-white bg-white/50 backdrop-blur-sm hover:bg-black hover:text-white dark:bg-black/50 dark:hover:bg-white dark:hover:text-black transition-all">
            <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
              <BookOpen
                size={64}
                className="group-hover:scale-110 transition-transform"
              />
              <h2 className="text-3xl font-black tracking-tighter uppercase">
                Courses
              </h2>
              <p className="text-sm uppercase tracking-widest opacity-60">
                Digital Learning
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}