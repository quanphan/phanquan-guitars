import { choiceSwatchCss } from "../../data/choiceSwatch.js";

export default function ChoiceSwatch({ option, className = "size-7 shrink-0 border border-white/20" }) {
  const style = choiceSwatchCss(option);
  return <span className={className} style={style || undefined} aria-hidden="true" />;
}
