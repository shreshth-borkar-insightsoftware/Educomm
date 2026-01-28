import { useAuthStore } from "@/store/useAuthStore"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LayoutDashboard, BookOpen, Settings, LogOut, User as UserIcon, Package } from "lucide-react"

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-black dark:text-white">
      
      <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 hidden md:flex flex-col p-6">
        <div className="mb-10">
          <h2 className="text-xl font-bold tracking-tighter">EDUCOMM</h2>
        </div>
        <nav className="flex-1 space-y-4">
          <button className="flex items-center gap-3 font-bold text-sm uppercase tracking-widest">
            <LayoutDashboard size={18} /> Overview
          </button>
          <button 
           onClick={() => navigate("/my-courses")} // Changed from /enrollments to /my-courses
           className="flex items-center gap-3 text-neutral-500 text-sm uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
          >
            <BookOpen size={18} /> My Courses
          </button>
          <button className="flex items-center gap-3 text-neutral-500 text-sm uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">
            <Settings size={18} /> Settings
          </button>
        </nav>
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="justify-start p-0 text-neutral-500 hover:text-black dark:hover:text-white"
        >
          <LogOut size={18} className="mr-2" /> LOGOUT
        </Button>
      </aside>

      <main className="flex-1 p-8 md:p-12">
        
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter uppercase">
              Hello !{user?.firstName} {user?.lastName}
            </h1>
            <p className="text-neutral-500 mt-2 italic">Select a category to begin.</p>
          </div>
          <div className="h-12 w-12 rounded-full border border-black dark:border-white flex items-center justify-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
            <UserIcon size={20} />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          <div 
            onClick={() => navigate("/kits")} 
            className="group cursor-pointer transition-all duration-300"
          >
            <Card className="rounded-2xl border-2 border-black dark:border-white bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-none transition-all">
              <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                <Package size={64} className="group-hover:scale-110 transition-transform" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Kits</h2>
                <p className="text-sm uppercase tracking-widest opacity-60">Physical Resources</p>
              </CardContent>
            </Card>
          </div>

          <div 
            onClick={() => navigate("/courses")} 
            className="group cursor-pointer transition-all duration-300"
          >
            <Card className="rounded-2xl border-2 border-black dark:border-white bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-none transition-all">
              <CardContent className="p-12 flex flex-col items-center justify-center space-y-4">
                <BookOpen size={64} className="group-hover:scale-110 transition-transform" />
                <h2 className="text-3xl font-black tracking-tighter uppercase">Courses</h2>
                <p className="text-sm uppercase tracking-widest opacity-60">Digital Learning</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}