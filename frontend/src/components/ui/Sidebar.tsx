import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen,  
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Package,
  BookLock,
  MapPin,
  Shield
} from "lucide-react";

export default function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "My Courses", path: "/my-courses", icon: BookOpen },
    { name: "My Orders", path: "/my-orders", icon: ShoppingBag },
    { name: "Cart", path: "/cart", icon: ShoppingCart },
    { name: "All Kits", path: "/kits", icon: Package },
    { name: "All Courses", path: "/courses", icon: BookLock },
    { name: "Address", path: "/address", icon: MapPin },
    ...(user?.role === "Admin" ? [{ name: "Admin Panel", path: "/admin", icon: Shield }] : []),
  ];

  const baseNavClasses = "flex items-center gap-3 text-sm uppercase tracking-widest transition-all w-full pl-1 border-l-2";
  const activeNavClasses = "text-sidebar-foreground border-neutral-600 dark:border-neutral-400";
  const inactiveNavClasses = "text-muted-foreground border-transparent hover:text-sidebar-foreground hover:border-neutral-400 dark:hover:border-neutral-600";

  return (
    <aside className="w-64 border-r border-border hidden md:flex flex-col p-6 h-screen sticky top-0 bg-sidebar">
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-tighter text-sidebar-foreground">EDUCOMM</h2>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`${baseNavClasses} ${isActive(item.path) ? activeNavClasses : inactiveNavClasses}`}
          >
            <item.icon size={18} /> {item.name}
          </button>
        ))}
      </nav>

      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900">
        <button
          onClick={handleLogout}
          className={`${baseNavClasses} border-transparent text-muted-foreground hover:text-red-500 dark:hover:text-red-400 hover:border-red-400 dark:hover:border-red-500`}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}