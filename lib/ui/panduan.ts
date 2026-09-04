/**
 * Isi halaman petunjuk uji coba.
 *
 * Dipisah dari komponennya supaya naskahnya mudah ditinjau bersama
 * pemangku kepentingan tanpa membaca kode tampilan.
 */

import type { Role } from '@/lib/domain/types'

export interface TahapAlur {
  role: Role
  judul: string
  /** Apa yang dikerjakan pengguna di layar ini. */
  langkah: string[]
  /** Yang perlu diperhatikan — inti pembuktian tahap ini. */
  periksa: string
  href: string
  labelTombol: string
}

/** Alur penuh START → SELESAI mengikuti diagram alur aplikasi. */
export const ALUR_UTAMA: TahapAlur[] = [
  {
    role: 'distributor',
    judul: 'Distributor menyusun rencana alokasi',
    langkah: [
      'Buka menu Rencana Alokasi, klik "Buat rencana alokasi".',
      'Pilih kecamatan, lalu klik "Isi dari rekap RDKK".',
      'Klik "Simpan rencana alokasi".',
    ],
    periksa:
      'Angka alokasi tidak dikira-kira: sistem menjumlahkan kebutuhan RDKK seluruh kelompok tani binaan tiap kios.',
    href: '/distributor/alokasi/baru',
    labelTombol: 'Buka form alokasi',
  },
  {
    role: 'distributor',
    judul: 'Distributor mengirim pupuk ke kios resmi',
    langkah: [
      'Buka menu Pengiriman, klik "Buat pengiriman".',
      'Pilih kios tujuan dan alokasi yang tadi dibuat.',
      'Klik "Isi sisa alokasi", lalu "Kirim & terbitkan faktur".',
    ],
    periksa:
      'Nomor faktur dan berita acara terbit otomatis. Status menjadi "Menunggu Konfirmasi" dan kios langsung menerima notifikasi.',
    href: '/distributor/pengiriman/baru',
    labelTombol: 'Buka form pengiriman',
  },
  {
    role: 'pengecer',
    judul: 'Pengecer mengonfirmasi penerimaan',
    langkah: [
      'Buka menu Penerimaan, pilih faktur yang menunggu konfirmasi.',
      'Cek jumlah tiap jenis pupuk terhadap faktur.',
      'Isi catatan, lalu klik "Konfirmasi penerimaan".',
    ],
    periksa:
      'Stok kios naik persis sejumlah yang dikonfirmasi, dan riwayat mutasi mencatat asal usulnya. Sebelum dikonfirmasi, stok tidak bertambah sama sekali.',
    href: '/pengecer/penerimaan',
    labelTombol: 'Buka daftar penerimaan',
  },
  {
    role: 'pengecer',
    judul: 'Pengecer menyalurkan ke kelompok tani',
    langkah: [
      'Buka menu Penyaluran, klik "Catat penyaluran".',
      'Pilih kelompok tani — sisa hak RDKK dan sisa stok kios langsung tampil.',
      'Isi jumlah, tanda tangani kotak penerima, klik "Simpan penyaluran".',
    ],
    periksa:
      'Stok kios berkurang, dan transaksi langsung muncul di layar kelompok tani untuk dikonfirmasi.',
    href: '/pengecer/penyaluran/baru',
    labelTombol: 'Buka form penyaluran',
  },
  {
    role: 'poktan',
    judul: 'Kelompok tani mengonfirmasi penerimaan',
    langkah: [
      'Buka menu Terima Pupuk, pilih transaksi yang menunggu.',
      'Periksa jenis, jumlah, dan kualitas pupuk.',
      'Pilih "Sesuai", tanda tangani sebagai ketua, klik "Konfirmasi penerimaan".',
    ],
    periksa:
      'Petani punya bukti terima digital. Transaksi kemudian masuk antrian validasi Pengawas KP3.',
    href: '/poktan/penerimaan',
    labelTombol: 'Buka daftar penerimaan',
  },
  {
    role: 'kp3',
    judul: 'Pengawas KP3 memvalidasi',
    langkah: [
      'Buka menu Validasi, pilih transaksi teratas pada antrian.',
      'Baca blok "Hasil pemeriksaan" — kelengkapan bukti diperiksa otomatis.',
      'Pilih "Valid", lalu klik "Simpan hasil validasi".',
    ],
    periksa:
      'Antrian berkurang satu dan angka pada halaman Laporan ikut bergerak. Di titik ini rantai selesai: tercatat, terkonfirmasi dua pihak, tervalidasi pengawas.',
    href: '/kp3/validasi',
    labelTombol: 'Buka antrian validasi',
  },
]

export interface UseCase {
  judul: string
  langkah: string[]
  hasil: string
  href: string
}

