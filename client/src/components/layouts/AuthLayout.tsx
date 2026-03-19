import { Outlet } from "react-router-dom"
import { AppLogo } from "../ui/AppLogo"

export const AuthLayout = () => {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-8 sm:px-8">
            <section className="grid w-full gap-5 rounded-3xl border border-(--border) bg-white/70 p-3 shadow-(--shadow-strong) backdrop-blur sm:p-4 lg:grid-cols-[1fr_1fr]">
                <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#0d253f,#0b74de_62%,#00a88f)] p-8 text-white">
                    <div className="pointer-events-none absolute -left-24 top-2 h-60 w-60 rounded-full bg-white/15 blur-2xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#76d8c8]/25 blur-2xl" />

                    <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                        <AppLogo compact />
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-white/80">Secure sign in</p>
                            <h1 className="mt-3 text-3xl font-bold leading-tight" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>
                                Enter GeoChat
                            </h1>
                            <p className="mt-3 max-w-md text-sm text-white/85 sm:text-base">
                                Use your email OTP and start chatting with people in your nearby room.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-xs font-semibold">Fast OTP login</div>
                            <div className="rounded-xl border border-white/25 bg-white/10 p-3 text-xs font-semibold">Private route protection</div>
                        </div>
                    </div>
                </div>

                <div className="glass-card fade-in rounded-2xl p-6 sm:p-8">
                    <div className="mb-6">
                        <AppLogo />
                    </div>

                    <Outlet />
                </div>
            </section>
        </main>
    )
}
