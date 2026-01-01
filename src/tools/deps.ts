const CRATE_HINTS: Array<{ needle: RegExp; crate: string; reason: string }> = [
  { needle: /\bserde::|\bSerialize\b|\bDeserialize\b/, crate: "serde", reason: "serde types/traits detected" },
  { needle: /\bserde_json::/, crate: "serde_json", reason: "serde_json usage detected" },
  { needle: /\btokio::/, crate: "tokio", reason: "tokio runtime usage detected" },
  { needle: /\banyhow::/, crate: "anyhow", reason: "anyhow usage detected" },
  { needle: /\bthiserror::/, crate: "thiserror", reason: "thiserror usage detected" },
  { needle: /\btracing::|\btracing_subscriber::/, crate: "tracing", reason: "tracing usage detected" },
  { needle: /\blog::/, crate: "log", reason: "log facade usage detected" },
  { needle: /\bregex::/, crate: "regex", reason: "regex usage detected" },
  { needle: /\bclap::|\bderive\\(Parser\\)/, crate: "clap", reason: "clap usage detected" },
  { needle: /\breqwest::/, crate: "reqwest", reason: "reqwest usage detected" },
];

export function suggestDepsFromText(text: string) {
  const suggestions: Array<{ crate: string; reason: string }> = [];
  for (const hint of CRATE_HINTS) {
    if (hint.needle.test(text)) suggestions.push({ crate: hint.crate, reason: hint.reason });
  }
  const dedup = new Map<string, { crate: string; reason: string }>();
  for (const s of suggestions) if (!dedup.has(s.crate)) dedup.set(s.crate, s);
  return Array.from(dedup.values());
}

