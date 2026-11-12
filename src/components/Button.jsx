import { Link } from "react-router-dom";

const variants = {
  gold: "border border-gold bg-gold text-charcoal hover:border-gold-light hover:bg-gold-light",
  outline:
    "border border-gold/70 bg-transparent text-ivory hover:border-gold hover:bg-gold/10",
};

export default function Button({
  to,
  children,
  variant = "gold",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  ...props
}) {
  const classes = `inline-flex max-w-full items-center justify-center px-5 py-3.5 text-center text-[11px] font-medium uppercase tracking-[0.16em] break-words transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-7 sm:tracking-[0.22em] ${variants[variant]} ${
    disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
  } ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
