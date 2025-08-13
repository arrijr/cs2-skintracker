"use client";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { LogOut, User2, Star, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/http";

export default function AccountPage() {
  const { user, token, loading, logout } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  if (token === undefined) {
  return <div className="text-white p-6">Loading...</div>;
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-950">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Please login to view your account.</h2>
          <Link href="/login" className="btn-main">Login</Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gray-950">
        <div className="card p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Please login to view your account.</h2>
          <Link href="/login" className="btn-main">Login</Link>
        </div>
      </div>
    );
  }


  // Platzhalter für Stats – diese Daten könntest du im echten Projekt per API laden!
  const portfolioStats = {
    totalSkins: 14,
    totalValue: 312.67,
    bestPerformance: "+24.5%",
  };
  const watchlistStats = {
    count: 5,
    withAlert: 2,
  };

  
  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col items-center mt-8">
      {/* Avatar & Username */}
      <div className="relative flex flex-col items-center gap-3 mb-6">
        <span className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-lg text-4xl">
          <User2 className="w-10 h-10" />
        </span>
        <div className="text-2xl font-bold mt-2">{user.username || "User"}</div>
        <div className="text-zinc-400">{user.email}</div>
      </div>

      {/* Portfolio Stats */}
      <div className="w-full grid grid-cols-2 gap-4 mb-8">
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col items-center shadow-md">
          <Star className="mb-1 w-6 h-6 text-yellow-400" />
          <div className="text-lg font-bold">{portfolioStats.totalSkins}</div>
          <div className="text-xs text-zinc-400">Skins in Portfolio</div>
          <div className="text-sm mt-1 text-green-400 font-mono">
            {portfolioStats.bestPerformance}
          </div>
        </div>
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col items-center shadow-md">
          <Eye className="mb-1 w-6 h-6 text-blue-400" />
          <div className="text-lg font-bold">{watchlistStats.count}</div>
          <div className="text-xs text-zinc-400">On Watchlist</div>
          <div className="text-sm mt-1 text-amber-400 font-mono">
            {watchlistStats.withAlert} alerts
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          className="btn-main bg-red-700 hover:bg-red-800 flex items-center gap-2"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
        <Link
          href="/portfolio"
          className="btn-main flex items-center gap-2"
        >
          <Star className="w-5 h-5" />
          My Portfolio
        </Link>

        <button
          className="btn-main bg-gray-800 hover:bg-red-700 flex items-center gap-2"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="w-5 h-5" />
          Delete Account
        </button>

        <button
          className="btn-main flex items-center gap-2"
          onClick={() => setShowPwModal(true)}
        >
          Change Password
        </button>
      </div>

      {/* Delete Account */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl p-8 shadow-lg w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4 text-red-400">Delete Account</h2>
            <p className="mb-4 text-zinc-300">
              Are you sure you want to delete your account? <br />
              <span className="text-red-400">This action cannot be undone!</span>
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="btn-main bg-red-700 hover:bg-red-800 min-w-[100px]"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await apiFetch("/api/v1/users/me", { method: "DELETE" });
                    logout();
                    window.location.href = "/";
                  } catch {
                    alert("Error deleting account.");
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                className="btn-main"
                onClick={() => setShowDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPwModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 rounded-xl p-8 shadow-lg w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Change Password</h2>
            <input
              type="password"
              placeholder="New password (min. 6 chars)"
              className="input-main mb-4 w-full"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              minLength={6}
            />
            {pwError && <div className="text-red-400 mb-2">{pwError}</div>}
            {pwSuccess && <div className="text-green-400 mb-2">{pwSuccess}</div>}
            <div className="flex gap-4 justify-center mt-2">
              <button
                className="btn-main min-w-[100px]"
                disabled={pwLoading}
                onClick={async () => {
                  setPwError("");
                  setPwSuccess("");
                  if (newPw.length < 6) {
                    setPwError("Password must be at least 6 characters.");
                    return;
                  }
                  {/* Change Password */}
                  setPwLoading(true);
                  try {
                    const data = await apiFetch("/api/v1/users/me/password", {
                      method: "PATCH",
                      body: JSON.stringify({ newPassword: newPw }),
                    });
                    setPwSuccess("Password changed successfully!");
                    setNewPw("");
                  } catch (e: any) {
                    setPwError(e?.message || "Error changing password.");
                  }
                  setPwLoading(false);
                }}
              >
                {pwLoading ? "Saving..." : "Save"}
              </button>
              <button
                className="btn-main"
                onClick={() => {
                  setShowPwModal(false);
                  setNewPw("");
                  setPwError("");
                  setPwSuccess("");
                }}
                disabled={pwLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
