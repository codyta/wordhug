// Astro hands children to React as rendered HTML, so the text comes in as a prop
// and React's own WordHug reads the brackets, exactly as in a React app.
import { WordHug } from "wordhug/react";

export default function ReactDemo({ text, className }: { text: string; className?: string }) {
  return <WordHug className={className}>{text}</WordHug>;
}
