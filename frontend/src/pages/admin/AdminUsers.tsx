import { useEffect, useState } from "react";
import api from "../../api/axiosInstance";
import { User, Mail, Phone, Shield } from "lucide-react";

interface UserData {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    return role.toLowerCase() === "admin"
      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  };

  const getFullName = (user: UserData) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return "—";
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 h-full flex items-center justify-center">
        <p className="text-neutral-500 text-lg italic">Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 md:p-12 h-full flex flex-col">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6">
          <p className="text-red-800 dark:text-red-200 font-bold text-lg">Error loading users</p>
          <p className="text-red-600 dark:text-red-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 h-full flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase">
            User Management
          </h1>
          <p className="text-neutral-500 mt-2 italic">
            View all registered users
          </p>
        </div>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-2 border-black dark:border-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                Total Users
              </p>
              <p className="text-3xl font-bold mt-2">{users.length}</p>
            </div>
            <User size={40} className="text-neutral-400" />
          </div>
        </div>
        <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-2 border-black dark:border-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                Admins
              </p>
              <p className="text-3xl font-bold mt-2">
                {users.filter(u => u.role.toLowerCase() === "admin").length}
              </p>
            </div>
            <Shield size={40} className="text-purple-400" />
          </div>
        </div>
        <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-2 border-black dark:border-white rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                Customers
              </p>
              <p className="text-3xl font-bold mt-2">
                {users.filter(u => u.role.toLowerCase() === "customer").length}
              </p>
            </div>
            <User size={40} className="text-blue-400" />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border-2 border-black dark:border-white rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black text-white dark:bg-white dark:text-black">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">User ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-widest">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 italic">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.userId}
                    className="hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono">#{user.userId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-neutral-400" />
                        <span className="font-semibold">{getFullName(user)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-neutral-400" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-neutral-400" />
                        <span className="text-sm">{user.phoneNumber || "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
