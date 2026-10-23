import Button from "../Button.jsx";

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
    <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
      <Button
        to={backBlocked ? undefined : backTo}
        onClick={backTo || backBlocked ? undefined : onBack}
        variant="outline"
        disabled={backBlocked}
      >
        {backLabel}
      </Button>
      {continueHidden ? null : (
        <Button onClick={onContinue} disabled={continueDisabled}>
          {continueLabel}
        </Button>
      )}
    </div>
  );
}
