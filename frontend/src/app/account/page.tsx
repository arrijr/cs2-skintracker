import { redirect } from "next/navigation";

// /account is deprecated — Steam Connect + identity card duplicated
// /profile?tab=account. ProfileDropdown's "Steam" link already points
// at /profile?tab=account#steam, and the SteamConnectSection component
// is still imported by AccountTab via /account/_components/, so the
// component file remains; only the route is collapsed.
//
// Mirrors the same redirect applied to /settings -> /profile?tab=account.
export default function AccountPage() {
  redirect("/profile?tab=account#steam");
}
