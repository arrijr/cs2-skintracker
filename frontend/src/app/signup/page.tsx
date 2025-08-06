"use client";
import { signup as apiSignup } from "../api/api";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = await apiSignup(email, password); // <- Jetzt Wrapper nutzen!
      setSuccess("Registrierung erfolgreich! Du kannst dich jetzt einloggen.");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleSignup}
        className="bg-gray-900 p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-white">Registrieren</h1>
        {error && <div className="mb-3 text-red-500">{error}</div>}
        {success && <div className="mb-3 text-green-500">{success}</div>}
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
          {loading ? "Lädt..." : "Registrieren"}
        </button>
        <div className="mt-4 text-gray-400 text-sm">
          Bereits registriert?{" "}
          <Link href="/login" className="underline">
            Zum Login
          </Link>
        </div>
      </form>
    </div>
  );
}
