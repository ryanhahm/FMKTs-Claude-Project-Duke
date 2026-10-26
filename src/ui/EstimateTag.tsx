/** Small "≈ estimate" tag with an explanation on hover/focus (CLAUDE.md §5 data honesty). */
export function EstimateTag({ why }: { why: string }) {
  return (
    <span className="estimate-tag" tabIndex={0} title={why} aria-label={`Estimate: ${why}`}>
      ≈ estimate
    </span>
  );
}
