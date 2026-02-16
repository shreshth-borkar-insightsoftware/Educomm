import Sidebar from "@/components/ui/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import Footer from "@/components/Footer";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors relative">

      <div className="fixed inset-0 z-[100] pointer-events-none">
        <img
          src=" "
          alt="Hello Kitty Background"

          className="w-full h-full object-cover object-center opacity-10 dark:opacity-15 dark:invert mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      <div className="relative z-10 h-screen sticky top-0">
         <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Search Bar */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <GlobalSearch />
          </div>
        </div>
        
        <Outlet />
        
        <Footer />
      </main>
    </div>
  );
}