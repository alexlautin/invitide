import Link from 'next/link';

export default function DemoRequired() {
  return (
    <div className="flex flex-col items-center gap-6 p-8 text-center text-[#E4DDC4] font-mono">
      <p className="max-w-sm">Accounts are turned off for this portfolio version. Try the full app in demo mode.</p>
      <Link
        href="/demo"
        className="border-[4px] text-[18px] border-[#E4DDC4] bg-[#E4DDC4] text-[#1F1F1F] px-4 py-2 uppercase hover:bg-transparent hover:text-[#E4DDC4] transition duration-300"
      >
        Try the demo
      </Link>
    </div>
  );
}
