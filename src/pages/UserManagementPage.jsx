import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Search, 
  Filter, 
  Key, 
  AlertCircle,
  CheckCircle2,
  Lock
} from "lucide-react";
import { userService } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { StatusBadge } from "../components/common/StatusBadge";

export const UserManagementPage = () => {
  const { currentUser, hasRole } = useAuth();
  const { addToast } = useSystem();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const loadUsers = async () => {
    const list = await userService.getUsers();
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
    window.addEventListener("users-updated", loadUsers);
    return () => window.removeEventListener("users-updated", loadUsers);
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await userService.updateUserRole(userId, newRole);
      addToast(`User role updated to ${newRole.toUpperCase()}.`, "success");
    } catch (err) {
      addToast("Failed to update role: " + err.message, "danger");
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    await userService.updateUserStatus(userId, newStatus);
    addToast(`User account ${newStatus}.`, "info");
  };

  if (!hasRole("admin")) {
    return (
      <div className="p-12 text-center rounded-2xl bg-rose-950/20 border border-rose-500/30">
        <Lock className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Access Restricted</h3>
        <p className="text-xs text-rose-300">
          User Management is restricted to certified System Administrators. Switch your role to Administrator in the top navigation bar to access this module.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          <span>Role-Based Access Control & User Management</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Enforce organizational governance. Manage credentialed Emergency Officers, Citizens, Administrators, and IoT telemetry gateways.
        </p>
      </div>

      {/* Security Mandate Note */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3 text-xs text-purple-200">
        <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
            Administrative Role Enforcement Policy
          </span>
          <p className="text-purple-200/90 mt-0.5">
            Public citizen self-registration defaults strictly to the <strong>Citizen</strong> role. 
            Elevation to <strong>Emergency Officer</strong> or <strong>Administrator</strong> requires explicit administrative approval within this console.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="citizen">Citizens</option>
          <option value="officer">Emergency Officers</option>
          <option value="admin">Administrators</option>
          <option value="sensor_agent">IoT Sensor Sources</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Department / Unit</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                        {u.name?.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-300 font-medium">
                    {u.department || "General Public"}
                  </td>

                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
                    >
                      <option value="citizen">Citizen</option>
                      <option value="officer">Emergency Officer</option>
                      <option value="admin">Administrator</option>
                      <option value="sensor_agent">IoT Sensor Source</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      u.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}>
                      {u.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleStatusToggle(u.id, u.status)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        u.status === "active"
                          ? "bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      {u.status === "active" ? "Suspend Account" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
