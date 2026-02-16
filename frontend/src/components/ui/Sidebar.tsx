import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  BookOpen,  
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Package,
  BookLock,
  MapPin
} from "lucide-react";

export default function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
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
  ];

  return (
    <aside className="w-64 border-r border-border hidden md:flex flex-col p-6 h-screen sticky top-0 bg-sidebar">
      <div className="mb-10">
        <h2 className="text-xl font-bold tracking-tighter text-sidebar-foreground">EDUCOMM</h2>
      </div>
      
      <nav className="flex-1 space-y-4">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 text-sm uppercase tracking-widest transition-colors w-full ${
              isActive(item.path) 
                ? "font-bold text-sidebar-foreground" 
                : "text-muted-foreground hover:text-sidebar-foreground"
            }`}
          >
            <item.icon size={18} /> {item.name}
          </button>
        ))}
      </nav>

      <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="justify-start p-0 text-neutral-500 hover:text-red-500 dark:hover:text-red-400 w-full transition-colors"
        >
          <LogOut size={18} className="mr-2" /> LOGOUT
        </Button>
      </div>
    </aside>
  );
}