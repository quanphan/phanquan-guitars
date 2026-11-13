import Button from "../Button.jsx";

const compactButton =
  "min-h-10 shrink-0 flex-1 px-4 py-2 sm:flex-none sm:min-w-[9.5rem] sm:px-5 sm:py-2.5";

export default function StepNav({
  onBack,
  onContinue,
  backTo,
  continueDisabled,
  continueHidden,
  backDisabled,
  backLabel,
  continueLabel,
}) {
  const backBlocked = Boolean(backDisabled);
  return (
    <nav className="border-b border-gold/20 py-2" aria-label="Wizard">
      <div className="flex flex-nowrap items-center justify-between gap-3">
        <Button
          to={backBlocked ? undefined : backTo}
          onClick={backTo || backBlocked ? undefined : onBack}
          variant="outline"
          disabled={backBlocked}
          className={compactButton}
        >
          {backLabel}
        </Button>
        {continueHidden ? (
          <span className="hidden sm:block sm:min-w-[9.5rem]" aria-hidden="true" />
        ) : (
          <Button onClick={onContinue} disabled={continueDisabled} className={compactButton}>
            {continueLabel}
          </Button>
        )}
      </div>
    </nav>
  );
}
