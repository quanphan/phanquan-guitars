import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { applyScrollAction, resolveScrollAction } from "../utils/scrollRestoration.js";

const positions = new Map();

export default function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousPathnameRef = useRef(location.pathname);

  useLayoutEffect(() => {
    const key = location.key;
    return () => {
      positions.set(key, window.scrollY);
    };
  }, [location.key]);

  useLayoutEffect(() => {
    const pathnameChanged = previousPathnameRef.current !== location.pathname;
    previousPathnameRef.current = location.pathname;
    const html = document.documentElement;
    const previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    applyScrollAction(
      resolveScrollAction({
        navigationType,
        pathnameChanged,
        hash: location.hash,
        savedY: positions.get(location.key),
      }),
    );
    html.style.scrollBehavior = previousBehavior;
  }, [location.hash, location.key, location.pathname, navigationType]);

  return null;
}
