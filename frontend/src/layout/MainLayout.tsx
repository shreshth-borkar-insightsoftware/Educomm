import Sidebar from "@/components/ui/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import Footer from "@/components/Footer";
import { Outlet, Link } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { LogIn, User } from "lucide-react";

export default function MainLayout() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
        {/* Search Bar + Welcome/Login */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-sm border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
            <div className="flex-1">
              <GlobalSearch />
            </div>
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 text-sm text-white shrink-0">
                <User size={16} className="text-neutral-400" />
                <span className="font-medium tracking-wide">
                  Welcome, <span className="font-bold">{user.firstName || user.email}</span>
                </span>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors shrink-0"
              >
                <LogIn size={16} />
                <span className="font-medium tracking-wide">Login</span>
              </Link>
            )}
          </div>
        </div>
        
        <Outlet />
        
        <Footer />
      </main>
    </div>
  );
}