/** Shared presentation for Models, Home featured, and Guitar product cards. */
export const catalogCard = {
  article:
    "group relative flex h-full min-h-0 flex-1 flex-col cursor-pointer border border-transparent bg-charcoal transition-[border-color,box-shadow,color] duration-300 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:border-gold/70 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_14px_28px_rgba(0,0,0,0.28)] [@media(hover:hover)_and_(pointer:fine)]:focus-within:border-gold/70",
  link: "relative z-0 flex min-h-0 w-full min-w-0 flex-1 flex-col text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  image:
    "transition-transform duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.04]",
  imageFrame: "aspect-[16/9] w-full shrink-0",
  copy: "flex shrink-0 flex-col px-6 pt-5",
  title:
    "line-clamp-2 min-h-[1.25em] font-display text-2xl leading-tight tracking-wide text-ivory transition-colors duration-300 sm:text-3xl [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-gold [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:text-gold",
  description: "mt-[18px] line-clamp-3 min-h-[4.3rem] text-sm leading-relaxed text-muted",
  actionSpacer: "mt-auto block min-h-[88px] shrink-0 px-6 pb-5 pt-6",
  actionOverlay:
    "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[88px] items-start px-6 pb-5 pt-6",
  action:
    "inline-flex min-h-11 items-center gap-2 text-left text-[11px] uppercase tracking-[0.22em] text-gold transition-opacity duration-300 max-lg:opacity-100 lg:[@media(hover:hover)_and_(pointer:fine)]:opacity-0 lg:[@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 lg:[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
};
