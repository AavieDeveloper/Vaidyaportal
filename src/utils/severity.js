/** Maps a raw severity string to the Badge component's tone prop. */
export function severityToTone(severity) {
  switch ((severity || "").toLowerCase()) {
    case "severe":
      return "severe";
    case "moderate":
      return "moderate";
    case "mild":
      return "mild";
    default:
      return "pending";
  }
}

export function statusToTone(status) {
  switch ((status || "").toLowerCase()) {
    case "signed":
      return "signed";
    default:
      return severityToTone(status);
  }
}
