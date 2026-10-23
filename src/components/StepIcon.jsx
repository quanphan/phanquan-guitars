const icons = {
  discuss: (
    <path
      d="M7 8h10M7 12h6M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  design: (
    <path
      d="M4 20l4.5-1.2L19 8.3a2 2 0 0 0 0-2.8L18.5 5a2 2 0 0 0-2.8 0L5.2 15.5 4 20zM13.5 6.5l4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  build: (
    <path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.2-3.2a5 5 0 0 1-6.7 6.7L8 19.2a2.1 2.1 0 0 1-3-3l6.4-6.2a5 5 0 0 1 6.7-6.7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  setup: (
    <>
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
};

export default function StepIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 text-gold"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
