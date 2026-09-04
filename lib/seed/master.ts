/**
 * Data master sintetis: wilayah, jenis pupuk, aktor rantai distribusi,
 * petani, dan RDKK satu musim tanam.
 *
 * Wilayah memakai nama kecamatan dan desa yang sebenarnya ada di Kabupaten
 * Sampang supaya pemangku kepentingan mengenali medannya. Nama pelaku usaha,
 * kelompok tani, petani, dan seluruh transaksinya tetap rekaan.
 */

import type {
  Desa,
  Distributor,
  JenisPupuk,
  Kecamatan,
  KelompokTani,
  Pengawas,
  Pengecer,
  Petani,
  Rdkk,
  User,
} from '@/lib/domain/types'
import { buatRng } from './rng'

/** Tanggal acuan seluruh data demo. */
export const TANGGAL_ACUAN = '2026-09-03'
export const MUSIM_TANAM = 'MT-2'
export const TAHUN_MUSIM = 2026
export const PERIODE_MULAI = '2026-07-01'
export const PERIODE_SELESAI = '2026-12-31'
export const KABUPATEN = 'Kabupaten Sampang'
export const PROVINSI = 'Jawa Timur'
/** Kode wilayah Kabupaten Sampang, dipakai sebagai awalan NIK. */
const KODE_KABUPATEN = '3527'

export const KECAMATAN: Kecamatan[] = [
  { id: 'kec-01', kode: '04', nama: 'Sampang' },
  { id: 'kec-02', kode: '05', nama: 'Camplong' },
  { id: 'kec-03', kode: '06', nama: 'Omben' },
  { id: 'kec-04', kode: '07', nama: 'Kedungdung' },
]

export const DESA: Desa[] = [
  { id: 'desa-01', nama: 'Banyuanyar', kecamatanId: 'kec-01' },
  { id: 'desa-02', nama: 'Gunung Sekar', kecamatanId: 'kec-01' },
  { id: 'desa-03', nama: 'Kamoning', kecamatanId: 'kec-01' },
  { id: 'desa-04', nama: 'Taddan', kecamatanId: 'kec-02' },
  { id: 'desa-05', nama: 'Sejati', kecamatanId: 'kec-02' },
  { id: 'desa-06', nama: 'Prajjan', kecamatanId: 'kec-02' },
  { id: 'desa-07', nama: 'Kamondung', kecamatanId: 'kec-03' },
  { id: 'desa-08', nama: 'Angsokah', kecamatanId: 'kec-03' },
  { id: 'desa-09', nama: 'Rapa Laok', kecamatanId: 'kec-03' },
  { id: 'desa-10', nama: 'Gunung Eleh', kecamatanId: 'kec-04' },
  { id: 'desa-11', nama: 'Kramat', kecamatanId: 'kec-04' },
  { id: 'desa-12', nama: 'Batoporo Timur', kecamatanId: 'kec-04' },
]

export const JENIS_PUPUK: JenisPupuk[] = [
  { id: 'pk-urea', kode: 'UREA', nama: 'Urea Bersubsidi', satuan: 'kg', het: 2250 },
  { id: 'pk-npk', kode: 'NPK', nama: 'NPK Phonska', satuan: 'kg', het: 2300 },
  { id: 'pk-npkfk', kode: 'NPK-FK', nama: 'NPK Formula Khusus', satuan: 'kg', het: 3300 },
  { id: 'pk-organik', kode: 'ORG', nama: 'Pupuk Organik Granul', satuan: 'kg', het: 800 },
]

export const DISTRIBUTOR: Distributor[] = [
  {
    id: 'dist-01',
    kode: 'D-SPG-01',
    nama: 'PT Sampang Agro Niaga',
    produsen: 'PT Petrokimia Gresik',
    alamat: 'Jl. Rajawali No. 45, Gunung Sekar, Sampang',
    telepon: '0323-321145',
    kecamatanIds: ['kec-01', 'kec-02'],
  },
  {
    id: 'dist-02',
    kode: 'D-SPG-02',
    nama: 'PT Madura Tani Sejahtera',
    produsen: 'PT Petrokimia Gresik',
    alamat: 'Jl. Raya Omben No. 12, Omben, Sampang',
    telepon: '0323-327880',
    kecamatanIds: ['kec-03', 'kec-04'],
  },
]

