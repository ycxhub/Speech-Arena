/**
 * Structured JSON logger for server-side logging.
 * Never log: API keys, passwords, full emails (truncate).
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

function truncateEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  const truncated = local.length >= 3 ? local.slice(0, 3) + "***" : "***";
  return `${truncated}@${domain}`;
}

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const sensitive = ["api_key", "password", "token", "secret", "key"];
  for (const [k, v] of Object.entries(obj)) {
    if (sensitive.some((s) => k.toLowerCase().includes(s))) continue;
    if (typeof v === "string" && v.includes("@") && v.includes(".")) {
      out[k] = truncateEmail(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && sanitize(context)),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  error: (message: string, context?: Record<string, unknown>) =>
    log("error", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
  debug: (message: string, context?: Record<string, unknown>) =>
    log("debug", message, context),
};
