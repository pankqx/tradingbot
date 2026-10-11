import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md space-y-3 py-16">
      <h1 className="display text-[32px]">That page isn’t here</h1>
      <p className="text-[14.5px] text-ink-2">The instrument or signal may not exist in this demo universe. Search for a ticker with ⌘K, or head back to the overview.</p>
      <Link href="/" className="inline-block rounded-full bg-ink px-4 py-2 text-[13.5px] font-medium text-paper">Go to overview</Link>
    </div>
  );
}