const NAMA_KIOS = [
  ['Kios Tani Barokah', 'H. Moh. Hasan', 'desa-01', 'dist-01'],
  ['UD Sumber Rejeki', 'Siti Aisyah', 'desa-02', 'dist-01'],
  ['Kios Al-Hidayah', 'Abd. Rahman', 'desa-04', 'dist-01'],
  ['UD Madura Makmur', 'Fatimah', 'desa-05', 'dist-01'],
  ['Kios Tani Jaya', 'Moh. Saiful', 'desa-07', 'dist-02'],
  ['UD Nurul Falah', 'Hosniyah', 'desa-08', 'dist-02'],
  ['Kios Mitra Tani', 'Junaidi', 'desa-10', 'dist-02'],
  ['UD Karya Tani', 'Mahmudi', 'desa-11', 'dist-02'],
] as const

export const PENGECER: Pengecer[] = NAMA_KIOS.map(
  ([nama, pemilik, desaId, distributorId], i) => {
    const desa = DESA.find((d) => d.id === desaId)!
    const kecamatan = KECAMATAN.find((k) => k.id === desa.kecamatanId)!
    return {
      id: `kios-${String(i + 1).padStart(2, '0')}`,
      kode: `PR-${String(i + 1).padStart(3, '0')}`,
      nama,
      pemilik,
      alamat: `Jl. Raya ${desa.nama} No. ${10 + i * 3}, ${kecamatan.nama}`,
      desaId,
      distributorId,
      telepon: `0813${String(52000000 + i * 137).slice(0, 8)}`,
    }
  },
)

const NAMA_POKTAN = [
  'Barokah', 'Al-Hidayah', 'Sumber Makmur', 'Tani Mulya',
  'Nurul Iman', 'Sejahtera Bersama', 'Al-Ikhlas', 'Karya Bakti',
  'Bina Tani', 'Harapan Jaya', 'Mekar Sari', 'Tunas Harapan',
  'Sido Makmur', 'Rukun Santoso', 'Manunggal Tani', 'Sri Rejeki',
  'Guyub Rukun', 'Amanah Tani', 'Tani Makmur', 'Subur Jaya',
  'Maju Bersama', 'Sumber Urip', 'Mandiri Pangan', 'Bhakti Tani',
]

const NAMA_KETUA = [
  'H. Moh. Sanusi', 'Abd. Hamid', 'Fathorrahman', 'Siti Maimunah',
  'Moh. Rusdi', 'Hosnan', 'Junaidi', 'Mahmudi',
  'Nur Hasanah', 'Abd. Basit', 'Moh. Fauzan', 'Marsuki',
  'Slamet Riyadi', 'Sahabuddin', 'Musleh', "Halimatus Sa'diyah",
  'Moh. Bahri', 'Sujak', 'Rohmatullah', 'Mistar',
  'Abd. Latif', 'Moh. Hasyim', 'Suparno', 'Zainal Abidin',
]

/**
 * Hanya komoditas yang berhak menerima pupuk bersubsidi menurut ketentuan
 * yang berlaku. Tembakau — meski besar di Sampang — sengaja tidak masuk
 * karena bukan komoditas penerima subsidi.
 */
const KOMODITAS = [
  'Padi Sawah',
  'Jagung',
  'Kedelai',
  'Cabai Rawit',
  'Bawang Merah',
  'Tebu Rakyat',
]

/**
 * Setiap desa memiliki 2 kelompok tani, dan poktan dibagi rata ke kios
 * resmi dalam kecamatan yang sama — mencerminkan pembinaan kios yang
 * berimbang, bukan satu kios menanggung seluruh kecamatan.
 */
const giliranKios = new Map<string, number>()

