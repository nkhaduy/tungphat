type RobotsGroup = {
  agents: string[];
  rules: Array<{ type: "allow" | "disallow"; path: string }>;
};

function parseRobots(robots: string) {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | undefined;
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if ((field === "allow" || field === "disallow") && current) {
      current.rules.push({ type: field, path: value });
    }
  }
  return groups;
}

function ruleMatches(path: string, pattern: string) {
  const anchored = pattern.endsWith("$");
  const source = (anchored ? pattern.slice(0, -1) : pattern)
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`).test(path);
}

export function isUrlAllowedByRobots(robots: string, userAgent: string, urlValue: string) {
  const groups = parseRobots(robots);
  if (robots.trim() && groups.length === 0) return false;
  const agent = userAgent.toLowerCase();
  const specific = groups.filter((group) => group.agents.some((candidate) => candidate !== "*" && agent.includes(candidate)));
  const applicable = specific.length > 0 ? specific : groups.filter((group) => group.agents.includes("*"));
  const path = `${new URL(urlValue).pathname}${new URL(urlValue).search}`;
  const matches = applicable
    .flatMap((group) => group.rules)
    .filter((rule) => rule.path && ruleMatches(path, rule.path))
    .sort((left, right) => right.path.replace(/[*$]/g, "").length - left.path.replace(/[*$]/g, "").length || (left.type === "allow" ? -1 : 1));
  return matches[0]?.type !== "disallow";
}

export function assertRobotsAllowed(robots: string, userAgent: string, url: string) {
  if (!isUrlAllowedByRobots(robots, userAgent, url)) {
    throw new Error(`robots.txt không cho phép crawl: ${url}`);
  }
}
