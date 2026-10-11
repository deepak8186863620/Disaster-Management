import React, { useState } from "react";
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Radio
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSystem } from "../context/SystemContext";
import { SEED_USERS } from "../services/seedData";

export const AuthPage = ({ onAuthSuccess }) => {
  const { login, register, switchDemoRole } = useAuth();
  const { addToast } = useSystem();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      if (isRegisterMode) {
        if (!formData.name) throw new Error("Please enter your name");
        const res = await register(formData.name, formData.email, formData.password);
        if (res.success) {
          addToast("Account registered with default Citizen privileges.", "success");
          if (onAuthSuccess) onAuthSuccess();
        } else {
          setErrorMessage(res.error || "Registration failed");
        }
      } else {
        const res = await login(formData.email, formData.password);
        if (res.success) {
          addToast(`Welcome back, ${res.user.name}!`, "success");
          if (onAuthSuccess) onAuthSuccess();
        } else {
          setErrorMessage(res.error || "Invalid email or credentials");
        }
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    switchDemoRole(role);
    addToast(`Authenticated as demo ${role.toUpperCase()}`, "success");
    if (onAuthSuccess) onAuthSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing hazard radar rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-950/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 shadow-xl shadow-rose-600/30 mb-3">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          DisasterShield EOC
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          AI-Powered Disaster Response & Emergency Command Center
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800 space-y-6">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => { setIsRegisterMode(false); setErrorMessage(""); }}
              className={`py-2 rounded-lg transition-all ${
                !isRegisterMode 
                  ? "bg-slate-800 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); setErrorMessage(""); }}
              className={`py-2 rounded-lg transition-all ${
                isRegisterMode 
                  ? "bg-slate-800 text-white shadow" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register Account
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. officer@disastershield.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {isRegisterMode && (
              <p className="text-[11px] text-slate-400 leading-tight">
                * Note: Self-registration strictly grants Citizen privileges. Certified Emergency Officers and Administrators are credentialed by command administrators.
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? "Authenticating..." : isRegisterMode ? "Create Citizen Account" : "Access Emergency Console"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles for Judges / Examiners */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              1-Click Evaluation Profiles
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("officer")}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/50 text-left transition-all"
              >
                <div className="font-bold text-rose-400">Emergency Officer</div>
                <div className="text-[10px] text-slate-400 truncate">Capt. Rajesh Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("citizen")}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 text-left transition-all"
              >
                <div className="font-bold text-blue-400">Citizen</div>
                <div className="text-[10px] text-slate-400 truncate">Rohan Verma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-left transition-all"
              >
                <div className="font-bold text-purple-400">Administrator</div>
                <div className="text-[10px] text-slate-400 truncate">Dr. Ananya Roy</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("sensor_agent")}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 text-left transition-all"
              >
                <div className="font-bold text-cyan-400">IoT Gateway</div>
                <div className="text-[10px] text-slate-400 truncate">Telemetry Service</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
