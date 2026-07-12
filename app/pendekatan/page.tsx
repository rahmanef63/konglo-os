import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Eyebrow } from "@/frontend/shared";

export const metadata: Metadata = {
  title: "Sepuluh titik buta pemilik grup usaha — Catatan penasihat | Konglo OS",
  description:
    "Catatan seorang penasihat tentang sepuluh titik buta yang berulang di grup usaha keluarga Indonesia — bukan brosur, melainkan cara berpikir tentang celah antar entitas.",
};

const LEAKS = [
  {
    title: "Jaminan pribadi dan agunan silang yang tak pernah dijumlahkan",
    body: "Anda menandatangani personal guarantee dan menjaminkan aset yang sama untuk fasilitas di beberapa bank pada waktu yang berbeda, tapi tak ada satu tempat pun yang pernah menjumlahkan total yang Anda tanggung secara pribadi. Karena tiap fasilitas diteken terpisah, gagal bayar di satu entitas bisa memicu cross-default beruntun sebelum siapa pun sempat melihat rantainya.",
    tag: "Properti & Aset",
  },
  {
    title: "Anda membaca ringkasan, bukan angkanya",
    body: "Setiap angka yang naik ke meja Anda sudah lebih dulu disunting oleh orang yang melaporkannya — kabar buruk diberi 'konteks', yang janggal ditunda. Ringkasannya kompeten dan masuk akal, jadi tak pernah ada pemicu untuk meragukannya; padahal peta grup di kepala Anda adalah kumpulan ringkasan yang berkepentingan.",
    tag: "Studio Data",
  },
  {
    title: "Kas menganggur di satu entitas, bunga bank dibayar di entitas lain",
    body: "Kas menumpuk nyaris tanpa imbal hasil di rekening beberapa anak usaha, sementara entitas lain menarik kredit modal kerja berbunga — grup membayar bunga atas uang yang sebenarnya sudah dimiliki. Kas dikelola per entitas dan tak pernah disapu, jadi laporan menampilkan saldo tiap rekening, bukan posisi kas bersih grup terhadap utang jangka pendeknya.",
    tag: "Kekayaan & Kas",
  },
  {
    title: "Satu tangan menjalankan hampir seluruh grup",
    body: "Otoritas tanda tangan, token bank, dan akses sistem menumpuk pada satu orang kepercayaan di hampir semua entitas — sehingga bila ia berhalangan, operasi seluruh grup berhenti serentak, bukan satu PT saja. Tiap pemberian wewenang terasa wajar satu per satu, dan keandalannya terbaca sebagai ketahanan, bukan sebagai titik tunggal kegagalan.",
    tag: "Keamanan & Staf",
  },
  {
    title: "Harga transfer antar-PT: laba yang digeser, pajak yang menunggu",
    body: "Penjualan antar entitas dengan harga yang tidak wajar menggeser laba ke tempat yang nyaman, sekaligus menumpuk liabilitas pajak laten karena tiap PT adalah wajib pajak terpisah di mata otoritas. Terasa seperti sekadar memindahkan uang di dalam grup sendiri, jadi risiko dokumentasi transfer pricing tak pernah masuk radar sampai pemeriksaan datang.",
    tag: "Portofolio Bisnis",
  },
  {
    title: "Waris menerima kepemilikan, bukan kemampuan menjalankan",
    body: "Rencana suksesi memetakan bagian saham tiap ahli waris, tapi kesiapan menjalankan tiap lini — F&B, properti, trading — tak pernah dipetakan per entitas. Kesiapan diringkas jadi satu asumsi 'anak sudah siap', padahal ia bisa matang di satu sektor dan kosong di sektor lain, sehingga saham berpindah mulus sementara kendali operasional tidak ikut.",
    tag: "Keluarga & Warisan",
  },
  {
    title: "Margin sejati tiap entitas, tenggelam dalam angka konsolidasi",
    body: "Bottom line grup terlihat sehat karena beberapa entitas sapi perah menutupi yang rugi struktural, dan harga transfer internal menggeser laba antar entitas. Anda menilai grup dari laba konsolidasi yang hijau, bukan dari kontribusi kas riil tiap entitas setelah beban modalnya sendiri — jadi Anda tak pernah benar-benar tahu siapa yang menciptakan nilai dan siapa yang menumpang.",
    tag: "Portofolio Bisnis",
  },
  {
    title: "Struktur di akta tak lagi cocok dengan kenyataan",
    body: "Saham pinjam-nama, kuasa direksi lama, dan akta yang mendahului struktur sekarang tak pernah direkonsiliasi sebagai satu set lintas PT. Tiap entitas diurus notaris terpisah dan ad hoc, jadi tak seorang pun pernah melihat seluruh kerangka hukum grup sekaligus — dan pengaturan 'sementara' berubah jadi sengketa tepat saat suksesi atau uji tuntas menyorotnya.",
    tag: "Keluarga & Warisan",
  },
  {
    title: "Relasi VIP hidup di satu kepala, bukan di institusi",
    body: "Akses ke regulator, bank, dan mitra kunci dibangun personal oleh satu orang dan hanya tersimpan di ponsel serta ingatannya. Daftar kontak yang penuh terasa seperti jaringan yang aman, padahal banyak relasi paling kritis hanya punya satu jembatan manusia ke dalam grup — dan bila ia pergi, kepercayaan serta jalur cepat itu ikut keluar pintu.",
    tag: "Relasi & Jaringan",
  },
  {
    title: "Keputusan yang diam-diam menunggu meja Anda",
    body: "Keputusan lintas entitas di atas ambang tertentu semua bermuara ke Anda, karena hanya Anda yang punya gambaran utuh. Anda melihat keputusan yang Anda ambil, tak pernah antrean yang menunggu — sehingga biaya dari yang mengantre, peluang yang keburu kedaluwarsa, tak pernah muncul sebagai satu baris pun.",
    tag: "Keamanan & Staf",
  },
];

