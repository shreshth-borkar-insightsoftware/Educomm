import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Package, FolderTree, ShoppingCart, Users, LogOut, ArrowLeft, GraduationCap } from "lucide-react";

const AdminLayout = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Courses", path: "/admin/courses", icon: BookOpen },
    { name: "Kits", path: "/admin/kits", icon: Package },
    { name: "Categories", path: "/admin/categories", icon: FolderTree },
    { name: "Enrollments", path: "/admin/enrollments", icon: GraduationCap },
    { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { name: "Users", path: "/admin/users", icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors relative">
      {/* Background Image */}
      <div className="fixed inset-0 z-100 pointer-events-none">
        <img
          src="https://i.pinimg.com/736x/cd/22/42/cd2242f862c520578e732311e929af06.jpg"
          alt="Hello Kitty Background"
          className="w-full h-full object-cover object-center opacity-10 dark:opacity-15 dark:invert mix-blend-multiply dark:mix-blend-screen"
        />
      </div>

      {/* Sidebar */}
      <div className="relative z-10 h-screen sticky top-0">
        <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 hidden md:flex flex-col p-6 h-screen bg-white dark:bg-black">
          <div className="mb-10">
            <h2 className="text-xl font-bold tracking-tighter">ADMIN PANEL</h2>
            <p className="text-xs text-neutral-500 mt-1">Educomm Management</p>
          </div>
          
          <nav className="flex-1 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 text-sm uppercase tracking-widest transition-colors w-full ${
                  isActive(item.path) 
                    ? "font-bold text-black dark:text-white" 
                    : "text-neutral-500 hover:text-black dark:hover:text-white"
                }`}
              >
                <item.icon size={18} /> {item.name}
              </button>
            ))}
          </nav>

          <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 text-sm uppercase tracking-widest transition-colors w-full text-neutral-500 hover:text-black dark:hover:text-white"
            >
              <ArrowLeft size={18} /> Back to Site
            </button>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="justify-start p-0 text-neutral-500 hover:text-red-500 dark:hover:text-red-400 w-full transition-colors"
            >
              <LogOut size={18} className="mr-2" /> LOGOUT
            </Button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
