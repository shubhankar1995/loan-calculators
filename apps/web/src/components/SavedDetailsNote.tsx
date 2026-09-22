interface Props {
  onReset: () => void
}

/** Tells people their figures are kept on this device, and offers a way out of that. */
export function SavedDetailsNote({ onReset }: Props) {
  return (
    <div className="saved-note">
      <p className="saved-note__text">
        Saved on this device, so your figures are here next time.
      </p>
      <button type="button" className="saved-note__reset" onClick={onReset}>
        Reset to defaults
      </button>
    </div>
  )
}