export const KELOMPOK_TANI: KelompokTani[] = NAMA_POKTAN.map((nama, i) => {
  const rng = buatRng(9100 + i)
  const desa = DESA[i % DESA.length]

  const kiosKecamatan = PENGECER.filter(
    (p) => DESA.find((d) => d.id === p.desaId)?.kecamatanId === desa.kecamatanId,
  )
  const giliran = giliranKios.get(desa.kecamatanId) ?? 0
  giliranKios.set(desa.kecamatanId, giliran + 1)
  const kios = kiosKecamatan[giliran % kiosKecamatan.length] ?? PENGECER[0]

  return {
    id: `poktan-${String(i + 1).padStart(2, '0')}`,
    kode: `KT-${String(i + 1).padStart(3, '0')}`,
    nama: `Poktan ${nama}`,
    ketua: NAMA_KETUA[i],
    desaId: desa.id,
    pengecerId: kios.id,
    jumlahAnggota: rng.int(10, 18),
    luasLahanHa: Number((rng.int(80, 260) / 10).toFixed(1)),
  }
})

const NAMA_DEPAN = [
  'Abd. Rahman', 'Ahmadi', 'Bahri', 'Fauzan', 'Hasan', 'Hosnan',
  'Junaidi', 'Kholil', 'Mahmudi', 'Marsuki', 'Misnadi', 'Moh. Ali',
  'Musleh', 'Rusdi', 'Sahwan', 'Saiful', 'Sanusi', 'Slamet',
  'Sujak', 'Suparno', 'Zainuddin',
  'Halimah', 'Hosniyah', 'Maimunah', 'Nur Aini', 'Siti Fatimah',
]

const NAMA_BELAKANG = [
  'Anwar', 'Basri', 'Efendi', 'Firdaus', 'Hidayat', 'Maulana',
  'Ridwan', 'Saputra', 'Wahid', 'Yusuf', 'Zainal', 'Amin',
]

/** Nama yang menandakan pemegangnya perempuan — memengaruhi pola NIK. */
const AWALAN_PEREMPUAN = ['Halimah', 'Hosniyah', 'Maimunah', 'Nur Aini', 'Siti']

/** ~13 petani per kelompok tani. */
export const PETANI: Petani[] = (() => {
  const hasil: Petani[] = []
  let urut = 1

  for (const poktan of KELOMPOK_TANI) {
    const rng = buatRng(4400 + Number(poktan.id.slice(-2)))

    const desa = DESA.find((d) => d.id === poktan.desaId)
    const kodeKecamatan =
      KECAMATAN.find((k) => k.id === desa?.kecamatanId)?.kode ?? '04'

    for (let i = 0; i < poktan.jumlahAnggota; i++) {
      const depan = rng.pilih(NAMA_DEPAN)
      const nama = `${depan} ${rng.pilih(NAMA_BELAKANG)}`

      // Pada NIK, tanggal lahir perempuan ditambah 40.
      const perempuan = AWALAN_PEREMPUAN.some((a) => depan.startsWith(a))
      const hari = rng.int(1, 28) + (perempuan ? 40 : 0)
      const bulan = rng.int(1, 12)
      const tahun = rng.int(60, 95)

      hasil.push({
        id: `petani-${String(urut).padStart(4, '0')}`,
        nik:
          KODE_KABUPATEN +
          kodeKecamatan +
          String(hari).padStart(2, '0') +
          String(bulan).padStart(2, '0') +
          String(tahun).padStart(2, '0') +
          String(urut).padStart(4, '0'),
        nama,
        poktanId: poktan.id,
        luasLahanHa: Number((rng.int(3, 15) / 10).toFixed(1)),
        komoditas: rng.pilih(KOMODITAS),
      })
      urut++
    }
  }

  return hasil
})()

