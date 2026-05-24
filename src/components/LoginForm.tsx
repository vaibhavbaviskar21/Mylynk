import React, { useState } from "react";
import * as LucideImport from "lucide-react";
import { UserData } from "../types";
import { MyLynkLogo } from "./MyLynkLogo";

interface LoginFormProps {
  onSuccess: (username: string, portfolio: UserData) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || !/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setError("Username must be at least 3 alphanumeric characters.");
      return;
    }

    if (isRegister && (!email || !email.includes("@"))) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister ? { username: cleanUsername, email: email.trim(), password } : { username: cleanUsername, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      onSuccess(data.username, data.portfolio);
    } catch (err: any) {
      setError(err?.message || "Could not connect to the service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl backdrop-blur-md fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 mb-4 shadow-[0_4px_16px_rgba(99,102,241,0.25)] group hover:scale-[1.04] transition-transform duration-300">
          <MyLynkLogo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
          {isRegister ? "Join as a Creator" : "Welcome Back"}
        </h2>
        <p className="text-sm text-neutral-400 mt-1.5 font-normal">
          {isRegister
            ? "Create and customize your single-link portfolio page in under 2 minutes"
            : "Manage your personalized links and appearance settings"}
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs flex items-start gap-2.5">
          <LucideImport.AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          <span className="leading-normal">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            Username
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 font-mono text-sm">
              bio.link/
            </span>
            <input
              type="text"
              required
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-22 pr-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500/80 focus:outline-none transition-colors text-white font-semibold text-sm placeholder:text-neutral-600 focus:ring-1 focus:ring-indigo-500/30"
              disabled={loading}
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Email for Registration */}
        {isRegister && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 font-sans">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500/80 focus:outline-none transition-colors text-white font-medium text-sm placeholder:text-neutral-600 focus:ring-1 focus:ring-indigo-500/30"
              disabled={loading}
              autoComplete="email"
            />
          </div>
        )}

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-indigo-500/80 focus:outline-none transition-colors text-white text-sm placeholder:text-neutral-600 focus:ring-1 focus:ring-indigo-500/30"
            disabled={loading}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors mt-6 shadow-[0_4px_12px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          disabled={loading}
          id="login-submit-button"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isRegister ? (
            <>
              <span>Create Account</span>
              <LucideImport.ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Sign In to Editor</span>
              <LucideImport.ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Toggle mode */}
      <div className="text-center mt-6 pt-6 border-t border-neutral-800 text-xs">
        <span className="text-neutral-500 font-medium">
          {isRegister ? "Already have a portfolio page?" : "Ready to customize your own link page?"}
        </span>
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
          }}
          className="text-indigo-400 font-bold ml-1.5 hover:underline focus:outline-none cursor-pointer"
          disabled={loading}
          id="toggle-auth-mode-button"
        >
          {isRegister ? "Sign In Instead" : "Register a Free Link"}
        </button>
      </div>
    </div>
  );
}
