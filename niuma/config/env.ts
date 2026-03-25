export function resolveEnvVars<T>(obj: T): T {
  if (typeof obj === "string") {
    return obj.replace(/\$\{(\w+)(?::([^}]*))?\}/g, (_, varName, defaultValue) => {
      const value = process.env[varName];
      return value !== undefined ? value : (defaultValue ?? "");
    }) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveEnvVars(item)) as unknown as T;
  }
  
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, resolveEnvVars(v)])
    ) as unknown as T;
  }
  
  return obj;
}
