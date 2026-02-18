import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { useCartStore } from "@/store/useCartStore"
import api from "@/api/axiosInstance"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  
  const setAuth = useAuthStore((state) => state.setAuth)
  const syncCartToBackend = useCartStore((state) => state.syncCartToBackend)
  const navigate = useNavigate()

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/Login", { email, password });

      console.log("Full Login Response:", data);

      const token = typeof data === 'string' ? data : (data.token || data.jwtToken);
      
      if (!token) {
        throw new Error("Token not found in server response.");
      }

      const userData = data.user || data; 

      const userRole = userData.role || userData.Role || "User";
      
      setAuth({ 
        email: email, 
        userId: userData.userId || userData.id || userData.Id || 0,
        role: userRole,
        firstName: userData.firstName || userData.FirstName || "",
        lastName: userData.lastName || userData.LastName || ""    
      }, token); 

      // Sync guest cart items to backend
      await syncCartToBackend();

      // Redirect to saved path or default
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      localStorage.removeItem('redirectAfterLogin');

      if (redirectPath && redirectPath !== '/login') {
        navigate(redirectPath);
      } else if (userRole === "Admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Login Error Details:", err);
      const errorMessage = err.response?.data?.message || err.message || "Invalid credentials.";
      alert(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-black p-4">
      <Card className="w-full max-w-[350px] border border-neutral-200 rounded-2xl bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-center text-black dark:text-white">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="rounded-lg border-neutral-200 focus-visible:ring-black dark:border-neutral-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Password label" className="text-sm font-medium">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="rounded-lg border-neutral-200 focus-visible:ring-black dark:border-neutral-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black transition-colors"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center pb-6 pt-0">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Not a user?{" "}
            <Link 
              to="/register" 
              className="font-semibold text-black hover:underline dark:text-white"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}