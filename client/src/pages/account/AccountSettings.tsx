import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import type { ChangeEvent } from "react";
import { Button } from "../../components/Button";
import { useAuth } from "../../context/AuthContext";
import { deleteMyAccount, updateUserAvatar, updateUserProfile } from "../../api/user";
import { AppLogo } from "../../components/ui/AppLogo";

export const AccountSettings = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const saveProfile = async () => {
    if (!username.trim()) {
      setStatus({ type: "error", message: "Username is required." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const response = await updateUserProfile({ username: username.trim() });
      if (response.success) {
        login(response.data);
        setUsername(response.data.username);
        setStatus({ type: "success", message: "Profile updated successfully." });
      }
    } catch {
      setStatus({ type: "error", message: "Could not update profile." });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    setAvatarUploading(true);
    setStatus(null);

    try {
      const response = await updateUserAvatar(selected);
      if (response.success) {
        login(response.data);
        setStatus({ type: "success", message: "Avatar updated." });
      }
    } catch {
      setStatus({ type: "error", message: "Avatar upload failed." });
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const removeAccount = async () => {
    if (!window.confirm("Delete your account permanently?")) {
      return;
    }

    setDeleting(true);

    try {
      await deleteMyAccount();
      await logout();
      navigate("/auth/send-otp", { replace: true });
    } catch {
      setStatus({ type: "error", message: "Unable to delete account right now." });
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth/send-otp", { replace: true });
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-(--bg-main)">
      <header className="flex items-center justify-between gap-3 border-b border-(--border) bg-white/95 px-3 py-3 backdrop-blur sm:px-5">
        <AppLogo compact />
        <Link to="/chat" className="rounded-lg border border-(--border) px-3 py-1.5 text-xs font-semibold text-(--text-primary) hover:bg-(--bg-soft)">
          Back to Chat
        </Link>
      </header>

      <div className="h-full overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>
              Profile Management
            </h1>
            <p className="mt-1 text-sm text-(--text-secondary)">
              Update your profile details and account settings.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <aside className="rounded-xl border border-(--border) bg-white p-5 shadow-[0_10px_24px_rgba(17,37,63,0.06)]">
              <div className="flex flex-col items-center text-center">
                {user?.avatar ? (
                  <img src={user.avatar} alt="avatar" className="h-20 w-20 rounded-2xl object-cover" />
                ) : (
                  <div className="grid h-20 w-20 place-items-center rounded-2xl bg-(--bg-soft) text-2xl font-bold text-(--brand)">
                    {user?.username?.slice(0, 1).toUpperCase() || "U"}
                  </div>
                )}

                <p className="mt-3 text-base font-semibold">{user?.username}</p>
                <p className="text-xs text-(--text-muted)">{user?.email}</p>

                <label className="mt-4 inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg border border-(--border) bg-(--bg-soft) px-4 text-sm font-semibold text-(--text-primary) hover:bg-[#dde9f6]">
                  {avatarUploading ? "Uploading..." : "Upload Avatar"}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={avatarUploading} />
                </label>
              </div>
            </aside>

            <div className="rounded-xl border border-(--border) bg-white p-5 shadow-[0_10px_24px_rgba(17,37,63,0.06)]">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-(--text-secondary)">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-11 w-full rounded-lg border border-(--border) bg-(--bg-main) px-4 text-sm outline-none focus:border-(--brand)"
                />
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button onClick={saveProfile} loading={saving}>
                  Save Profile
                </Button>
                <Button variant="ghost" onClick={() => void handleLogout()} className="border border-(--border)">
                  Logout
                </Button>
              </div>

              <div className="mt-5 border-t border-(--border) pt-5">
                <p className="text-sm font-semibold text-[#8f2f2f]">Danger Zone</p>
                <p className="mt-1 text-xs text-(--text-muted)">Delete your account permanently.</p>
                <Button variant="ghost" onClick={removeAccount} loading={deleting} className="mt-3 border border-[#efc3c3] text-[#8f2f2f] hover:bg-[#fff3f3]">
                  Delete Account
                </Button>
              </div>

              {status && (
                <p className={`mt-4 rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-[#8cd6c8] bg-[#e6f7f3] text-[#176657]" : "border-[#efc3c3] bg-[#fff3f3] text-[#8f2f2f]"}`}>
                  {status.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
