import { useEffect, useState } from "react";
import {
  CUSTOM_BUILD_DRAFT_CHANGE_EVENT,
  readCustomBuildDraft,
} from "../data/customBuildDraft.js";
import { isResumableCustomBuildDraft } from "../data/customBuildDraftResume.js";

export default function useResumableCustomBuildDraft() {
  const [resumable, setResumable] = useState(() =>
    isResumableCustomBuildDraft(readCustomBuildDraft()),
  );

  useEffect(() => {
    function sync() {
      setResumable(isResumableCustomBuildDraft(readCustomBuildDraft()));
    }
    window.addEventListener(CUSTOM_BUILD_DRAFT_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CUSTOM_BUILD_DRAFT_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return resumable;
}
