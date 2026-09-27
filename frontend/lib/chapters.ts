/**
 * Split a campaign title into two balanced halves for the Chapters home:
 * the first sits above the photo, the second below it. "Escape the noise" → ["Escape", "the noise."]
 */
export function splitChapterTitle(title: string): [string, string] {
  const words = title.trim().replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return ["", ""];
  }

  if (words.length === 1) {
    return [words[0], ""];
  }

  let best = 1;
  let bestDiff = Infinity;
  for (let index = 1; index < words.length; index += 1) {
    const diff = Math.abs(words.slice(0, index).join(" ").length - words.slice(index).join(" ").length);
    if (diff < bestDiff) {
      best = index;
      bestDiff = diff;
    }
  }

  return [words.slice(0, best).join(" "), `${words.slice(best).join(" ")}.`];
}
