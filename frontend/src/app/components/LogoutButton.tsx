"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const { user } = useUser();
  const router = useRouter();

  function handleLogout() {
    // Clerk handles logout automatically
    router.push("/sign-in");
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
