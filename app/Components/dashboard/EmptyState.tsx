interface EmptyStateProps {
  onAdd: () => void
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="border-t border-b border-rule px-6 py-16 text-center">
      <p className="font-display text-3xl font-light italic text-ink-mid">
        The register is empty.
      </p>
      <p className="mt-2 font-mono text-[10px] tracking-widest uppercase text-rule">
        No applications on record
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 border border-stamp-red px-6 py-2.5 font-mono text-[10px] tracking-widest uppercase text-stamp-red transition-colors hover:bg-stamp-red hover:text-paper"
      >
        Add first entry
      </button>
    </div>
  )
}
