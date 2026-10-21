/** Split text into short word groups (2–3 words, breaking after punctuation) for the staggered reveal. */
export function wordGroups(text: string, maxWords = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= maxWords || /[.,;:!?]$/.test(w)) {
      groups.push(cur.join(' '));
      cur = [];
    }
  }
  if (cur.length) groups.push(cur.join(' '));
  return groups;
}

/** Large serif-italic narrative caption over the scene; word groups fade/slide in 40ms apart. */
export function Caption({ text, className = '' }: { text: string; className?: string }) {
  return (
    <p key={text} className={`caption ${className}`} aria-live="polite">
      {wordGroups(text).map((g, i) => (
        <span key={i} className="caption-group" style={{ animationDelay: `${i * 40}ms` }}>
          {g}{' '}
        </span>
      ))}
    </p>
  );
}
