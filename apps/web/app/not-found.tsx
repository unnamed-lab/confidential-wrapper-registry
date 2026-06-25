import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="mt-2 text-sm text-white/55">That route doesn&apos;t exist.</p>
      <Link href="/" className="mt-4 inline-block rounded-md bg-white/10 px-4 py-2 text-sm ring-1 ring-white/15 hover:bg-white/15">
        Back to Explorer
      </Link>
    </div>
  );
}
