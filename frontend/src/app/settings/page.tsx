import { redirect } from "next/navigation";

// /settings is deprecated — consolidated into /profile?tab=account.
// All preferences (display name, timezone, currency, theme, notifications,
// danger zone) now live under the unified Profile page tabs.
export default function SettingsPage() {
  redirect("/profile?tab=account");
}
