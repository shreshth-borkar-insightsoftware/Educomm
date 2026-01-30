import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "@/api/axiosInstance"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!")
      return
    }

    setLoading(true)
    try {
      // Backend hits port 50135
      await api.post("/auth/Register", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        password: formData.password
      })
      
      alert("Registration successful!")
      navigate("/login")
    } catch (err) {
      alert("Registration failed. Check your backend connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-white dark:bg-black p-4 py-10">
      <Card className="w-full max-w-[450px] border border-neutral-200 rounded-2xl bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold tracking-tight text-center text-black dark:text-white">
            Create an Account
          </CardTitle>
          <CardDescription className="text-center text-xs">
            Enter Details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName" 
                  placeholder="Rick" 
                  className="rounded-lg border-neutral-500 focus-visible:ring-black dark:border-neutral-500"
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName" 
                  placeholder="Roll" 
                  className="rounded-lg border-neutral-500 focus-visible:ring-black dark:border-neutral-500"
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                className="rounded-lg border-neutral-500 focus-visible:ring-black dark:border-neutral-500"
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input 
                id="mobile" 
                type="tel" 
                placeholder="+91 9876543210" 
                className="rounded-lg border-neutral-500 focus-visible:ring-black dark:border-neutral-500"
                onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})} 
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="rounded-lg border-neutral-500 focus-visible:ring-black dark:border-neutral-500"
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-lg bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black mt-2"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Register"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center pb-6 pt-0">
          <p className="text-xs text-neutral-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-black hover:underline dark:text-white">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}