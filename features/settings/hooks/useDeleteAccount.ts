import { useState } from "react";

const LOGOUT_URL = "/api/auth/logout";

/**
 * Erases the account through DELETE /api/account and then ends the session:
 * the Auth0 cookie would otherwise keep a user whose data no longer exists
 * signed in, and /api/firebase would recreate an empty user doc on the next
 * page load. `navigate` is injectable so the redirect can be observed in tests.
 */
export function useDeleteAccount(navigate: (url: string) => void = defaultNavigate) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error(`Request to /api/account failed with status ${res.status}`);
      navigate(LOGOUT_URL);
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError("Couldn't delete the account — try again or write to us.");
      setDeleting(false);
    }
  };

  return { deleteAccount, deleting, error };
}

function defaultNavigate(url: string) {
  window.location.assign(url);
}
