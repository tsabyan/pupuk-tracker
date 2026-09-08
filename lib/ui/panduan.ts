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
      'Di titik ini rantai distribusi SELESAI: tercatat, berbukti, dan disetujui kedua pihak transaksi. Tidak ada pihak ketiga yang perlu menyetujui — status langsung menjadi "Selesai".',
    href: '/poktan/penerimaan',
    labelTombol: 'Buka daftar penerimaan',
  },
  {
    role: 'kp3',
    judul: 'Pengawas KP3 memilih objek pengawasan',
    langkah: [
      'Buka menu Objek Pengawasan, lihat tab "Bertanda penapisan".',
      'Buka satu transaksi — sistem sudah mengujinya terhadap tujuh tepat.',
      'Simpan hasil telaah, atau klik "Jadikan objek pemeriksaan lapangan".',
    ],
    periksa:
      'Perhatikan bahwa transaksinya sudah berstatus "Selesai" sebelum pengawas menyentuhnya. Pengawasan berjalan di atas transaksi yang sudah tuntas, dengan uji petik — karena itu yang diukur adalah cakupan pengawasan, bukan panjang antrian.',
    href: '/kp3/objek',
    labelTombol: 'Buka objek pengawasan',
  },
  {
    role: 'kp3',
    judul: 'Pengawas KP3 menerbitkan berita acara',
    langkah: [
      'Buka menu Pemeriksaan, klik "Catat pemeriksaan".',
      'Pilih objek — bisa kios, gudang distributor, kelompok tani, atau petani.',
      'Isi hitung stok fisik dan harga jual yang benar-benar dibayar petani.',
      'Tanda tangani berita acara, lalu klik "Terbitkan berita acara".',
    ],
    periksa:
      'Panel "Pratinjau berita acara" menyusun temuan dan kesimpulan sendiri dari angka yang Anda isi. Coba naikkan harga jual Urea di atas HET: temuan aspek "tepat harga" muncul seketika — hal yang tidak mungkin terbaca dari data transaksi, karena di sana harga selalu tercatat sebesar HET.',
    href: '/kp3/pemeriksaan/baru',
    labelTombol: 'Buka form pemeriksaan',
  },
  {
    role: 'kp3',
    judul: 'Pengawas KP3 menutup lingkaran pengawasan',
    langkah: [
      'Buka menu Temuan, pilih satu temuan terbuka, klik "Tindak lanjuti".',
      'Klik "Susun draf dari temuan", tetapkan tenggat perbaikan.',
      'Terbitkan, lalu buka suratnya dan perbarui status pelaksanaannya.',
    ],
    periksa:
      'Temuan berpindah dari "Terbuka" ke "Ditindaklanjuti", lalu ke "Selesai" begitu suratnya dinyatakan tuntas beserta bukti pelaksanaannya. Surat yang lewat tenggat ditandai sendiri dan bisa dieskalasi ke Satgas Pangan atau aparat penegak hukum.',
    href: '/kp3/temuan',
    labelTombol: 'Buka register temuan',
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
      hasil: 'Bukti menjadi bahan telaah dan uji petik Pengawas KP3.',
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
        'Penerimaan bertanda tangan digital dan transaksi langsung tuntas. Bila ditandai tidak sesuai, statusnya menjadi "Disanggah" dan Pengawas KP3 langsung mendapat pemberitahuan.',
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
      judul: 'Memilih objek pengawasan dari hasil penapisan',
      langkah: [
        'Buka Objek Pengawasan; sistem sudah menguji tiap transaksi selesai terhadap tujuh tepat.',
        'Baca penanda pada tab "Bertanda penapisan" — itu alasan berbasis data, bukan dugaan.',
        'Telaah dokumennya, atau jadikan objek pemeriksaan lapangan.',
      ],
      hasil:
        'Uji petik jadi terarah. Cakupan pengawasan terukur tanpa memaksa setiap transaksi melewati meja pengawas.',
      href: '/kp3/objek',
    },
    {
      judul: 'Memeriksa stok fisik terhadap catatan sistem',
      langkah: [
        'Buka Pemeriksaan, pilih objek jenis "Pengecer resmi".',
        'Angka sistem sudah terisi dari riwayat transaksi; isi hasil hitung fisik gudang.',
      ],
      hasil:
        'Selisih stok langsung menjadi temuan berkategori, dengan tingkat yang dinilai dari besar simpangannya.',
      href: '/kp3/pemeriksaan/baru',
    },
    {
      judul: 'Mengawasi harga jual dan pungutan tambahan',
      langkah: [
        'Pada form pemeriksaan, isi harga yang benar-benar dibayar petani.',
        'Isi juga pungutan di luar harga pupuk bila ada.',
      ],
      hasil:
        'Pelanggaran HET terdokumentasi. Ini satu-satunya jalannya: data transaksi selalu mencatat HET, jadi kios yang menjual lebih mahal tidak akan pernah melaporkannya sendiri.',
      href: '/kp3/pemeriksaan/baru',
    },
    {
      judul: 'Memverifikasi penerima terhadap RDKK',
      langkah: [
        'Pilih objek jenis "Kelompok tani" atau "Petani penerima".',
        'Hak dan penebusan terisi dari RDKK; tandai penerima yang tidak terdaftar.',
      ],
      hasil:
        'Penebusan oleh pihak yang tidak berhak tercatat sebagai temuan bertingkat berat.',
      href: '/kp3/pemeriksaan/baru',
    },
    {
      judul: 'Menerbitkan berita acara lintas instansi',
      langkah: [
        'Isi instansi pendamping — pengawasan KP3 dijalankan bersama dinas dan aparat terkait.',
        'Tanda tangani berita acara bersama pihak yang diperiksa.',
      ],
      hasil:
        'Berita acara, temuan, dan kesimpulan terbit sebagai satu dokumen yang bisa dirujuk tindak lanjut.',
      href: '/kp3/pemeriksaan',
    },
    {
      judul: 'Melacak temuan sampai tuntas',
      langkah: [
        'Buka Temuan, baca sebaran menurut tujuh tepat.',
        'Terbitkan tindak lanjut dengan tenggat, lalu perbarui status pelaksanaannya.',
      ],
      hasil:
        'Lingkaran pengawasan tertutup: temuan → rekomendasi → pelaksanaan → verifikasi. Inilah yang dinilai pada maturitas SPIP.',
      href: '/kp3/temuan',
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
    judul: 'Kelompok tani menyanggah penerimaan',
    cara: 'Sebagai Kelompok Tani, saat konfirmasi pilih "Tidak sesuai".',
    harapkan:
      'Catatan wajib diisi, penerimaan tetap tercatat, status menjadi "Disanggah", dan transaksi muncul di daftar "Perlu perhatian" milik Pengawas KP3.',
  },
  {
    judul: 'Pengawasan tidak pernah menahan transaksi',
    cara: 'Sebagai Pengawas KP3, buka transaksi yang masih berstatus "Menunggu Konfirmasi Poktan" dari halaman Objek Pengawasan.',
    harapkan:
      'Form telaah terkunci disertai penjelasan bahwa belum ada yang bisa ditelaah — dan bahwa transaksi itu pun tidak sedang menunggu pengawas. Ini pembeda pokoknya: KP3 mengawasi setelah transaksi tuntas, tidak menyetujuinya.',
  },
  {
    judul: 'Pelanggaran HET tidak terbaca dari data sistem',
    cara: 'Sebagai Pengawas KP3, buka satu transaksi pada Objek Pengawasan dan baca butir "Tepat harga" pada penapisan.',
    harapkan:
      'Butirnya lolos, tetapi keterangannya menyatakan hanya kebenaran hitungan yang teruji. Harga jual sebenarnya baru terbukti lewat form pemeriksaan lapangan atau pengaduan petani.',
  },
  {
    judul: 'Tindak lanjut selesai tanpa bukti pelaksanaan',
    cara: 'Buka satu tindak lanjut, pilih status "Selesai", biarkan keterangan pelaksanaan kosong, lalu simpan.',
    harapkan:
      'Ditolak. Status selesai berarti perbaikan diverifikasi pengawas, jadi buktinya wajib ada.',
  },
  {
    judul: 'Membuka kembali tindak lanjut yang sudah selesai',
    cara: 'Buka tindak lanjut berstatus "Selesai".',
    harapkan:
      'Tidak ada pilihan status berikutnya. Riwayat pengawasan tidak boleh diputar balik.',
  },
  {
    judul: 'Surat koreksi tanpa rujukan temuan',
    cara: 'Terbitkan tindak lanjut jenis "Teguran" tanpa mencentang satu pun temuan.',
    harapkan:
      'Tombol terbit mengunci. Teguran tanpa temuan tidak bisa diverifikasi pelaksanaannya — hanya penghargaan yang boleh tanpa rujukan temuan.',
  },
]

export const DI_LUAR_CAKUPAN = [
  'Autentikasi dan kata sandi sungguhan',
  'Kanal pengaduan masyarakat (WA, telepon, surat) dan disposisinya',
  'Rencana pengawasan tahunan dan penentuan objek berbasis jadwal',
  'Laporan hasil pengawasan sebagai dokumen periodik yang diterbitkan',
  'Peta sebaran alokasi dan penyaluran',
  'Grafik analitik (laporan disajikan sebagai angka dan tabel)',
  'Mode luring (PWA) untuk daerah bersinyal lemah',
  'Integrasi data e-Alokasi, e-Pubers, dan Kartu Tani',
  'Otorisasi antar-wilayah dan jejak audit terpisah',
]