export const PENGAWAS: Pengawas[] = [
  {
    id: 'pengawas-01',
    nama: 'Ir. Moh. Sahwan',
    nip: '19780412 200604 1 003',
    instansi: 'Dinas Pertanian dan Ketahanan Pangan Kabupaten Sampang',
    jabatan: 'Ketua Pelaksana KP3',
    kecamatanIds: KECAMATAN.map((k) => k.id),
  },
  {
    id: 'pengawas-02',
    nama: 'Nur Aini Rahmawati, S.P.',
    nip: '19850830 201001 2 007',
    instansi: 'Dinas Perindustrian dan Perdagangan Kabupaten Sampang',
    jabatan: 'Anggota KP3',
    kecamatanIds: ['kec-01', 'kec-02'],
  },
  {
    id: 'pengawas-03',
    nama: 'Aiptu Abd. Karim',
    nip: '19800215 200312 1 005',
    instansi: 'Polres Sampang',
    jabatan: 'Anggota KP3',
    kecamatanIds: ['kec-03', 'kec-04'],
  },
]

function slugEmail(nama: string): string {
  return nama
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
}

export const USERS: User[] = [
  ...DISTRIBUTOR.map((d, i) => ({
    id: `user-dist-${i + 1}`,
    nama: i === 0 ? 'Moh. Hendra Wijaya' : 'Maya Rosalina',
    email: `${i === 0 ? 'hendra' : 'maya'}@${i === 0 ? 'sampangagro' : 'maduratani'}.co.id`,
    role: 'distributor' as const,
    entityId: d.id,
    jabatan: 'Staf Distribusi',
  })),
  ...PENGECER.map((p, i) => ({
    id: `user-kios-${i + 1}`,
    nama: p.pemilik,
    email: `${slugEmail(p.pemilik)}@kios.id`,
    role: 'pengecer' as const,
    entityId: p.id,
    jabatan: 'Pemilik Kios',
  })),
  ...KELOMPOK_TANI.map((k, i) => ({
    id: `user-poktan-${i + 1}`,
    nama: k.ketua,
    email: `${slugEmail(k.ketua)}@poktan.id`,
    role: 'poktan' as const,
    entityId: k.id,
    jabatan: 'Ketua Kelompok Tani',
  })),
  ...PENGAWAS.map((p, i) => ({
    id: `user-kp3-${i + 1}`,
    nama: p.nama,
    email: `${slugEmail(p.nama.replace(/^(Ir\.|Aiptu)\s*/, ''))}@kp3.go.id`,
    role: 'kp3' as const,
    entityId: p.id,
    jabatan: p.jabatan,
  })),
]

/** Akun yang ditawarkan di halaman login untuk demo. */
export const AKUN_DEMO = {
  distributor: 'user-dist-1',
  pengecer: 'user-kios-1',
  poktan: 'user-poktan-1',
  kp3: 'user-kp3-1',
} as const

/**
 * RDKK: hak tebus tiap kelompok tani untuk satu musim tanam.
 * Besarannya proporsional terhadap luas lahan poktan.
 */
export const RDKK: Rdkk[] = KELOMPOK_TANI.map((poktan, i) => {
  const rng = buatRng(7700 + i)
  const ha = poktan.luasLahanHa

  return {
    id: `rdkk-${String(i + 1).padStart(3, '0')}`,
    kode: `RDKK/${MUSIM_TANAM}/${TAHUN_MUSIM}/${poktan.kode}`,
    poktanId: poktan.id,
    musimTanam: MUSIM_TANAM,
    tahun: TAHUN_MUSIM,
    disahkanPada: '2026-06-20',
    items: [
      { jenisPupukId: 'pk-urea', jumlahKg: Math.round((ha * rng.int(180, 220)) / 25) * 25 },
      { jenisPupukId: 'pk-npk', jumlahKg: Math.round((ha * rng.int(140, 190)) / 25) * 25 },
      { jenisPupukId: 'pk-npkfk', jumlahKg: Math.round((ha * rng.int(30, 60)) / 25) * 25 },
      { jenisPupukId: 'pk-organik', jumlahKg: Math.round((ha * rng.int(90, 130)) / 25) * 25 },
    ],
  }
})
