import { Link } from "react-router-dom";

type AppLogoProps = {
  compact?: boolean;
};

export const AppLogo = ({ compact = false }: AppLogoProps) => {
  return (
    <Link to="/" className="inline-flex items-center gap-3" aria-label="GeoChat home">
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: "linear-gradient(140deg, #0b74de, #00a88f)",
          boxShadow: "0 10px 22px rgba(11, 116, 222, 0.32)",
        }}
      >
        <span className="text-lg font-extrabold text-white">G</span>
      </span>

      {!compact && (
        <span className="leading-tight">
          <span
            className="block text-lg font-bold tracking-tight"
            style={{ fontFamily: "Sora, Manrope, sans-serif" }}
          >
            GeoChat
          </span>
          <span className="block text-xs text-slate-500">Neighborhoods in real-time</span>
        </span>
      )}
    </Link>
  );
};
