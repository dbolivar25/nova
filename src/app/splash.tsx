"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function Splash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShow(false), 50);

    return () => clearTimeout(timeout);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div
      id="nova-splash"
      aria-hidden="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-white"
    >
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/nova-logo.svg"
          alt="Nova"
          width={96}
          height={96}
          priority
          className="h-24 w-24"
        />
        <p className="text-sm font-medium tracking-[0.3em] text-slate-500">
          JOURNALING REIMAGINED
        </p>
      </div>
    </div>
  );
}
