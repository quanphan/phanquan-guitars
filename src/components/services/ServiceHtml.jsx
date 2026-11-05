import { safeServiceHtml } from "../../data/services.js";

export default function ServiceHtml({ html, className = "" }) {
  const clean = safeServiceHtml(html);
  if (!clean) return null;
  return (
    <div
      className={`service-html max-w-none text-sm leading-relaxed text-muted [&_a]:text-gold [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-ivory [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal [&_p+p]:mt-3 [&_strong]:text-ivory ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
