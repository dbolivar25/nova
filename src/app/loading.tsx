import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-50 via-slate-100 to-white">
      <Image
        src="/nova-logo.svg"
        alt="Nova"
        width={96}
        height={96}
        priority
        className="h-24 w-24"
      />
      <p className="text-sm font-medium tracking-[0.3em] text-slate-500">JOURNALING REIMAGINED</p>
    </div>
  );
}
