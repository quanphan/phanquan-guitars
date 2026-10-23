const icons = {
  electric: (
    <path
      d="M10 3.5c1.6.4 3.2 1.4 3.4 3.2.2 1.4-1 2.2-.7 3.6.5 2 1.8 2.8 1.6 4.6-.3 2.6-2.3 4.6-4.3 5.1-2-.5-4-2.5-4.3-5.1-.2-1.8 1.1-2.6 1.6-4.6.3-1.4-.9-2.2-.7-3.6C7 4.9 8.5 3.9 10 3.5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
    />
  ),
  bass: (
    <path
      d="M9.5 3c2 .4 4.2 1.6 4.5 3.6.2 1.5-1 2.4-.6 4 .6 2.4 2 3.4 1.8 5.4-.3 3-2.6 5.4-5.7 5.9-3.1-.5-5.4-2.9-5.7-5.9-.2-2 1.2-3 1.8-5.4.4-1.6-.8-2.5-.6-4C5.3 4.6 7.5 3.4 9.5 3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
    />
  ),
  classical: (
    <>
      <path
        d="M10 4.2c2.4 0 4.2 1.6 4.2 3.5 0 1.2-.7 2.2-1.7 2.8 1.4.7 2.3 1.9 2.3 3.3 0 2.2-2.1 4-4.8 4s-4.8-1.8-4.8-4c0-1.4.9-2.6 2.3-3.3-1-.6-1.7-1.6-1.7-2.8 0-1.9 1.8-3.5 4.2-3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="10" cy="13.2" r="1.15" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </>
  ),
  acoustic: (
    <>
      <path
        d="M10 3.8c2.6 0 4.5 1.7 4.5 3.7 0 1.2-.8 2.3-1.9 2.9 1.6.7 2.6 2 2.6 3.5 0 2.4-2.3 4.3-5.2 4.3S4.8 16.3 4.8 13.9c0-1.5 1-2.8 2.6-3.5-1.1-.6-1.9-1.7-1.9-2.9 0-2 1.9-3.7 4.5-3.7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <circle cx="10" cy="13.6" r="1.25" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </>
  ),
};

export default function InstrumentTypeIcon({ id, className = "" }) {
  return (
    <svg
      viewBox="0 0 20 22"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {icons[id] ?? icons.electric}
    </svg>
  );
}
