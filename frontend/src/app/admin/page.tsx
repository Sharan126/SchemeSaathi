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
  History,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ username: string; role: string; full_name: string } | null>(null);

  // Secure Institutional Login - Zero Hardcoded Demo Credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Review state
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"queue" | "audit">("queue");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", username.trim());
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        throw new Error("Invalid institutional credentials or unauthorized role");
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
      setLoginError(err.message || "Institutional authentication failed");
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

  const loadAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const logs = await res.json();
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    }
  };

  const handleVerify = async (schemeId: string, action: "APPROVE" | "REJECT" | "REQUEST_CORRECTION") => {
    if (!token) return;
    if (!verificationNotes.trim()) {
      alert("Mandatory verification notes are required by government audit policy before executing this action.");
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
          action: action === "REQUEST_CORRECTION" ? "REJECT" : action,
          verification_notes: action === "REQUEST_CORRECTION" ? `[Correction Requested] ${verificationNotes}` : verificationNotes,
        }),
      });

      if (res.ok) {
        const label =
          action === "APPROVE"
            ? "Approved & Published"
            : action === "REQUEST_CORRECTION"
            ? "Marked for Correction"
            : "Rejected";
        setActionSuccess(`Scheme ${schemeId}: ${label}. Cryptographic audit record saved.`);
        setVerificationNotes("");
        await loadQueue(token);
        if (activeTab === "audit") {
          await loadAuditLogs();
        }
      } else {
        alert("Action could not be completed. Check authorization.");
      }
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserInfo(null);
    setReviewQueue([]);
    setAuditLogs([]);
    setUsername("");
    setPassword("");
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-[#0F1E36] text-white flex items-center justify-center font-bold text-base mx-auto shadow-hairline border-b-2 border-terracotta">
            <Lock className="w-5 h-5 text-orange-300" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F1E36]">Institutional Verifier Desk</h1>
          <p className="text-xs text-slate-600">
            Authorized administrative access for Government Scheme Verifiers, CSC Supervisors, and Program Auditors.
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-6 rounded border border-hairline shadow-hairline space-y-4">
          <div className="bg-[#FAFBFD] border border-hairline p-3 rounded text-xs text-slate-700 flex items-start space-x-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
            <span>
              Restricted GovTech Access: Administrative actions are cryptographically signed and logged in an immutable audit trail.
            </span>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Official Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter accredited username"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-hairline rounded focus:outline-none focus:ring-2 focus:ring-[#0F1E36] bg-slate-50 focus:bg-white"
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
                placeholder="Enter authorized password"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-hairline rounded focus:outline-none focus:ring-2 focus:ring-[#0F1E36] bg-slate-50 focus:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0F1E36] hover:bg-[#162842] text-white font-bold rounded text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50 shadow-hairline"
          >
            {loading ? "Authenticating Credentials..." : "Sign In with Institutional Credentials"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Top Banner */}
      <div className="bg-white rounded border border-hairline p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-hairline">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-forest" />
            <h1 className="text-base sm:text-lg font-bold text-[#0F1E36]">{userInfo?.full_name}</h1>
            <span className="text-[10px] bg-slate-100 text-[#0F1E36] border border-slate-300 px-2 py-0.2 rounded font-mono font-bold">
              {userInfo?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifier: <span className="font-mono text-slate-800">{userInfo?.username}</span> • Signed in via JWT RBAC Authorization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-3 py-1 rounded transition-colors cursor-pointer font-bold ${
                activeTab === "queue" ? "bg-white text-[#0F1E36] shadow-sm" : "text-slate-600"
              }`}
            >
              Verification Queue ({reviewQueue.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("audit");
                loadAuditLogs();
              }}
              className={`px-3 py-1 rounded transition-colors cursor-pointer font-bold ${
                activeTab === "audit" ? "bg-white text-[#0F1E36] shadow-sm" : "text-slate-600"
              }`}
            >
              Audit Trail
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 rounded text-xs font-bold text-slate-700 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-forest text-xs rounded flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Review Queue Tab */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <h2 className="text-base font-bold text-[#0F1E36] flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Pending Scheme Verification Queue ({reviewQueue.length})</span>
            </h2>
            <span className="text-slate-500">Government gazette cross-check mandatory</span>
          </div>

          {reviewQueue.length === 0 ? (
            <div className="bg-white p-10 rounded border border-hairline text-center space-y-2 shadow-hairline">
              <CheckCircle2 className="w-8 h-8 text-forest mx-auto" />
              <h3 className="font-bold text-sm text-[#0F1E36]">All Scraped Schemes Verified</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                There are currently no new drafts awaiting human sign-off. The live public catalogue contains 8 verified schemes with active gazette citations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewQueue.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded border border-hairline space-y-4 shadow-hairline">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Status: {item.status}
                      </span>
                      <h3 className="text-base font-bold text-[#0F1E36] mt-1">
                        {item.title?.en || item.id}
                      </h3>
                      <p className="text-xs text-slate-500">{item.ministry}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">ID: {item.id}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded text-xs space-y-1 border border-hairline">
                    <p className="font-bold text-slate-700">Official Portal &amp; Gazette Reference:</p>
                    <a
                      href={item.official_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-civic hover:underline flex items-center space-x-1"
                    >
                      <span className="truncate">{item.official_portal_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-hairline">
                    <label className="block text-xs font-bold text-slate-700">
                      Mandatory Verifier Sign-off Notes (Saved to Immutable Audit Trail):
                    </label>
                    <input
                      type="text"
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="e.g. Cross-checked with Gazette notification dated 2026-02-01. Eligibility AST and documents confirmed."
                      className="w-full px-3 py-2 border border-hairline rounded text-xs focus:ring-2 focus:ring-[#0F1E36] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-hairline">
                    <button
                      onClick={() => handleVerify(item.id, "REQUEST_CORRECTION")}
                      className="px-3 py-1.5 border border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-bold rounded flex items-center space-x-1 cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Request Correction</span>
                    </button>
                    <button
                      onClick={() => handleVerify(item.id, "REJECT")}
                      className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold rounded flex items-center space-x-1 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Draft</span>
                    </button>
                    <button
                      onClick={() => handleVerify(item.id, "APPROVE")}
                      className="px-4 py-1.5 bg-forest hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center space-x-1 cursor-pointer shadow-hairline"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify &amp; Publish to Public Catalogue</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <h2 className="text-base font-bold text-[#0F1E36] flex items-center space-x-2">
              <History className="w-4 h-4 text-civic" />
              <span>Immutable Verification Audit Trail</span>
            </h2>
            <button
              onClick={loadAuditLogs}
              className="text-xs font-bold text-civic hover:underline cursor-pointer"
            >
              Refresh Logs
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="bg-white p-10 rounded border border-hairline text-center space-y-2 shadow-hairline">
              <History className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">
                Audit logs are restricted to SUPER_ADMIN role or will appear after verification actions.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded border border-hairline overflow-hidden shadow-hairline">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-hairline text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity</th>
                      <th className="p-3">Verifier</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline text-slate-700">
                    {auditLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 whitespace-nowrap text-slate-500 font-mono">{log.created_at || "Recent"}</td>
                        <td className="p-3">
                          <span className="font-bold text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{log.entity_id}</td>
                        <td className="p-3 font-semibold">{log.performed_by}</td>
                        <td className="p-3 text-slate-600 max-w-md truncate">{log.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