export const USE_CASE: Record<Role, UseCase[]> = {
  distributor: [
    {
      judul: 'Menyusun rencana alokasi per kecamatan',
      langkah: [
        'Pilih kecamatan dalam wilayah kerja.',
        'Isi jumlah per jenis pupuk untuk tiap kios, atau pakai rekap RDKK.',
        'Tetapkan periode musim tanam.',
      ],
      hasil: 'Alokasi menjadi dasar dan batas atas setiap pengiriman ke kios.',
      href: '/distributor/alokasi',
    },
    {
      judul: 'Mengirim pupuk dan menerbitkan dokumen',
      langkah: [
        'Pilih kios tujuan dan alokasi acuan.',
        'Isi muatan — dibatasi sisa alokasi kios.',
        'Kirim; faktur dan berita acara terbit otomatis.',
      ],
      hasil: 'Kios menerima notifikasi dan dapat langsung mengonfirmasi.',
      href: '/distributor/pengiriman',
    },
    {
      judul: 'Memantau serapan tiap kios binaan',
      langkah: [
        'Buka Dashboard, lihat tab "Serapan per pengecer".',
        'Bandingkan alokasi, diterima, dan tersalur.',
      ],
      hasil:
        'Ketahuan kios mana yang menahan stok — sesuatu yang tidak terlihat pada laporan manual.',
      href: '/distributor',
    },
  ],
  pengecer: [
    {
      judul: 'Mengonfirmasi kiriman dari distributor',
      langkah: [
        'Buka faktur pada daftar penerimaan.',
        'Sesuaikan jumlah bila fisiknya berbeda dari faktur.',
        'Konfirmasi, atau tolak kiriman disertai alasan.',
      ],
      hasil: 'Stok kios bertambah sesuai jumlah yang benar-benar diterima.',
      href: '/pengecer/penerimaan',
    },
    {
      judul: 'Memeriksa stok dan riwayat mutasi',
      langkah: [
        'Buka menu Stok Pengecer.',
        'Lihat tab "Riwayat mutasi" untuk menelusuri tiap pergerakan.',
      ],
      hasil:
        'Stok tidak pernah diketik manual, jadi angkanya tidak mungkin berbeda dengan buktinya.',
      href: '/pengecer/stok',
    },
    {
      judul: 'Menyalurkan pupuk sesuai RDKK',
      langkah: [
        'Pilih kelompok tani; sisa hak RDKK dan sisa stok tampil per jenis pupuk.',
        'Isi jumlah — sistem menolak angka yang melewati salah satu batas.',
        'Pilih metode bayar tunai atau Kartu Tani.',
      ],
      hasil: 'Penyaluran tepat sasaran dan tidak melebihi barang yang benar-benar ada.',
      href: '/pengecer/penyaluran/baru',
    },
    {
      judul: 'Menyimpan bukti serah terima',
      langkah: [
        'Tanda tangani kotak penerima pada form penyaluran.',
        'Unggah foto struk atau serah terima.',
      ],
      hasil: 'Bukti menjadi dasar validasi Pengawas KP3.',
      href: '/pengecer/penyaluran',
    },
  ],
  poktan: [
    {
      judul: 'Melihat hak tebus RDKK',
      langkah: [
        'Buka Dashboard, lihat tab "Hak tebus RDKK".',
        'Bandingkan hak, yang sudah ditebus, dan sisanya.',
      ],
      hasil: 'Kelompok tani tahu haknya sendiri, tidak bergantung catatan kios.',
      href: '/poktan',
    },
    {
      judul: 'Memeriksa dan mengonfirmasi penerimaan pupuk',
      langkah: [
        'Buka transaksi yang menunggu pada menu Terima Pupuk.',
        'Cek jenis, jumlah, dan kualitas.',
        'Tandai sesuai atau tidak sesuai, lalu tanda tangani sebagai ketua.',
      ],
      hasil:
        'Penerimaan bertanda tangan digital. Bila ditandai tidak sesuai, Pengawas KP3 langsung melihatnya.',
      href: '/poktan/penerimaan',
    },
    {
      judul: 'Melaporkan pemanfaatan pupuk',
      langkah: [
        'Buka menu Pemanfaatan, klik "Buat laporan".',
        'Pilih transaksi penebusan sebagai acuan agar jumlah terisi otomatis.',
        'Isi komoditas, luas tanam, dan tanggal aplikasi.',
      ],
      hasil: 'Data serapan di lapangan tersedia untuk analisis pengawas.',
      href: '/poktan/pemanfaatan',
    },
  ],
  kp3: [
    {
      judul: 'Memantau distribusi secara real-time',
      langkah: [
        'Buka Monitoring.',
        'Telusuri tab "Perlu perhatian", "Serapan kecamatan", dan "Aktivitas terbaru".',
      ],
      hasil: 'Penyimpangan terlihat saat kejadian, bukan setelah laporan bulanan masuk.',
      href: '/kp3',
    },
    {
      judul: 'Memvalidasi transaksi penyaluran',
      langkah: [
        'Buka antrian validasi, pilih satu transaksi.',
        'Baca hasil pemeriksaan kelengkapan bukti yang dijalankan otomatis.',
        'Putuskan: valid, perlu verifikasi lapangan, atau tidak valid.',
      ],
      hasil:
        'Keputusan tercatat lengkap dengan pengawas, tanggal, dan catatannya, serta terkirim ke kios dan kelompok tani.',
      href: '/kp3/validasi',
    },
    {
      judul: 'Membaca laporan dan analitik',
      langkah: [
        'Buka menu Laporan.',
        'Bandingkan serapan per kecamatan, per jenis pupuk, dan kepatuhan kios.',
      ],
      hasil: 'Kios dengan kepatuhan terendah muncul paling atas.',
      href: '/kp3/laporan',
    },
    {
      judul: 'Mencatat inspeksi lapangan',
      langkah: [
        'Buka menu Inspeksi Lapangan, klik "Catat inspeksi".',
        'Pilih lokasi, tambahkan temuan dari daftar contoh atau ketik sendiri.',
        'Tetapkan kesimpulan kesesuaian.',
      ],
      hasil: 'Hasil kunjungan tersimpan dan dapat dirujuk saat menerbitkan tindak lanjut.',
      href: '/kp3/inspeksi',
    },
    {
      judul: 'Menerbitkan tindak lanjut',
      langkah: [
        'Buka menu Tindak Lanjut, klik "Terbitkan tindak lanjut".',
        'Pilih jenis: teguran, rekomendasi, atau penghargaan.',
        'Tentukan pihak yang dituju dan uraikan isinya.',
      ],
      hasil: 'Pihak yang dituju langsung menerima notifikasi di aplikasinya.',
      href: '/kp3/tindak-lanjut',
    },
  ],
}

