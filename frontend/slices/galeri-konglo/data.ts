import type { KongloGroup } from "./types";

// Snapshot date shown in the disclaimer banner + detail footers. Bump when the
// dataset is re-researched.
export const KONGLO_ASOF = "13 Juli 2026";

// GENERATED from the konglo-research workflow (2026-07-13) — public web
// sources only (each group lists them), one legal-review pass applied (e.g.
// Bakrie net worth removed: only figure found was Forbes 2007 — stale).
// Every entity carries a stable id (p-*/c-*) for the future relation graph.
// Regenerate via scratchpad/build_data.py over a fresh research run.
export const KONGLO_GROUPS: KongloGroup[] = [
  {
    "id": "salim",
    "name": "Salim Group",
    "founded": 1972,
    "hq": "Jakarta",
    "summary": "Salim Group adalah salah satu konglomerasi terbesar di Indonesia, berkantor pusat di Jakarta, didirikan oleh Sudono Salim pada 1972 dan kini dipimpin oleh Anthoni Salim. Lini bisnis utamanya mencakup pangan (Indofood/Indomie), ritel (Indomaret), otomotif (Indomobil), serta investasi regional melalui First Pacific yang tercatat di Bursa Hong Kong.",
    "sectors": [
      "Konsumen & pangan",
      "Ritel & perdagangan",
      "Manufaktur & otomotif",
      "Telekomunikasi",
      "Energi & pertambangan"
    ],
    "people": [
      {
        "id": "p-sudono-salim",
        "name": "Sudono Salim (Liem Sioe Liong)",
        "role": "Pendiri"
      },
      {
        "id": "p-anthoni-salim",
        "name": "Anthoni Salim",
        "role": "Chairman & CEO Salim Group; Presiden Direktur Indofood; Chairman First Pacific"
      },
      {
        "id": "p-axton-salim",
        "name": "Axton Salim",
        "role": "Direktur Indofood & ICBP (penerus generasi ketiga, dilaporkan publik)"
      }
    ],
    "companies": [
      {
        "id": "c-pt-indofood-sukses-makmur-tbk",
        "name": "PT Indofood Sukses Makmur Tbk",
        "ticker": "INDF",
        "sector": "Pangan & agribisnis"
      },
      {
        "id": "c-pt-indofood-cbp-sukses-makmur-tbk",
        "name": "PT Indofood CBP Sukses Makmur Tbk",
        "ticker": "ICBP",
        "sector": "Makanan bermerek (Indomie)"
      },
      {
        "id": "c-first-pacific-company-limited",
        "name": "First Pacific Company Limited",
        "sector": "Investasi regional (tercatat di Bursa Hong Kong)"
      },
      {
        "id": "c-indomaret",
        "name": "Indomaret (PT Indomarco Prismatama)",
        "sector": "Ritel minimarket"
      },
      {
        "id": "c-pt-indoritel-makmur-internasional-tbk",
        "name": "PT Indoritel Makmur Internasional Tbk",
        "ticker": "DNET",
        "sector": "Ritel & investasi konsumer"
      },
      {
        "id": "c-pt-indomobil-sukses-internasional-tbk",
        "name": "PT Indomobil Sukses Internasional Tbk",
        "ticker": "IMAS",
        "sector": "Otomotif"
      }
    ],
    "netWorth": {
      "valueBUSD": 13.6,
      "holder": "Anthoni Salim & keluarga",
      "source": "Forbes (Indonesia's 50 Richest)",
      "year": 2025
    },
    "notable": [
      "Indofood melalui merek Indomie termasuk produsen mi instan terbesar di dunia.",
      "Jaringan Indomaret mengoperasikan lebih dari 24.000 gerai di Indonesia per pertengahan 2025.",
      "First Pacific, kendaraan investasi grup yang tercatat di Bursa Hong Kong sejak dekade 1980-an, memegang saham Indofood dan PLDT (Filipina)."
    ],
    "sources": [
      {
        "title": "Salim Group — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Salim_Group"
      },
      {
        "title": "Anthoni Salim & family — Forbes Profile",
        "url": "https://www.forbes.com/profile/anthoni-salim/"
      },
      {
        "title": "Wealth of Indonesia's 50 Richest Rises 16% — Forbes (10 Des 2025)",
        "url": "https://www.forbes.com/sites/forbespr/2025/12/10/wealth-of-indonesias-50-richest-on-forbes-list-rises-by-16-to-over-us300-billion/"
      },
      {
        "title": "Siapa Pemilik Indomaret, Minimarket yang Gerainya Sampai 24.000? — Kompas",
        "url": "https://money.kompas.com/read/2025/11/22/165621726/siapa-pemilik-indomaret-minimarket-yang-gerainya-sampai-24000"
      },
      {
        "title": "Kiprah Axton Salim Penerus Usaha Indofood — Tempo",
        "url": "https://www.tempo.co/ekonomi/kiprah-axton-salim-penerus-usaha-indofood-ini-profil-cucu-liem-sioe-liong-214685"
      }
    ]
  },
  {
    "id": "djarum",
    "name": "Djarum Group",
    "founded": 1951,
    "hq": "Kudus",
    "summary": "Djarum Group adalah grup konglomerasi keluarga Hartono yang berawal dari produsen rokok kretek PT Djarum, didirikan Oei Wie Gwan di Kudus, Jawa Tengah, pada 1951. Grup ini kemudian berdiversifikasi ke perbankan (BCA), elektronik (Polytron), e-commerce (Blibli), infrastruktur menara telekomunikasi, serta properti.",
    "sectors": [
      "Rokok kretek",
      "Perbankan & keuangan",
      "Manufaktur & otomotif",
      "Ritel & perdagangan",
      "Telekomunikasi",
      "Properti"
    ],
    "people": [
      {
        "id": "p-oei-wie-gwan",
        "name": "Oei Wie Gwan",
        "role": "Pendiri"
      },
      {
        "id": "p-robert-budi-hartono",
        "name": "Robert Budi Hartono",
        "role": "Pemilik bersama"
      },
      {
        "id": "p-michael-bambang-hartono",
        "name": "Michael Bambang Hartono",
        "role": "Pemilik bersama"
      },
      {
        "id": "p-victor-rachmat-hartono",
        "name": "Victor Rachmat Hartono",
        "role": "COO PT Djarum"
      },
      {
        "id": "p-armand-wahyudi-hartono",
        "name": "Armand Wahyudi Hartono",
        "role": "Wakil Presiden Direktur BCA"
      }
    ],
    "companies": [
      {
        "id": "c-pt-djarum",
        "name": "PT Djarum",
        "sector": "Rokok kretek"
      },
      {
        "id": "c-pt-bank-central-asia-tbk",
        "name": "PT Bank Central Asia Tbk",
        "ticker": "BBCA",
        "sector": "Perbankan"
      },
      {
        "id": "c-polytron",
        "name": "Polytron",
        "sector": "Elektronik & kendaraan listrik"
      },
      {
        "id": "c-pt-global-digital-niaga-tbk",
        "name": "PT Global Digital Niaga Tbk (Blibli)",
        "ticker": "BELI",
        "sector": "E-commerce"
      },
      {
        "id": "c-pt-sarana-menara-nusantara-tbk",
        "name": "PT Sarana Menara Nusantara Tbk",
        "ticker": "TOWR",
        "sector": "Infrastruktur menara telekomunikasi"
      },
      {
        "id": "c-grand-indonesia",
        "name": "Grand Indonesia",
        "sector": "Properti"
      }
    ],
    "netWorth": {
      "valueBUSD": 43.8,
      "holder": "R. Budi & Michael Hartono (keluarga Hartono)",
      "source": "Forbes Indonesia's 50 Richest",
      "year": 2025
    },
    "notable": [
      "Keluarga Hartono menempati peringkat pertama daftar 50 orang terkaya Indonesia versi Forbes selama lebih dari satu dekade.",
      "Grup menjadi pemegang saham pengendali Bank Central Asia (BBCA), bank swasta terbesar di Indonesia, setelah krisis keuangan Asia 1997-1998.",
      "Michael Bambang Hartono wafat pada Maret 2026; PT Djarum dijalankan generasi berikutnya keluarga Hartono, antara lain Victor Hartono."
    ],
    "sources": [
      {
        "title": "Djarum - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Djarum"
      },
      {
        "title": "Forbes: Wealth Of Indonesia's 50 Richest On Forbes List Rises By 16% To Over US$300 Billion (Dec 2025)",
        "url": "https://www.forbes.com/sites/forbespr/2025/12/10/wealth-of-indonesias-50-richest-on-forbes-list-rises-by-16-to-over-us300-billion/"
      },
      {
        "title": "Forbes profile: R. Budi & Michael Hartono",
        "url": "https://www.forbes.com/profile/r-budi-michael-hartono/"
      },
      {
        "title": "BCA press release: OJK menyetujui pengangkatan Armand W. Hartono sebagai Wakil Presiden Direktur BCA",
        "url": "https://www.bca.co.id/en/tentang-bca/media-riset/pressroom/siaran-pers/2022/01/24/03/47/ojk-menyetujui-pengangkatan-armand-w-hartono-sebagai-wakil-presiden-direktur-bca"
      },
      {
        "title": "Fortune: Indonesia's richest man, tobacco tycoon Michael Bambang Hartono, dies at 86",
        "url": "https://fortune.com/2026/03/19/indonesias-richest-man-tobacco-tycoon-michael-bambang-hartono-dies-at-86/"
      }
    ]
  },
  {
    "id": "sinar-mas",
    "name": "Sinar Mas Group",
    "founded": 1938,
    "hq": "Jakarta",
    "summary": "Sinar Mas adalah salah satu grup konglomerasi terbesar di Indonesia, didirikan oleh Eka Tjipta Widjaja pada 1938 dan kini dikelola generasi kedua dan ketiga keluarga Widjaja. Bisnisnya mencakup pulp & kertas (Asia Pulp & Paper), properti (Sinar Mas Land), agribisnis, jasa keuangan, telekomunikasi, serta energi dan infrastruktur.",
    "sectors": [
      "Pulp & kertas",
      "Properti",
      "Konsumen & pangan",
      "Perbankan & keuangan",
      "Telekomunikasi",
      "Energi & pertambangan"
    ],
    "people": [
      {
        "id": "p-eka-tjipta-widjaja",
        "name": "Eka Tjipta Widjaja",
        "role": "Pendiri"
      },
      {
        "id": "p-teguh-ganda-widjaja",
        "name": "Teguh Ganda Widjaja",
        "role": "Chairman (Sinar Mas / Asia Pulp & Paper)"
      },
      {
        "id": "p-franky-oesman-widjaja",
        "name": "Franky Oesman Widjaja",
        "role": "Chairman & CEO Golden Agri-Resources"
      },
      {
        "id": "p-michael-widjaja",
        "name": "Michael Widjaja",
        "role": "Group CEO Sinar Mas Land"
      },
      {
        "id": "p-fuganto-widjaja",
        "name": "Fuganto Widjaja",
        "role": "Group CEO Golden Energy and Resources"
      }
    ],
    "companies": [
      {
        "id": "c-asia-pulp-paper",
        "name": "Asia Pulp & Paper (APP Sinar Mas)",
        "sector": "Pulp & Kertas"
      },
      {
        "id": "c-pt-indah-kiat-pulp-paper-tbk",
        "name": "PT Indah Kiat Pulp & Paper Tbk",
        "ticker": "INKP",
        "sector": "Pulp & Kertas"
      },
      {
        "id": "c-sinar-mas-land",
        "name": "Sinar Mas Land (PT Bumi Serpong Damai Tbk)",
        "ticker": "BSDE",
        "sector": "Properti"
      },
      {
        "id": "c-pt-smart-tbk",
        "name": "PT SMART Tbk",
        "ticker": "SMAR",
        "sector": "Agribisnis (kelapa sawit)"
      },
      {
        "id": "c-pt-dian-swastatika-sentosa-tbk",
        "name": "PT Dian Swastatika Sentosa Tbk",
        "ticker": "DSSA",
        "sector": "Energi & Infrastruktur"
      },
      {
        "id": "c-smartfren",
        "name": "Smartfren (merger menjadi XLSmart, 2025)",
        "ticker": "EXCL",
        "sector": "Telekomunikasi"
      }
    ],
    "netWorth": {
      "valueBUSD": 28.3,
      "holder": "keluarga Widjaja",
      "source": "Forbes Indonesia's 50 Richest",
      "year": 2025
    },
    "notable": [
      "Berawal dari usaha dagang kecil di Makassar pada 1938, kini menjadi salah satu konglomerasi terbesar di Indonesia dengan enam pilar bisnis.",
      "Smartfren resmi merger dengan XL Axiata membentuk XLSmart (IDX: EXCL) pada April 2025, dengan Sinar Mas sebagai pemegang saham pengendali bersama Axiata.",
      "Keluarga Widjaja menempati peringkat ke-3 daftar 50 orang terkaya Indonesia versi Forbes 2025 dengan kekayaan US$28,3 miliar."
    ],
    "sources": [
      {
        "title": "Sinar Mas — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Sinar_Mas"
      },
      {
        "title": "Forbes: Indonesia's 50 Richest 2025",
        "url": "https://www.forbes.com/sites/janeho/2025/12/10/indonesias-50-richest-2025-wealth-crosses-300-billion-amid-stock-market-frenzy-data-center-billionaires-climb-into-the-top-10/"
      },
      {
        "title": "Forbes: Widjaja family profile",
        "url": "https://www.forbes.com/profile/widjaja/"
      },
      {
        "title": "Axiata: XL Axiata–Smartfren merger approved (XLSmart)",
        "url": "https://www.axiata.com/media/news/2025/axiata-shareholders-approve-proposed-xl-axiata-smartfren-merger"
      },
      {
        "title": "IDNFinancials: XL Axiata and Smartfren now become XLSmart",
        "url": "https://www.idnfinancials.com/news/53422/xl-axiata-and-smartfren-now-become-xlsmart"
      }
    ]
  },
  {
    "id": "barito-pacific",
    "name": "Barito Pacific Group",
    "founded": 1979,
    "hq": "Jakarta",
    "summary": "Grup usaha yang didirikan Prajogo Pangestu di Jakarta pada 1979 sebagai perusahaan pengolahan kayu, dan kini berfokus pada petrokimia serta energi melalui holding tercatat PT Barito Pacific Tbk (BRPT). Entitas tercatat utamanya meliputi Chandra Asri Pacific (TPIA), Barito Renewables Energy (BREN), dan Petrindo Jaya Kreasi (CUAN).",
    "sectors": [
      "Energi & pertambangan"
    ],
    "people": [
      {
        "id": "p-prajogo-pangestu",
        "name": "Prajogo Pangestu",
        "role": "Pendiri & Presiden Komisaris"
      },
      {
        "id": "p-agus-salim-pangestu",
        "name": "Agus Salim Pangestu",
        "role": "Presiden Direktur"
      }
    ],
    "companies": [
      {
        "id": "c-pt-barito-pacific-tbk",
        "name": "PT Barito Pacific Tbk",
        "ticker": "BRPT",
        "sector": "Holding energi & petrokimia"
      },
      {
        "id": "c-pt-chandra-asri-pacific-tbk",
        "name": "PT Chandra Asri Pacific Tbk",
        "ticker": "TPIA",
        "sector": "Petrokimia & infrastruktur"
      },
      {
        "id": "c-pt-barito-renewables-energy-tbk",
        "name": "PT Barito Renewables Energy Tbk",
        "ticker": "BREN",
        "sector": "Energi terbarukan (panas bumi)"
      },
      {
        "id": "c-pt-petrindo-jaya-kreasi-tbk",
        "name": "PT Petrindo Jaya Kreasi Tbk",
        "ticker": "CUAN",
        "sector": "Pertambangan batu bara"
      },
      {
        "id": "c-star-energy-geothermal",
        "name": "Star Energy Geothermal",
        "sector": "Pembangkit listrik panas bumi (anak usaha BREN)"
      }
    ],
    "netWorth": {
      "valueBUSD": 15.4,
      "holder": "Prajogo Pangestu",
      "source": "Forbes Real-Time Billionaires",
      "year": 2026
    },
    "notable": [
      "Berawal dari industri pengolahan kayu sebagai Barito Pacific Timber, lalu berganti nama menjadi Barito Pacific pada 2007 seiring diversifikasi ke petrokimia dan energi.",
      "Mengakuisisi mayoritas saham Chandra Asri pada 2007; Chandra Asri Pacific (TPIA) kini merupakan produsen petrokimia terintegrasi terbesar di Indonesia.",
      "Barito Renewables Energy (BREN) melantai di BEI pada Oktober 2023 dan sempat menjadi emiten berkapitalisasi pasar terbesar di bursa; melalui Star Energy Geothermal grup ini mengoperasikan PLTP berkapasitas sekitar 886 MW."
    ],
    "sources": [
      {
        "title": "Forbes — Prajogo Pangestu profile",
        "url": "https://www.forbes.com/profile/prajogo-pangestu/"
      },
      {
        "title": "Forbes — PT Barito Pacific company profile",
        "url": "https://www.forbes.com/companies/pt-barito-pacific/"
      },
      {
        "title": "Wikipedia — Prajogo Pangestu",
        "url": "https://en.wikipedia.org/wiki/Prajogo_Pangestu"
      },
      {
        "title": "IDNFinancials — PT Barito Renewables Energy Tbk (BREN)",
        "url": "https://www.idnfinancials.com/bren/pt-barito-renewables-energy-tbk"
      },
      {
        "title": "Kompas.com — Saham Barito Renewables naik 731 persen sejak IPO",
        "url": "https://money.kompas.com/read/2023/11/21/153000826/saham-barito-renewables-energy-milik-prajogo-pangestu-naik-731-persen-sejak"
      }
    ]
  },
  {
    "id": "ct-corp",
    "name": "CT Corp",
    "founded": 1987,
    "hq": "Jakarta",
    "summary": "Konglomerasi yang didirikan Chairul Tanjung di Jakarta pada 1987 dengan nama Para Group dan menyandang nama CT Corp sejak 2011. Lini usahanya mencakup jasa keuangan (Bank Mega, Allo Bank), media dan hiburan (Trans Media), ritel (Transmart), serta properti.",
    "sectors": [
      "Perbankan & keuangan",
      "Media & hiburan",
      "Ritel & perdagangan",
      "Properti"
    ],
    "people": [
      {
        "id": "p-chairul-tanjung",
        "name": "Chairul Tanjung",
        "role": "Pendiri & Chairman"
      },
      {
        "id": "p-putri-tanjung",
        "name": "Putri Tanjung",
        "role": "Komisaris & Chief Experience Officer CT Corp"
      },
      {
        "id": "p-kostaman-thayib",
        "name": "Kostaman Thayib",
        "role": "Direktur Utama Bank Mega"
      }
    ],
    "companies": [
      {
        "id": "c-pt-bank-mega-tbk",
        "name": "PT Bank Mega Tbk",
        "ticker": "MEGA",
        "sector": "Perbankan"
      },
      {
        "id": "c-pt-allo-bank-indonesia-tbk",
        "name": "PT Allo Bank Indonesia Tbk",
        "ticker": "BBHI",
        "sector": "Perbankan digital"
      },
      {
        "id": "c-trans-tv",
        "name": "Trans TV (Trans Media)",
        "sector": "Media penyiaran"
      },
      {
        "id": "c-transmart",
        "name": "Transmart (Trans Retail Indonesia)",
        "sector": "Ritel"
      },
      {
        "id": "c-detikcom",
        "name": "detikcom",
        "sector": "Media digital"
      },
      {
        "id": "c-garuda-indonesia",
        "name": "Garuda Indonesia (penyertaan minoritas via Trans Airways)",
        "ticker": "GIAA",
        "sector": "Penerbangan"
      }
    ],
    "netWorth": {
      "valueBUSD": 4,
      "holder": "Chairul Tanjung",
      "source": "Forbes",
      "year": 2026
    },
    "notable": [
      "Berawal dari usaha ekspor sepatu anak pada 1987; Para Group berganti nama menjadi CT Corp pada 1 Desember 2011.",
      "Trans Media mengoperasikan Trans TV, Trans7, detikcom, serta CNN Indonesia dan CNBC Indonesia.",
      "Melalui Trans Airways pernah memegang 28,27% saham Garuda Indonesia (GIAA) pada 2021; kepemilikan terdilusi signifikan setelah restrukturisasi 2022 dan penambahan modal 2025."
    ],
    "sources": [
      {
        "title": "CT Corp — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/CT_Corp"
      },
      {
        "title": "Chairul Tanjung — Forbes Profile",
        "url": "https://www.forbes.com/profile/chairul-tanjung/"
      },
      {
        "title": "Makin Menipis, Trans Airways Hanya Genggam 8 Persen Saham Garuda Indonesia (GIAA) — EmitenNews",
        "url": "https://emitennews.com/news/makin-menipis-trans-airways-hanya-genggam-8-persen-saham-garuda-indonesia-giaa"
      },
      {
        "title": "Hasil RUPS Tahunan: Berikut Jajaran Terbaru Direksi Bank Mega — CNN Indonesia",
        "url": "https://www.cnnindonesia.com/ekonomi/20260331180118-92-1343050/hasil-rups-tahunan-berikut-jajaran-terbaru-direksi-bank-mega"
      },
      {
        "title": "Putri Tanjung — Commissioner & Chief Experience Officer of CT Corp (LinkedIn)",
        "url": "https://id.linkedin.com/in/putri-tanjung-3b1b1490"
      }
    ]
  },
  {
    "id": "lippo",
    "name": "Lippo Group",
    "founded": 1950,
    "hq": "Jakarta",
    "summary": "Lippo Group adalah konglomerat multinasional Indonesia yang didirikan Mochtar Riady dan berkantor pusat di Jakarta, dengan bisnis inti di properti, ritel, layanan kesehatan, pendidikan, media, dan jasa keuangan. Perusahaan kunci grup ini antara lain Lippo Karawaci (LPKR), Siloam International Hospitals (SILO), dan Matahari Department Store (LPPF).",
    "sectors": [
      "Properti",
      "Ritel & perdagangan",
      "Kesehatan",
      "Pendidikan",
      "Telekomunikasi",
      "Perbankan & keuangan"
    ],
    "people": [
      {
        "id": "p-mochtar-riady",
        "name": "Mochtar Riady",
        "role": "Pendiri & Chairman Emeritus"
      },
      {
        "id": "p-james-riady",
        "name": "James Riady",
        "role": "CEO Lippo Group"
      },
      {
        "id": "p-stephen-riady",
        "name": "Stephen Riady",
        "role": "Executive Chairman OUE (lini Singapura)"
      },
      {
        "id": "p-john-riady",
        "name": "John Riady",
        "role": "CEO Lippo Karawaci"
      }
    ],
    "companies": [
      {
        "id": "c-lippo-karawaci-tbk",
        "name": "Lippo Karawaci Tbk",
        "ticker": "LPKR",
        "sector": "Properti"
      },
      {
        "id": "c-siloam-international-hospitals-tbk",
        "name": "Siloam International Hospitals Tbk",
        "ticker": "SILO",
        "sector": "Rumah Sakit"
      },
      {
        "id": "c-matahari-department-store-tbk",
        "name": "Matahari Department Store Tbk",
        "ticker": "LPPF",
        "sector": "Ritel"
      },
      {
        "id": "c-matahari-putra-prima-tbk",
        "name": "Matahari Putra Prima Tbk (Hypermart)",
        "ticker": "MPPA",
        "sector": "Ritel"
      },
      {
        "id": "c-multipolar-tbk",
        "name": "Multipolar Tbk",
        "ticker": "MLPL",
        "sector": "Investasi & Holding"
      },
      {
        "id": "c-bank-nationalnobu-tbk",
        "name": "Bank Nationalnobu Tbk",
        "ticker": "NOBU",
        "sector": "Perbankan"
      }
    ],
    "netWorth": {
      "valueBUSD": 3.75,
      "holder": "Mochtar Riady & keluarga",
      "source": "Forbes Indonesia's 50 Richest",
      "year": 2025
    },
    "notable": [
      "Mengembangkan kota mandiri Lippo Village di Karawaci, Tangerang, serta jaringan Lippo Malls di berbagai kota Indonesia.",
      "Jaringan rumah sakit Siloam yang dikembangkan grup mencakup lebih dari 40 rumah sakit di seluruh Indonesia.",
      "Generasi ketiga keluarga Riady, John Riady, menjabat CEO Lippo Karawaci sejak Maret 2019."
    ],
    "sources": [
      {
        "title": "Lippo Group — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Lippo_Group"
      },
      {
        "title": "Mochtar Riady & family — Forbes Profile",
        "url": "https://www.forbes.com/profile/mochtar-riady/"
      },
      {
        "title": "Indonesia's 50 Richest 2025 — Forbes",
        "url": "https://www.forbes.com/lists/indonesia-billionaires/"
      },
      {
        "title": "James Riady — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/James_Riady"
      },
      {
        "title": "9 Saham Milik Lippo Group yang Melantai di Bursa — InvestasiKu",
        "url": "https://www.investasiku.id/eduvest/saham/saham-lippo-group"
      }
    ]
  },
  {
    "id": "bakrie",
    "name": "Bakrie Group",
    "founded": 1942,
    "hq": "Jakarta",
    "summary": "Grup Bakrie adalah salah satu konglomerasi tertua di Indonesia, dirintis Achmad Bakrie pada 1942 sebagai perusahaan dagang di Telukbetung, Lampung, dan kini berkantor pusat di Jakarta. Melalui induk usaha tercatat PT Bakrie & Brothers Tbk (BNBR), kelompok usaha keluarga Bakrie berinvestasi di infrastruktur, pertambangan batu bara, minyak dan gas, perkebunan, properti, media, hingga kendaraan listrik.",
    "sectors": [
      "Manufaktur & otomotif",
      "Energi & pertambangan",
      "Konsumen & pangan",
      "Properti",
      "Media & hiburan"
    ],
    "people": [
      {
        "id": "p-achmad-bakrie",
        "name": "Achmad Bakrie",
        "role": "Pendiri"
      },
      {
        "id": "p-aburizal-bakrie",
        "name": "Aburizal Bakrie",
        "role": "Mantan Chairman Grup"
      },
      {
        "id": "p-nirwan-dermawan-bakrie",
        "name": "Nirwan Dermawan Bakrie",
        "role": "Co-Chairman Grup"
      },
      {
        "id": "p-indra-usmansyah-bakrie",
        "name": "Indra Usmansyah Bakrie",
        "role": "Co-Chairman Grup"
      },
      {
        "id": "p-anindya-novyan-bakrie",
        "name": "Anindya Novyan Bakrie",
        "role": "CEO & Presiden Direktur Bakrie & Brothers"
      }
    ],
    "companies": [
      {
        "id": "c-bakrie-brothers",
        "name": "Bakrie & Brothers",
        "ticker": "BNBR",
        "sector": "Induk usaha — infrastruktur & manufaktur"
      },
      {
        "id": "c-bumi-resources",
        "name": "Bumi Resources",
        "ticker": "BUMI",
        "sector": "Pertambangan batu bara"
      },
      {
        "id": "c-energi-mega-persada",
        "name": "Energi Mega Persada",
        "ticker": "ENRG",
        "sector": "Minyak & gas"
      },
      {
        "id": "c-bakrie-sumatera-plantations",
        "name": "Bakrie Sumatera Plantations",
        "ticker": "UNSP",
        "sector": "Perkebunan & agribisnis"
      },
      {
        "id": "c-vktr-teknologi-mobilitas",
        "name": "VKTR Teknologi Mobilitas",
        "ticker": "VKTR",
        "sector": "Kendaraan listrik"
      },
      {
        "id": "c-visi-media-asia",
        "name": "Visi Media Asia",
        "ticker": "VIVA",
        "sector": "Media & penyiaran"
      }
    ],
    "notable": [
      "Bakrie & Brothers dikenal sebagai perintis industri pipa baja di Indonesia dan tercatat di bursa sejak 1989.",
      "Bumi Resources, salah satu produsen batu bara termal terbesar di Indonesia lewat Kaltim Prima Coal dan Arutmin, kini dikendalikan bersama Grup Salim melalui Mach Energy.",
      "Grup menaungi jaringan televisi nasional ANTV dan tvOne melalui Visi Media Asia, serta masuk ke perakitan bus listrik melalui VKTR (IPO 2023)."
    ],
    "sources": [
      {
        "title": "Bakrie Group — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Bakrie_Group"
      },
      {
        "title": "Leadership — PT Bakrie & Brothers Tbk",
        "url": "https://bakrie-brothers.com/discover-bakrie/leadership/"
      },
      {
        "title": "Indonesia's 40 Richest (2007) — Forbes",
        "url": "https://www.forbes.com/global/2007/1224/049.html"
      },
      {
        "title": "Board of Directors — PT Bumi Resources Tbk",
        "url": "https://www.bumiresources.com/en/about-us/board-of-directors"
      },
      {
        "title": "VKTR Teknologi Mobilitas IPO — IDNFinancials",
        "url": "https://www.idnfinancials.com/archive/id/47087/bakries-vktr-raise-idr-ipo"
      }
    ]
  },
  {
    "id": "mayapada",
    "name": "Mayapada Group",
    "founded": 1986,
    "hq": "Jakarta",
    "summary": "Mayapada Group adalah konglomerat Indonesia yang didirikan Dato Sri Tahir pada 1986, berawal dari usaha garmen dan tekstil sebelum berekspansi ke perbankan melalui Bank Mayapada pada 1990. Grup yang berbasis di Jakarta ini kini bergerak di perbankan, layanan kesehatan (jaringan Mayapada Hospital), properti, ritel bebas bea, dan media.",
    "sectors": [
      "Perbankan & keuangan",
      "Kesehatan",
      "Properti",
      "Ritel & perdagangan",
      "Media & hiburan"
    ],
    "people": [
      {
        "id": "p-dato-sri-tahir",
        "name": "Dato Sri Tahir",
        "role": "Pendiri & Chairman"
      },
      {
        "id": "p-jonathan-tahir",
        "name": "Jonathan Tahir",
        "role": "Wakil Chairman Grup; Chairman & Group CEO Mayapada Healthcare"
      }
    ],
    "companies": [
      {
        "id": "c-pt-bank-mayapada-internasional-tbk",
        "name": "PT Bank Mayapada Internasional Tbk",
        "ticker": "MAYA",
        "sector": "Perbankan"
      },
      {
        "id": "c-pt-sejahteraraya-anugrahjaya-tbk",
        "name": "PT Sejahteraraya Anugrahjaya Tbk (Mayapada Hospital)",
        "ticker": "SRAJ",
        "sector": "Layanan kesehatan"
      },
      {
        "id": "c-pt-maha-properti-indonesia-tbk",
        "name": "PT Maha Properti Indonesia Tbk",
        "ticker": "MPRO",
        "sector": "Properti"
      },
      {
        "id": "c-pt-sona-topas-tourism-industry-tbk",
        "name": "PT Sona Topas Tourism Industry Tbk",
        "ticker": "SONA",
        "sector": "Ritel bebas bea & pariwisata"
      },
      {
        "id": "c-myp-ltd",
        "name": "MYP Ltd",
        "sector": "Properti (tercatat di SGX, Singapura)"
      }
    ],
    "netWorth": {
      "valueBUSD": 8.4,
      "holder": "Tahir & keluarga",
      "source": "Forbes (profil real-time; peringkat 7 Indonesia's 50 Richest 2025)",
      "year": 2026
    },
    "notable": [
      "Bank Mayapada melantai di Bursa Efek Jakarta pada 1997 dan tercatat sebagai salah satu bank yang relatif tidak terdampak krisis finansial Asia 1997.",
      "Jaringan Mayapada Hospital dioperasikan melalui PT Sejahteraraya Anugrahjaya Tbk (SRAJ) dan terus berekspansi, termasuk rumah sakit baru di Batam dekat Singapura (2025).",
      "Melalui Tahir Foundation, pendiri grup aktif dalam filantropi kesehatan dan pendidikan."
    ],
    "sources": [
      {
        "title": "Mayapada — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Mayapada"
      },
      {
        "title": "Tahir & family — Forbes Profile",
        "url": "https://www.forbes.com/profile/tahir/"
      },
      {
        "title": "Sosok Jonathan Tahir, Pewaris Mayapada Group yang Borong Saham SRAJ — Bisnis.com",
        "url": "https://entrepreneur.bisnis.com/read/20250123/265/1834170/sosok-jonathan-tahir-pewaris-mayapada-group-yang-borong-saham-sraj"
      },
      {
        "title": "Profil Perusahaan Tercatat MPRO — IDX",
        "url": "https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat/MPRO"
      },
      {
        "title": "Indonesian Billionaire Tahir's Mayapada Healthcare Expands With Hospital Near Singapore — Forbes",
        "url": "https://www.forbes.com/sites/ardianwibisono/2025/08/29/indonesian-billionaire-tahirs-mayapada-healthcare-expands-with-hospital-near-singapore/"
      }
    ]
  },
  {
    "id": "triputra",
    "name": "Triputra Group",
    "founded": 1998,
    "hq": "Jakarta",
    "summary": "Triputra Group adalah konglomerasi Indonesia yang didirikan Theodore Permadi Rachmat, mantan CEO Astra International, pada 1998 dengan holding PT Triputra Investindo Arya di Jakarta. Portofolionya mencakup agribisnis (sawit dan karet), manufaktur komponen otomotif, energi, serta perdagangan, jasa, dan logistik, ditambah saham minoritas keluarga di Alamtri Resources Indonesia (d/h Adaro Energy).",
    "sectors": [
      "Konsumen & pangan",
      "Manufaktur & otomotif",
      "Energi & pertambangan",
      "Ritel & perdagangan",
      "Infrastruktur & logistik"
    ],
    "people": [
      {
        "id": "p-theodore-permadi-rachmat",
        "name": "Theodore Permadi Rachmat",
        "role": "Pendiri"
      },
      {
        "id": "p-christian-ariano-rachmat",
        "name": "Christian Ariano Rachmat",
        "role": "Presiden Komisaris PT Triputra Investindo Arya"
      },
      {
        "id": "p-arif-patrick-rachmat",
        "name": "Arif Patrick Rachmat",
        "role": "Co-founder & Chairman Triputra Agro Persada"
      },
      {
        "id": "p-tjandra-karya-hermanto",
        "name": "Tjandra Karya Hermanto",
        "role": "Presiden Direktur PT Triputra Investindo Arya"
      }
    ],
    "companies": [
      {
        "id": "c-pt-triputra-agro-persada-tbk",
        "name": "PT Triputra Agro Persada Tbk",
        "ticker": "TAPG",
        "sector": "Perkebunan kelapa sawit"
      },
      {
        "id": "c-pt-dharma-polimetal-tbk",
        "name": "PT Dharma Polimetal Tbk",
        "ticker": "DRMA",
        "sector": "Komponen otomotif"
      },
      {
        "id": "c-pt-alamtri-resources-indonesia-tbk",
        "name": "PT Alamtri Resources Indonesia Tbk (d/h Adaro Energy)",
        "ticker": "ADRO",
        "sector": "Energi & batu bara (saham minoritas keluarga)"
      },
      {
        "id": "c-pt-kirana-megatara-tbk",
        "name": "PT Kirana Megatara Tbk",
        "ticker": "KMTR",
        "sector": "Pengolahan karet remah (crumb rubber)"
      },
      {
        "id": "c-pt-adi-sarana-armada-tbk",
        "name": "PT Adi Sarana Armada Tbk",
        "ticker": "ASSA",
        "sector": "Transportasi & logistik (termasuk Anteraja)"
      },
      {
        "id": "c-triputra-energi-megatara",
        "name": "Triputra Energi Megatara",
        "sector": "Distribusi energi"
      }
    ],
    "netWorth": {
      "valueBUSD": 4.1,
      "holder": "Theodore Permadi Rachmat",
      "source": "Forbes",
      "year": 2026
    },
    "notable": [
      "Theodore Permadi Rachmat memulai karier di Astra International milik pamannya, William Soeryadjaya, dan menjabat CEO Astra sebelum mendirikan Triputra pada 1998.",
      "TP Rachmat memegang saham minoritas dan menjabat Wakil Presiden Komisaris Alamtri Resources Indonesia (d/h Adaro Energy, IDX: ADRO), hasil akuisisi Adaro bersama sejumlah keluarga pengusaha pada 2005.",
      "Dua putranya menempati posisi puncak grup: Christian Ariano Rachmat (Presiden Komisaris Triputra; Wakil Presiden Direktur Alamtri) dan Arif Patrick Rachmat (co-founder & Chairman Triputra Agro Persada, IDX: TAPG)."
    ],
    "sources": [
      {
        "title": "Forbes — Theodore Rachmat profile",
        "url": "https://www.forbes.com/profile/theodore-rachmat/"
      },
      {
        "title": "Triputra Group — Profil resmi",
        "url": "https://triputra-group.com/en/tentang-kami/profil/"
      },
      {
        "title": "IDNFinancials — PT Triputra Agro Persada Tbk (TAPG)",
        "url": "https://www.idnfinancials.com/tapg/pt-triputra-agro-persada-tbk"
      },
      {
        "title": "IDNFinancials — PT Dharma Polimetal Tbk (DRMA)",
        "url": "https://www.idnfinancials.com/drma/pt-dharma-polimetal-tbk"
      },
      {
        "title": "AlamTri Resources Indonesia (d/h Adaro Energy)",
        "url": "https://www.alamtri.com/"
      }
    ]
  },
  {
    "id": "mnc",
    "name": "MNC Group",
    "founded": 1989,
    "hq": "Jakarta",
    "summary": "Grup investasi Indonesia yang didirikan Hary Tanoesoedibjo pada 1989 sebagai perusahaan sekuritas PT Bhakti Investama, kini berpusat di Jakarta dengan tiga pilar bisnis utama: media & hiburan, jasa keuangan, serta properti & pariwisata. Unit medianya (MNCN) mengoperasikan empat stasiun TV nasional, yaitu RCTI, MNCTV, GTV, dan iNews.",
    "sectors": [
      "Media & hiburan",
      "Perbankan & keuangan",
      "Properti",
      "Energi & pertambangan"
    ],
    "people": [
      {
        "id": "p-hary-tanoesoedibjo",
        "name": "Hary Tanoesoedibjo",
        "role": "Pendiri & Executive Chairman"
      },
      {
        "id": "p-angela-herliani-tanoesoedibjo",
        "name": "Angela Herliani Tanoesoedibjo",
        "role": "Co-CEO MNC Group"
      }
    ],
    "companies": [
      {
        "id": "c-pt-mnc-asia-holding-tbk",
        "name": "PT MNC Asia Holding Tbk",
        "ticker": "BHIT",
        "sector": "Induk investasi"
      },
      {
        "id": "c-pt-global-mediacom-tbk",
        "name": "PT Global Mediacom Tbk",
        "ticker": "BMTR",
        "sector": "Induk media"
      },
      {
        "id": "c-pt-media-nusantara-citra-tbk",
        "name": "PT Media Nusantara Citra Tbk (MNC Media)",
        "ticker": "MNCN",
        "sector": "Media & hiburan (RCTI, MNCTV, GTV, iNews)"
      },
      {
        "id": "c-pt-mnc-kapital-indonesia-tbk",
        "name": "PT MNC Kapital Indonesia Tbk",
        "ticker": "BCAP",
        "sector": "Jasa keuangan"
      },
      {
        "id": "c-pt-bank-mnc-internasional-tbk",
        "name": "PT Bank MNC Internasional Tbk (MNC Bank)",
        "ticker": "BABP",
        "sector": "Perbankan"
      },
      {
        "id": "c-pt-mnc-land-tbk",
        "name": "PT MNC Land Tbk (MNC Tourism Indonesia)",
        "ticker": "KPIG",
        "sector": "Properti & pariwisata"
      }
    ],
    "netWorth": {
      "valueBUSD": 1.1,
      "holder": "Hary Tanoesoedibjo",
      "source": "Forbes Billionaires List",
      "year": 2026
    },
    "notable": [
      "Berawal sebagai perusahaan sekuritas PT Bhakti Investama yang didirikan di Surabaya pada 2 November 1989, kemudian bertransformasi menjadi grup investasi berpusat di MNC Tower, Jakarta.",
      "MNC Media mengoperasikan empat stasiun TV free-to-air nasional (RCTI, MNCTV, GTV, iNews) serta jaringan kanal TV berbayar MNC Channels.",
      "Mengembangkan kawasan Lido City di Bogor, termasuk Lido Music & Arts Center yang dibuka pada 2023."
    ],
    "sources": [
      {
        "title": "Forbes — Hary Tanoesoedibjo profile",
        "url": "https://www.forbes.com/profile/hary-tanoesoedibjo/"
      },
      {
        "title": "Wikipedia — MNC Asia Holding",
        "url": "https://en.wikipedia.org/wiki/MNC_Asia_Holding"
      },
      {
        "title": "Wikipedia — Media Nusantara Citra",
        "url": "https://en.wikipedia.org/wiki/Media_Nusantara_Citra"
      },
      {
        "title": "CNBC Indonesia — Angela Tanoesoedibjo Co-CEO MNC Group",
        "url": "https://www.cnbcindonesia.com/market/20241024142121-17-582756/selesai-jadi-wamen-angela-tanoesoedibjo-kembali-jadi-co-ceo-mnc-group"
      },
      {
        "title": "IDNFinancials — PT Bank MNC Internasional Tbk (BABP)",
        "url": "https://www.idnfinancials.com/babp/pt-bank-mnc-internasional-tbk"
      }
    ]
  },
  {
    "id": "emtek",
    "name": "Emtek Group (PT Elang Mahkota Teknologi Tbk)",
    "founded": 1983,
    "hq": "Jakarta",
    "summary": "Emtek Group adalah konglomerasi media dan teknologi yang didirikan Eddy Kusnadi Sariaatmadja di Jakarta pada 1983, bermula sebagai distributor komputer Compaq dengan nama PT Elang Mahkota Komputer. Grup ini menaungi stasiun televisi SCTV dan Indosiar melalui Surya Citra Media, platform streaming Vidio, serta kepemilikan saham di Bukalapak, dan berekspansi ke perbankan digital dan layanan kesehatan.",
    "sectors": [
      "Media & hiburan",
      "Teknologi",
      "Ritel & perdagangan",
      "Perbankan & keuangan",
      "Kesehatan"
    ],
    "people": [
      {
        "id": "p-eddy-kusnadi-sariaatmadja",
        "name": "Eddy Kusnadi Sariaatmadja",
        "role": "Pendiri & Komisaris Utama"
      },
      {
        "id": "p-fofo-sariaatmadja",
        "name": "Fofo Sariaatmadja",
        "role": "Pendiri Bersama"
      },
      {
        "id": "p-alvin-widarta-sariaatmadja",
        "name": "Alvin Widarta Sariaatmadja",
        "role": "Direktur Utama"
      }
    ],
    "companies": [
      {
        "id": "c-pt-elang-mahkota-teknologi-tbk",
        "name": "PT Elang Mahkota Teknologi Tbk",
        "ticker": "EMTK",
        "sector": "Induk usaha — teknologi & media"
      },
      {
        "id": "c-pt-surya-citra-media-tbk",
        "name": "PT Surya Citra Media Tbk",
        "ticker": "SCMA",
        "sector": "Media & penyiaran"
      },
      {
        "id": "c-sctv",
        "name": "SCTV",
        "sector": "Televisi nasional (free-to-air)"
      },
      {
        "id": "c-indosiar",
        "name": "Indosiar",
        "sector": "Televisi nasional (free-to-air)"
      },
      {
        "id": "c-vidio",
        "name": "Vidio",
        "sector": "Streaming video (OTT)"
      },
      {
        "id": "c-pt-bukalapak-com-tbk",
        "name": "PT Bukalapak.com Tbk",
        "ticker": "BUKA",
        "sector": "E-commerce (kepemilikan saham grup)"
      }
    ],
    "netWorth": {
      "valueBUSD": 1.8,
      "holder": "Eddy Kusnadi Sariaatmadja & keluarga",
      "source": "Forbes Indonesia's 50 Richest",
      "year": 2025
    },
    "notable": [
      "Berawal pada 1983 sebagai PT Elang Mahkota Komputer, distributor eksklusif komputer Compaq di Indonesia, sebelum bertransformasi menjadi grup media dan teknologi.",
      "Melalui Surya Citra Media (SCMA), grup mengoperasikan jaringan televisi nasional SCTV, Indosiar, Moji, dan Mentari TV serta platform streaming Vidio.",
      "Berekspansi ke perbankan digital melalui Superbank (memegang sekitar sepertiga saham) yang melantai di bursa pada Desember 2025, serta ke layanan kesehatan lewat jaringan rumah sakit EMC."
    ],
    "sources": [
      {
        "title": "Emtek — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Emtek"
      },
      {
        "title": "Eddy Kusnadi Sariaatmadja & family — Forbes Profile",
        "url": "https://www.forbes.com/profile/eddy-kusnadi-sariaatmadja-family/"
      },
      {
        "title": "Eddy Kusnadi Sariaatmadja — Elang Mahkota Teknologi (Management)",
        "url": "https://emtek.co.id/en/about-us/management/eddy-kusnadi-sariaatmadja"
      },
      {
        "title": "Savvy Bets Return Media Mogul To Ranks Of Indonesia's Richest — Forbes",
        "url": "https://www.forbes.com/sites/gloriaharaito/2025/12/10/savvy-bets-return-media-mogul-to-ranks-of-indonesias-richest/"
      }
    ]
  },
  {
    "id": "gudang-garam",
    "name": "Gudang Garam",
    "founded": 1958,
    "hq": "Kediri",
    "summary": "Gudang Garam adalah grup usaha keluarga Wonowidjojo yang berawal dari pabrik rokok kretek yang didirikan Surya Wonowidjojo di Kediri pada 1958, dengan PT Gudang Garam Tbk (IDX: GGRM) sebagai perusahaan induk tercatat dan salah satu produsen kretek terbesar di Indonesia. Grup ini juga merambah distribusi, kertas kemasan, penerbangan, dan infrastruktur, termasuk Bandara Internasional Dhoho Kediri yang beroperasi sejak 2024.",
    "sectors": [
      "Rokok kretek",
      "Ritel & perdagangan",
      "Pulp & kertas",
      "Infrastruktur & logistik",
      "Konsumen & pangan"
    ],
    "people": [
      {
        "id": "p-surya-wonowidjojo",
        "name": "Surya Wonowidjojo",
        "role": "Pendiri"
      },
      {
        "id": "p-susilo-wonowidjojo",
        "name": "Susilo Wonowidjojo",
        "role": "Presiden Direktur PT Gudang Garam Tbk"
      },
      {
        "id": "p-juni-setiawati-wonowidjojo",
        "name": "Juni Setiawati Wonowidjojo",
        "role": "Presiden Komisaris PT Gudang Garam Tbk"
      },
      {
        "id": "p-indra-gunawan-wonowidjojo",
        "name": "Indra Gunawan Wonowidjojo",
        "role": "Wakil Presiden Direktur PT Gudang Garam Tbk"
      }
    ],
    "companies": [
      {
        "id": "c-pt-gudang-garam-tbk",
        "name": "PT Gudang Garam Tbk",
        "ticker": "GGRM",
        "sector": "Rokok kretek"
      },
      {
        "id": "c-pt-surya-madistrindo",
        "name": "PT Surya Madistrindo",
        "sector": "Distribusi rokok"
      },
      {
        "id": "c-pt-surya-pamenang",
        "name": "PT Surya Pamenang",
        "sector": "Kertas kemasan (karton)"
      },
      {
        "id": "c-pt-surya-dhoho-investama",
        "name": "PT Surya Dhoho Investama",
        "sector": "Infrastruktur bandara (Bandara Internasional Dhoho)"
      },
      {
        "id": "c-pt-surya-air",
        "name": "PT Surya Air",
        "sector": "Penerbangan"
      },
      {
        "id": "c-grup-makin",
        "name": "Grup Makin",
        "sector": "Perkebunan kelapa sawit"
      }
    ],
    "netWorth": {
      "valueBUSD": 3.2,
      "holder": "Susilo Wonowidjojo & keluarga",
      "source": "Forbes Indonesia's 50 Richest",
      "year": 2025
    },
    "notable": [
      "Membangun Bandara Internasional Dhoho Kediri melalui PT Surya Dhoho Investama dengan investasi sekitar Rp13 triliun; bandara pertama di Indonesia yang sepenuhnya didanai swasta (skema KPBU unsolicited), beroperasi sejak April 2024.",
      "PT Gudang Garam Tbk menguasai sekitar sepertiga pasar rokok Indonesia dan keluarga Wonowidjojo memegang sekitar 75% sahamnya.",
      "Regenerasi kepemimpinan publik berjalan: Indra Gunawan Wonowidjojo menjabat Wakil Presiden Direktur sejak 2022 dan kembali dikukuhkan pada RUPS Juni 2026."
    ],
    "sources": [
      {
        "title": "Susilo Wonowidjojo & family — Forbes",
        "url": "https://www.forbes.com/profile/susilo-wonowidjojo/"
      },
      {
        "title": "Gudang Garam — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Gudang_Garam"
      },
      {
        "title": "RUPS 2026: Gudang Garam Bagikan Dividen Rp1,53 Triliun — Kediripedia",
        "url": "https://kediripedia.com/rups-2026-gudang-garam-bagikan-dividen-rp153-triliun/"
      },
      {
        "title": "Bandara Dhoho Kediri Rp 13 T Milik Gudang Garam Akhirnya Beroperasi — CNBC Indonesia",
        "url": "https://www.cnbcindonesia.com/news/20240405160453-4-528819/bandara-dhoho-kediri-rp-13-t-milik-gudang-garam-akhirnya-beroperasi"
      },
      {
        "title": "Bandara Dhoho Kediri: KPBU Unsolicited Pertama di Indonesia — DJKN Kemenkeu",
        "url": "https://www.djkn.kemenkeu.go.id/kpknl-denpasar/baca-artikel/17142/Bandara-Dhoho-Kediri-KPBU-Unsolicited-Pertama-di-Indonesia.html"
      }
    ]
  },
  {
    "id": "wings",
    "name": "Wings Group",
    "founded": 1948,
    "hq": "Surabaya",
    "summary": "Wings Group adalah grup barang konsumen (FMCG) asal Surabaya yang didirikan pada 21 September 1948 oleh Johannes Ferdinand Katuari dan Harjo Sutanto, bermula dari produksi sabun cuci rumahan bernama Fa Wings. Dikendalikan bersama keluarga Katuari dan Sutanto, grup ini memproduksi deterjen dan produk perawatan rumah tangga, makanan-minuman seperti Mie Sedaap, serta merambah perbankan (Bank MAS), properti, dan oleokimia dengan produk yang dijual hingga puluhan negara.",
    "sectors": [
      "Konsumen & pangan",
      "Perbankan & keuangan",
      "Properti",
      "Energi & pertambangan"
    ],
    "people": [
      {
        "id": "p-johannes-ferdinand-katuari",
        "name": "Johannes Ferdinand Katuari",
        "role": "Pendiri"
      },
      {
        "id": "p-harjo-sutanto",
        "name": "Harjo Sutanto",
        "role": "Pendiri"
      },
      {
        "id": "p-eddy-william-katuari",
        "name": "Eddy William Katuari",
        "role": "Chairman (generasi kedua, memimpin sejak 2004)"
      },
      {
        "id": "p-hanny-sutanto",
        "name": "Hanny Sutanto",
        "role": "Perwakilan keluarga Sutanto, Komisaris UNIC"
      }
    ],
    "companies": [
      {
        "id": "c-pt-wings-surya",
        "name": "PT Wings Surya",
        "sector": "Barang konsumen — deterjen & perawatan rumah tangga"
      },
      {
        "id": "c-wings-food",
        "name": "Wings Food",
        "sector": "Makanan & minuman (Mie Sedaap)"
      },
      {
        "id": "c-lion-wings",
        "name": "Lion Wings",
        "sector": "Perawatan tubuh (JV Lion Corporation Jepang)"
      },
      {
        "id": "c-pt-bank-multiarta-sentosa-tbk",
        "name": "PT Bank Multiarta Sentosa Tbk (Bank MAS)",
        "ticker": "MASB",
        "sector": "Perbankan"
      },
      {
        "id": "c-pt-unggul-indah-cahaya-tbk",
        "name": "PT Unggul Indah Cahaya Tbk",
        "ticker": "UNIC",
        "sector": "Petrokimia — bahan baku deterjen (afiliasi keluarga pendiri)"
      },
      {
        "id": "c-pt-ecogreen-oleochemicals",
        "name": "PT Ecogreen Oleochemicals",
        "sector": "Oleokimia"
      }
    ],
    "netWorth": {
      "valueBUSD": 0.995,
      "holder": "Eddy Katuari & keluarga",
      "source": "Forbes (Indonesia's 50 Richest 2025)",
      "year": 2025
    },
    "notable": [
      "Merek mi instan Mie Sedaap dijual di puluhan negara dan menjadi salah satu produk andalan grup.",
      "Kemitraan dua keluarga pendiri, Katuari dan Sutanto, bertahan sejak 1948 dan kini telah memasuki generasi ketiga.",
      "Lini non-FMCG grup mencakup Bank MAS (IPO 2021), properti seperti The Apurva Kempinski Bali, serta oleokimia melalui Ecogreen."
    ],
    "sources": [
      {
        "title": "Wings (Indonesian company) — Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Wings_(Indonesian_company)"
      },
      {
        "title": "Eddy Katuari & family — Forbes Profile (Indonesia's 50 Richest 2025)",
        "url": "https://www.forbes.com/profile/eddy-katuari/"
      },
      {
        "title": "2 Saham Milik Wings Group di Bursa Efek Indonesia — IDX Channel",
        "url": "https://www.idxchannel.com/market-news/2-saham-milik-wings-group-di-bursa-efek-indonesia-simak-daftar-emitennya/all"
      },
      {
        "title": "Indonesia's Oldest Billionaire, Wings Group Co-Founder Robert Harjo Sutanto, Dies at 102 — Jakarta Globe",
        "url": "https://jakartaglobe.id/business/indonesias-oldest-billionaire-wings-group-cofounder-robert-harjo-sutanto-dies-at-102"
      },
      {
        "title": "Bank MAS Resmi Melantai di Bursa Saham — PT Bank Multiarta Sentosa Tbk",
        "url": "https://www.bankmas.co.id/en/tentang-kami/informasi/berita-media/bank-mas-resmi-melantai-di-bursa-saham/"
      }
    ]
  },
  {
    "id": "harita",
    "name": "Harita Group",
    "founded": 1915,
    "hq": "Jakarta",
    "summary": "Harita Group adalah konglomerat sumber daya alam milik keluarga Lim yang berawal dari usaha dagang di Kalimantan Timur pada 1915 dan kini berkantor pusat di Jakarta. Lini bisnis utamanya mencakup pertambangan dan pengolahan nikel melalui Harita Nickel (NCKL), bauksit-alumina melalui Cita Mineral Investindo (CITA), serta kelapa sawit melalui Bumitama Agri.",
    "sectors": [
      "Energi & pertambangan",
      "Konsumen & pangan",
      "Infrastruktur & logistik"
    ],
    "people": [
      {
        "id": "p-lim-tju-king",
        "name": "Lim Tju King",
        "role": "Perintis usaha keluarga (1915)"
      },
      {
        "id": "p-lim-hariyanto-wijaya-sarwono",
        "name": "Lim Hariyanto Wijaya Sarwono",
        "role": "Pendiri Harita Group"
      },
      {
        "id": "p-lim-gunawan-hariyanto",
        "name": "Lim Gunawan Hariyanto",
        "role": "CEO Harita Group"
      },
      {
        "id": "p-christina-lim",
        "name": "Christina Lim",
        "role": "Direktur Eksekutif Bumitama Agri"
      },
      {
        "id": "p-roy-arman-arfandy",
        "name": "Roy Arman Arfandy",
        "role": "Presiden Direktur Harita Nickel"
      }
    ],
    "companies": [
      {
        "id": "c-pt-trimegah-bangun-persada-tbk",
        "name": "PT Trimegah Bangun Persada Tbk (Harita Nickel)",
        "ticker": "NCKL",
        "sector": "Pertambangan & pengolahan nikel"
      },
      {
        "id": "c-pt-cita-mineral-investindo-tbk",
        "name": "PT Cita Mineral Investindo Tbk",
        "ticker": "CITA",
        "sector": "Pertambangan bauksit & alumina"
      },
      {
        "id": "c-bumitama-agri-ltd",
        "name": "Bumitama Agri Ltd",
        "sector": "Perkebunan kelapa sawit (tercatat di SGX)"
      },
      {
        "id": "c-pt-harita-jayaraya",
        "name": "PT Harita Jayaraya",
        "sector": "Induk usaha (holding)"
      }
    ],
    "netWorth": {
      "valueBUSD": 4.2,
      "holder": "Lim Hariyanto Wijaya Sarwono & keluarga",
      "source": "Forbes Real-Time Billionaires",
      "year": 2026
    },
    "notable": [
      "Mengoperasikan pabrik HPAL (High-Pressure Acid Leach) pertama di Indonesia untuk bahan baku baterai kendaraan listrik di Pulau Obi, beroperasi sejak 2021.",
      "IPO Trimegah Bangun Persada (Harita Nickel) pada 2023 menghimpun sekitar US$670 juta, salah satu IPO terbesar di BEI tahun itu.",
      "Nama 'Harita' merupakan gabungan nama Lim Hariyanto dan istrinya, Rita, sebagaimana dilaporkan Forbes."
    ],
    "sources": [
      {
        "title": "Forbes — Lim Hariyanto Wijaya Sarwono profile",
        "url": "https://www.forbes.com/profile/lim-hariyanto-wijaya-sarwono/"
      },
      {
        "title": "Wikipedia — Harita Group",
        "url": "https://en.wikipedia.org/wiki/Harita_Group"
      },
      {
        "title": "StockAnalysis — PT Trimegah Bangun Persada Tbk (IDX: NCKL) company profile",
        "url": "https://stockanalysis.com/quote/idx/NCKL/company/"
      },
      {
        "title": "Harita Nickel (tbpnickel.com) — President Director award news",
        "url": "https://tbpnickel.com/media/kabar-obi/other/bangga-presiden-direktur-harita-nickel-raih-penghargaan-indonesia-best-50-ceo-and-popular-leader-awards"
      }
    ]
  },
  {
    "id": "panin",
    "name": "Panin Group",
    "founded": 1971,
    "hq": "Jakarta",
    "summary": "Panin Group adalah grup jasa keuangan Indonesia yang berawal dari pendirian Bank Pan Indonesia (Panin Bank) oleh Mu'min Ali Gunawan di Jakarta pada 17 Agustus 1971, hasil penggabungan tiga bank. Grup ini menaungi sejumlah emiten Bursa Efek Indonesia di bidang perbankan, asuransi, pembiayaan, dan sekuritas, antara lain Panin Bank (PNBN) dan Panin Financial (PNLF).",
    "sectors": [
      "Perbankan & keuangan"
    ],
    "people": [
      {
        "id": "p-mu-min-ali-gunawan",
        "name": "Mu'min Ali Gunawan",
        "role": "Pendiri"
      },
      {
        "id": "p-herwidayatmo",
        "name": "Herwidayatmo",
        "role": "Presiden Direktur Bank Panin"
      },
      {
        "id": "p-nelson-tampubolon",
        "name": "Nelson Tampubolon",
        "role": "Presiden Komisaris Bank Panin"
      },
      {
        "id": "p-chandra-rahardja-gunawan",
        "name": "Chandra Rahardja Gunawan",
        "role": "Komisaris Bank Panin"
      }
    ],
    "companies": [
      {
        "id": "c-pt-bank-pan-indonesia-tbk",
        "name": "PT Bank Pan Indonesia Tbk (Panin Bank)",
        "ticker": "PNBN",
        "sector": "Perbankan"
      },
      {
        "id": "c-pt-panin-financial-tbk",
        "name": "PT Panin Financial Tbk",
        "ticker": "PNLF",
        "sector": "Asuransi jiwa & holding keuangan"
      },
      {
        "id": "c-pt-paninvest-tbk",
        "name": "PT Paninvest Tbk",
        "ticker": "PNIN",
        "sector": "Perusahaan induk investasi"
      },
      {
        "id": "c-pt-panin-sekuritas-tbk",
        "name": "PT Panin Sekuritas Tbk",
        "ticker": "PANS",
        "sector": "Sekuritas & manajemen aset"
      },
      {
        "id": "c-pt-clipan-finance-indonesia-tbk",
        "name": "PT Clipan Finance Indonesia Tbk",
        "ticker": "CFIN",
        "sector": "Pembiayaan (multifinance)"
      },
      {
        "id": "c-pt-bank-panin-dubai-syariah-tbk",
        "name": "PT Bank Panin Dubai Syariah Tbk",
        "ticker": "PNBS",
        "sector": "Perbankan syariah"
      }
    ],
    "notable": [
      "Bank Panin merupakan bank pertama yang mencatatkan sahamnya di Bursa Efek Jakarta, pada 1982.",
      "Panin Bank terbentuk dari penggabungan tiga bank — Bank Kemakmuran, Bank Industri Djaja Indonesia, dan Bank Industri dan Dagang Indonesia — pada 17 Agustus 1971.",
      "PT Panin Financial Tbk tercatat sebagai pemegang saham terbesar Bank Panin (sekitar 46%), sementara ANZ Group melalui Votraint No. 1103 Pty Ltd memegang sekitar 38,8%."
    ],
    "sources": [
      {
        "title": "Bank Pan Indonesia — Wikipedia bahasa Indonesia",
        "url": "https://id.wikipedia.org/wiki/Bank_Pan_Indonesia"
      },
      {
        "title": "Mu'min Ali Gunawan — Wikipedia bahasa Indonesia",
        "url": "https://id.wikipedia.org/wiki/Mu%27min_Ali_Gunawan"
      },
      {
        "title": "Profil Mu'min Ali Gunawan, Konglomerat Pengendali Bank Panin (PNBN) — Bisnis.com",
        "url": "https://finansial.bisnis.com/read/20220714/90/1554948/profil-mumin-ali-gunawan-konglomerat-pengendali-bank-panin-pnbn-yang-hendak-dibeli-mufg"
      },
      {
        "title": "7 Saham Panin Grup, yang Mayoritas Bergerak di Sektor Keuangan — InvestasiKu",
        "url": "https://www.investasiku.id/eduvest/saham/saham-panin-grup"
      },
      {
        "title": "RUPST Bank Panin Angkat Komisaris dan Direksi Baru, Ini Susunan Lengkapnya — Infobanknews",
        "url": "https://infobanknews.com/rupst-bank-panin-angkat-komisaris-dan-direksi-baru-ini-susunan-lengkapnya/"
      }
    ]
  }
];