export default function Page() {
  return (
    <div className="bg-aurora min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gold/15 text-gold">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold">Konglo OS</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-28">
        {/* Intro */}
        <section className="pt-10 sm:pt-16">
          <Eyebrow>Catatan penasihat — untuk pemilik grup usaha</Eyebrow>
          <h1 className="font-display mt-5 text-balance text-4xl font-bold leading-[1.08] sm:text-5xl">
            Sepuluh titik buta yang jarang disadari{" "}
            <span className="text-gradient-gold">pemilik grup usaha</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Ini bukan brosur. Ini catatan seorang penasihat tentang pola yang berulang di banyak
            grup usaha keluarga di Indonesia — bukan karena pemiliknya lengah, justru karena ia
            mengelola begitu banyak entitas sekaligus. Sepuluh hal berikut jarang muncul di laporan
            mana pun; masing-masing bersembunyi persis di celah antar entitas, di tempat yang tak
            pernah ditugaskan kepada siapa pun untuk menengok.
          </p>
        </section>

        {/* Ledger */}
        <ol className="mt-14 border-t border-border">
          {LEAKS.map((leak, i) => (
            <li
              key={leak.title}
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 border-b border-border py-8 sm:gap-x-8"
            >
              <span className="font-display text-3xl font-semibold leading-none text-gold/70 tabular-nums sm:text-4xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold leading-snug sm:text-2xl">
                  {leak.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{leak.body}</p>
                <span className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {leak.tag}
                </span>
              </div>
            </li>
          ))}
        </ol>

        {/* Close */}
        <section className="glass mt-16 rounded-2xl border border-border p-8 sm:p-10">
          <Eyebrow>Benang merahnya satu: keterlihatan</Eyebrow>
          <p className="mt-5 text-lg leading-relaxed text-foreground">
            Kalau Anda perhatikan, kesepuluhnya berbagi satu akar — bukan uang yang hilang atau
            orang yang keliru, melainkan hal yang benar tak pernah berada dalam satu pandangan pada
            saat yang sama. Yang dibutuhkan bukan laporan tambahan, melainkan satu tempat di mana
            posisi grup — kas, aset, wewenang, relasi, rencana — bisa Anda tanyai langsung, kapan
            pun. Konglo OS dibangun untuk itu, diam-diam: bukan menggantikan penilaian Anda, hanya
            memastikan Anda melihat seluruh papan sebelum menilai.
          </p>
        </section>

        {/* Footer CTA */}
        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Lihat sendiri di grup Anda
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Kembali ke beranda
          </Link>
        </div>
      </main>
    </div>
  );
}