export interface UjiBatas {
  judul: string
  cara: string
  harapkan: string
}

/** Skenario yang membuktikan sistem menolak hal yang seharusnya ditolak. */
export const UJI_BATAS: UjiBatas[] = [
  {
    judul: 'Penerimaan dengan selisih',
    cara: 'Sebagai Pengecer, buka faktur yang menunggu lalu turunkan salah satu jumlah diterima di bawah angka faktur.',
    harapkan:
      'Muncul peringatan selisih, catatan menjadi wajib, status berubah "Diterima dengan Selisih", dan stok bertambah sesuai jumlah diterima — bukan angka faktur. Distributor serta Pengawas KP3 mendapat notifikasi.',
  },
  {
    judul: 'Menolak kiriman',
    cara: 'Pada layar yang sama, klik "Tolak kiriman" lalu isi alasannya.',
    harapkan: 'Alasan wajib diisi, dan stok kios sama sekali tidak bertambah.',
  },
  {
    judul: 'Penyaluran melebihi hak RDKK',
    cara: 'Sebagai Pengecer, pada form penyaluran isi jumlah lebih besar dari sisa hak RDKK kelompok tani.',
    harapkan: 'Kolom berubah merah dan tombol simpan mengunci sampai angkanya diturunkan.',
  },
  {
    judul: 'Penyaluran melebihi stok kios',
    cara: 'Isi jumlah lebih besar dari sisa stok, meski hak RDKK masih tersedia.',
    harapkan:
      'Ditolak juga. Dua pagar berlaku bersamaan: hak petani dan barang yang benar-benar ada.',
  },
  {
    judul: 'Kelompok tani menandai tidak sesuai',
    cara: 'Sebagai Kelompok Tani, saat konfirmasi pilih "Tidak sesuai".',
    harapkan:
      'Catatan wajib diisi, penerimaan tetap tercatat, dan transaksi muncul di daftar "Perlu perhatian" milik Pengawas KP3.',
  },
  {
    judul: 'Validasi mendahului konfirmasi kelompok tani',
    cara: 'Sebagai Pengawas KP3, buka transaksi yang masih berstatus "Menunggu Konfirmasi Poktan".',
    harapkan:
      'Form validasi terkunci disertai penjelasan bahwa urutannya belum terpenuhi.',
  },
  {
    judul: 'Transaksi bermasalah berlanjut ke tindak lanjut',
    cara: 'Sebagai Pengawas KP3, validasi sebuah transaksi dengan hasil "Tidak valid" disertai catatan.',
    harapkan:
      'Status menjadi "Bermasalah" dan muncul tombol untuk langsung menerbitkan tindak lanjut kepada kios terkait.',
  },
  {
    judul: 'Perlu verifikasi lapangan',
    cara: 'Pilih hasil validasi "Perlu verifikasi lapangan".',
    harapkan:
      'Keputusan tercatat, tetapi status transaksi sengaja tidak berubah — menunggu pengawas turun ke lapangan lebih dulu.',
  },
]

export const DI_LUAR_CAKUPAN = [
  'Autentikasi dan kata sandi sungguhan',
  'Peta sebaran alokasi dan penyaluran',
  'Grafik analitik (laporan disajikan sebagai angka dan tabel)',
  'Mode luring (PWA) untuk daerah bersinyal lemah',
  'Integrasi data e-Alokasi, e-Pubers, dan Kartu Tani',
  'Otorisasi antar-wilayah dan jejak audit terpisah',
]
