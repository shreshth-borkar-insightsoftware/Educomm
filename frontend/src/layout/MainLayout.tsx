import Sidebar from "@/components/ui/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors relative">

      <div className="fixed inset-0 z-20 pointer-events-none">
        <img
          src="https://i.pinimg.com/736x/cd/22/42/cd2242f862c520578e732311e929af06.jpg"
          alt="Hello Kitty Background"

          className="w-full h-full object-cover object-center opacity-10 dark:opacity-15 dark:invert mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      <div className="relative z-10 h-screen sticky top-0">
         <Sidebar />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
      
    </div>
  );
}