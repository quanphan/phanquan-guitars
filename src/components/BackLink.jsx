import { Link } from "react-router-dom";

export default function BackLink({ to, label }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="inline-flex min-h-11 items-center font-display text-base tracking-[0.14em] text-gold transition-colors duration-300 ease-out hover:text-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      Back
    </Link>
  );
}
