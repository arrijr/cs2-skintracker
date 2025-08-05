"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 rounded text-white"
    >
      Logout
    </button>
  );
}
