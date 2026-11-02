export function countCompleteSentences(value: string) {
  const matches = value
    .trim()
    .match(/[^.!?]+[.!?]+(?:["'”’\)\]]+)?(?=\s|$)/g) ?? [];
  return matches.filter((sentence) => {
    const words = sentence
      .replace(/[.!?"'”’\)\]]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return words.length >= 2;
  }).length;
}

export function applicationResponseIssue(value: string, minimumSentences = 3) {
  if (value.trim().length < 20) {
    return `Write at least ${minimumSentences} complete sentences that explain your thinking.`;
  }
  const sentenceCount = countCompleteSentences(value);
  if (sentenceCount < minimumSentences) {
    const remaining = minimumSentences - sentenceCount;
    return `Add ${remaining} more complete ${remaining === 1 ? "sentence" : "sentences"}. End each sentence with a period, question mark, or exclamation point.`;
  }
  return "";
}
