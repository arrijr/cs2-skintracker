"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from ".././context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("${API_BASE}/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.message || "Fehler beim Login");
      login(data.token, data.user);
      router.push("/portfolio");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-white">Login</h1>
        {error && <div className="mb-3 text-red-500">{error}</div>}
        <input
          type="email"
          placeholder="E-Mail"
          className="mb-3 w-full px-3 py-2 rounded bg-gray-800 text-white"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          className="mb-6 w-full px-3 py-2 rounded bg-gray-800 text-white"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
        >
          {loading ? "Lädt..." : "Login"}
        </button>
        <div className="mt-4 text-gray-400 text-sm">
          Noch kein Account?{" "}
          <Link href="/signup" className="underline">
            Jetzt registrieren
          </Link>
        </div>
      </form>
    </div>
  );
}
