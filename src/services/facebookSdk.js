let loading = null;

function ensureRoot() {
  if (document.getElementById("fb-root")) return;
  const root = document.createElement("div");
  root.id = "fb-root";
  document.body.insertBefore(root, document.body.firstChild);
}

export function loadFacebookSdk() {
  if (globalThis.FB?.Event && globalThis.FB?.XFBML) return Promise.resolve(globalThis.FB);
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const finish = () => {
      try {
        if (!globalThis.FB) throw new Error("FACEBOOK_SDK");
        if (typeof globalThis.FB.init === "function" && !globalThis.FB.__phanquanInit) {
          globalThis.FB.init({ xfbml: true, version: "v21.0" });
          globalThis.FB.__phanquanInit = true;
        }
        resolve(globalThis.FB);
      } catch (error) {
        loading = null;
        reject(error);
      }
    };

    const previous = globalThis.fbAsyncInit;
    globalThis.fbAsyncInit = function fbAsyncInit() {
      if (typeof previous === "function") previous();
      finish();
    };

    ensureRoot();
    const existing = document.getElementById("facebook-jssdk");
    if (existing && globalThis.FB) {
      finish();
      return;
    }
    if (existing) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => {
      loading = null;
      reject(new Error("FACEBOOK_SDK"));
    };
    document.body.appendChild(script);
  });

  return loading;
}

export function requestFacebookAudiblePlayback(player, { force = false } = {}) {
  if (!player) return false;
  if (!force && player.__phanquanAudioRequested) {
    return typeof player.isMuted !== "function" || player.isMuted() === false;
  }
  player.__phanquanAudioRequested = true;
  try {
    if (typeof player.unmute === "function") player.unmute();
  } catch {
    // Browser autoplay policy may reject audible playback.
  }
  try {
    if (typeof player.play === "function") player.play();
  } catch {
    // Native Facebook controls remain available.
  }
  try {
    return typeof player.isMuted !== "function" || player.isMuted() === false;
  } catch {
    return false;
  }
}
