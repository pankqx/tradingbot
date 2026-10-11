"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="max-w-md space-y-3 py-16" role="alert">
      <h1 className="display text-[28px]">This screen failed to load</h1>
      <p className="text-[14.5px] text-ink-2">{error.message || "An unexpected error occurred."} Try again; if it keeps happening, reload the page.</p>
      <button onClick={reset} className="rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper">Try again</button>
    </div>
  );
}
