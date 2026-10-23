export function errorText(t, namespace, code, fallbackKey = "errors.failure") {
  if (!code) return t(`${namespace}.${fallbackKey}`);
  const key = `${namespace}.errors.${code}`;
  const value = t(key);
  return value === key ? t(`${namespace}.${fallbackKey}`) : value;
}
