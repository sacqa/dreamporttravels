import logo from "@/assets/dreamport-logo.png";
import { Link } from "@tanstack/react-router";

export function Logo({ className = "h-9" }: { className?: string }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src={logo.url} alt="DreamPort Travels" className={className + " w-auto"} />
    </Link>
  );
}
