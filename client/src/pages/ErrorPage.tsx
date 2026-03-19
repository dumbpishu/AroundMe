import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AppLogo } from "../components/ui/AppLogo";
import { Button } from "../components/Button";

const getMessage = (error: unknown) => {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The page you are trying to reach is not available.";
};

export const ErrorPage = () => {
  const error = useRouteError();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 sm:px-8">
      <section className="glass-card grid w-full gap-8 rounded-3xl border border-(--border) p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-6">
            <AppLogo />
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-(--text-muted)">Something went wrong</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>
            This route is currently unavailable.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-(--text-secondary)">
            {getMessage(error)}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/">
              <Button>Back to landing</Button>
            </Link>
            <Link to="/chat">
              <Button variant="secondary">Open chat</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-(--border) bg-white p-8 text-center shadow-[0_12px_28px_rgba(17,37,63,0.1)]">
          <p className="text-7xl font-black text-(--brand)" style={{ fontFamily: "Sora, Manrope, sans-serif" }}>
            404
          </p>
          <p className="mt-2 text-sm text-(--text-secondary)">Geo route not found</p>
        </div>
      </section>
    </main>
  );
};
