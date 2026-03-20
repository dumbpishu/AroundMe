import { Link } from "react-router-dom"
import { AppLogo } from "../components/ui/AppLogo"
import { Button } from "../components/Button"
import { useAuth } from "../context/AuthContext"

export const LandingPage = () => {
    const { user } = useAuth()

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8 sm:py-10">
            <header className="mb-10 flex items-center justify-between">
                <AppLogo />
                {user ? (
                    <Link to="/profile" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) bg-white shadow-[0_8px_20px_rgba(17,37,63,0.08)]">
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-(--brand)">{user.username.slice(0, 1).toUpperCase()}</span>
                        )}
                    </Link>
                ) : (
                    <Link to="/auth/send-otp" className="text-sm font-semibold text-(--brand) hover:text-(--brand-dark)">
                        Sign in
                    </Link>
                )}
            </header>

            <section className="grid items-center gap-8 lg:grid-cols-[1.06fr_1fr]">
                <div className="fade-in">
                    <p className="text-xs uppercase tracking-[0.26em] text-(--text-muted)">Geo-first communication</p>
                    <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>
                        Connect instantly with people around you.
                    </h1>
                    <p className="mt-4 max-w-2xl text-base text-(--text-secondary) sm:text-lg">
                        GeoChat creates dynamic rooms from fixed geo cells so every conversation stays nearby, contextual, and real-time.
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link to={user ? "/chat" : "/auth/send-otp"}>
                            <Button className="cursor-pointer">Start Chatting</Button>
                        </Link>
                    </div>

                    <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-(--border) bg-white px-4 py-3 shadow-[0_10px_24px_rgba(17,37,63,0.06)]">
                            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Realtime</p>
                            <p className="mt-1 text-sm font-semibold">Socket powered messaging</p>
                        </div>
                        <div className="rounded-xl border border-(--border) bg-white px-4 py-3 shadow-[0_10px_24px_rgba(17,37,63,0.06)]">
                            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Location</p>
                            <p className="mt-1 text-sm font-semibold">Automatic room join</p>
                        </div>
                        <div className="rounded-xl border border-(--border) bg-white px-4 py-3 shadow-[0_10px_24px_rgba(17,37,63,0.06)]">
                            <p className="text-xs uppercase tracking-[0.16em] text-(--text-muted)">Auth</p>
                            <p className="mt-1 text-sm font-semibold">Secure OTP access</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card fade-in rounded-3xl p-6 sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">How it works</p>
                    <div className="grid gap-3">
                        <div className="rounded-xl border border-(--border) bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">Step 1</p>
                            <p className="mt-1 text-sm font-semibold">Sign in securely with OTP</p>
                        </div>
                        <div className="rounded-xl border border-(--border) bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">Step 2</p>
                            <p className="mt-1 text-sm font-semibold">Share location to enter your nearby room</p>
                        </div>
                        <div className="rounded-xl border border-(--border) bg-white px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">Step 3</p>
                            <p className="mt-1 text-sm font-semibold">Chat live and share media in real time</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
