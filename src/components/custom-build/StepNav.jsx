import Button from "../Button.jsx";

const navButton =
  "min-h-10 shrink-0 px-5 py-2 sm:min-w-[8.5rem] sm:px-6 sm:py-2.5";

export default function StepNav({
  onBack,
  onContinue,
  onReset,
  backTo,
  continueDisabled,
  continueHidden,
  backDisabled,
  resetDisabled,
  backLabel,
  continueLabel,
  resetLabel,
}) {
  const backBlocked = Boolean(backDisabled);
  return (
    <nav className="border-b border-gold/20 py-2.5" aria-label="Wizard">
      <div className="flex flex-nowrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <Button
            to={backBlocked ? undefined : backTo}
            onClick={backTo || backBlocked ? undefined : onBack}
            variant="outline"
            disabled={backBlocked}
            className={navButton}
          >
            {backLabel}
          </Button>
          {continueHidden ? null : (
            <Button onClick={onContinue} disabled={continueDisabled} className={navButton}>
              {continueLabel}
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={onReset}
          disabled={resetDisabled}
          className={`${navButton} border-gold/40 text-muted hover:border-gold hover:text-ivory`}
        >
          {resetLabel}
        </Button>
      </div>
    </nav>
  );
}
