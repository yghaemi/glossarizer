// API JSON stores TeX as "\\(63.2\\%\\)" which becomes "\(63.2\%\)" after
// JSON.parse. If the string is double-encoded in JS, collapse until stable.
export function unescapeLatex(str: unknown): string {
  if (str == null) return "";
  let s = String(str);
  let prev: string;

  do {
    prev = s;
    s = s
      .replace(/\\\\\(/g, "\\(")
      .replace(/\\\\\)/g, "\\)")
      .replace(/\\\\\[/g, "\\[")
      .replace(/\\\\\]/g, "\\]")
      .replace(/\\\\%/g, "\\%")
      .replace(/\\\\#/g, "\\#")
      .replace(/\\\\&/g, "\\&")
      .replace(/\\\\_/g, "\\_")
      .replace(/\\\$/g, "$");
  } while (s !== prev);

  // If payload has "\(63.2%\)" (no backslash before %), TeX treats % as a
  // comment and swallows the closing "\)" — MathJax shows raw text or nothing.
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) =>
    "\\(" +
    inner.replace(/(^|[^\\])%/g, (_mm: string, prefix: string) => prefix + "\\%") +
    "\\)",
  );

  return s;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Ranges [start, end) occupied by LaTeX delimiters ($$...$$, \[...\], \(...\)).
// Matches inside these ranges must not be glossarized — the text is math, not prose.
export function getLatexRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const re = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}

export function inLatexRange(
  index: number,
  len: number,
  ranges: Array<[number, number]>,
): boolean {
  const end = index + len;
  return ranges.some(([start, rangeEnd]) => index < rangeEnd && end > start);
}
