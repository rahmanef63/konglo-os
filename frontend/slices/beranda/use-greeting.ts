"use client";

import { useEffect, useState } from "react";
import { formatDateID } from "@/lib/format";
import { type Role } from "@/lib/roles";
import { useHonorific } from "@/frontend/shared/use-honorific";

// Warm greeting + today's date (id-ID) for the launcher eyebrow. Date.now() is
// impure → compute after mount (react-hooks/purity) so SSR/first paint stay
// stable ("Selamat datang", no date), then fill in on the client. No drift.
//
// The PRINCIPAL is addressed by honorific ("Selamat pagi, Tuan"); aides (cfo/staf)
// get the plain greeting — the OS serves the owner, not its staff.
export function useGreeting(role?: Role): { greeting: string; date: string } {
  const honorific = useHonorific();
  const [base, setBase] = useState({ greeting: "Selamat datang", date: "" });
  useEffect(() => {
    const now = Date.now();
    const h = new Date(now).getHours();
    const greeting =
      h < 11
        ? "Selamat pagi"
        : h < 15
          ? "Selamat siang"
          : h < 19
            ? "Selamat sore"
            : "Selamat malam";
    setBase({ greeting, date: formatDateID(now) });
  }, []);
  return {
    greeting: role === "principal" ? `${base.greeting}, ${honorific}` : base.greeting,
    date: base.date,
  };
}
