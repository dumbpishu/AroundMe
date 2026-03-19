import { Outlet } from "react-router-dom";

export const ChatLayout = () => {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-5">
      <section className="h-[calc(100vh-1.5rem)] min-h-0 w-full overflow-hidden rounded-2xl border border-(--border) bg-white shadow-(--shadow-strong) sm:h-[calc(100vh-2.5rem)]">
        <Outlet />
      </section>
    </main>
  );
};