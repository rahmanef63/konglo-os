import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Halaman tidak ditemukan.</p>
        <Link href="/" className="mt-4 inline-block text-[color:var(--color-gold)]">
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
