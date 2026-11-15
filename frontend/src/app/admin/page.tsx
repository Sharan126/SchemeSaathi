"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  LogOut,
  AlertTriangle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; role: string; full_name: string } | null>(null);

  // Login form state
  const [username, setUsername] = useState("verifier");
  const [password, setPassword] = useState("VerifierSaathi2026!");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Review state
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUserInfo({
        username: data.username,
        role: data.role,
        full_name: data.full_name,
      });

      // Load review queue
      await loadQueue(data.access_token);
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/review-queue`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const queue = await res.json();
        setReviewQueue(queue);
      }
    } catch (err) {
      console.error("Failed to load queue", err);
    }
  };

  const handleVerify = async (schemeId: string, action: "APPROVE" | "REJECT") => {
    if (!token) return;
    if (!verificationNotes.trim()) {
      alert("Verification notes are required by government audit policy.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheme_id: schemeId,
          action,
          verification_notes: verificationNotes,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Scheme ${schemeId} ${action === "APPROVE" ? "Approved & Published" : "Rejected"}. Audit record saved.`);
        setVerificationNotes("");
        await loadQueue(token);
      }
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserInfo(null);
    setReviewQueue([]);
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-md">
            <Lock className="w-6 h-6 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Institutional Verifier Desk</h1>
          <p className="text-xs text-slate-500">
            Authorized access for Government Scheme Verifiers and CSC Supervisors.
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {loginError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gov-navy hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Verification Portal"}
          </button>

          <div className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
            Demo Credentials Pre-filled: <span className="font-semibold text-slate-600">verifier</span>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">{userInfo?.full_name}</h1>
            <span className="text-xs bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
              {userInfo?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            User: <span className="font-mono text-slate-700">{userInfo?.username}</span> • Signed in with cryptographically verified JWT token
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Review Queue */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Ingestion & Verification Queue ({reviewQueue.length})</span>
          </h2>
        </div>

        {reviewQueue.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">All Schemes Verified</h3>
            <p className="text-xs text-slate-500">
              There are currently no newly scraped or modified schemes awaiting human verification.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewQueue.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      Status: {item.status}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {item.title?.en || item.id}
                    </h3>
                    <p className="text-xs text-slate-500">{item.ministry}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-400">ID: {item.id}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-slate-700">Official Source Reference:</p>
                  <p className="text-slate-600 truncate">{item.official_portal_url}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Mandatory Verifier Sign-off Notes (Recorded in Immutable Audit Trail):
                  </label>
                  <input
                    type="text"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Cross-checked with Gazette notification dated 2026-02-01. Criteria and documents confirmed."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    onClick={() => handleVerify(item.id, "REJECT")}
                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleVerify(item.id, "APPROVE")}
                    className="px-4 py-2 bg-gov-green hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Publish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
