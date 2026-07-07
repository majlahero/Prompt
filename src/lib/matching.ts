function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    // Giữ lại chữ cái Unicode (tiếng Việt), số, khoảng trắng.
    // \p{L} = chữ cái mọi ngôn ngữ, \p{N} = số. Flag 'u' bật Unicode.
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  if (normalizedUser === normalizedCorrect) return true;
  if (normalizedUser.includes(normalizedCorrect)) return true;
  if (normalizedCorrect.includes(normalizedUser)) return true;

  return false;
}
