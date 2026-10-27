let semuaDataMobil = []; 
let selectedBrand = 'semua'; 
let wishlist = JSON.parse(localStorage.getItem('moncar_wishlist')) || [];

// Perbarui jumlah badge wishlist di menu atas saat halaman dimuat
updateWishlistCount();

// Fungsi untuk Mengganti Tampilan (View Switcher)
function switchView(viewName) {
    const viewBeranda = document.getElementById('view-beranda');
    const viewKatalog = document.getElementById('view-katalog');
    const viewFavorit = document.getElementById('view-favorit');
    const viewDetail = document.getElementById('view-detail');

    // Sembunyikan semua tampilan
    viewBeranda.style.display = 'none';
    viewKatalog.style.display = 'none';
    viewFavorit.style.display = 'none';
    viewDetail.style.display = 'none';

    if (viewName === 'beranda') {
        viewBeranda.style.display = 'block';
        window.scrollTo(0, 0);
    } else if (viewName === 'katalog') {
        viewKatalog.style.display = 'block';
        window.scrollTo(0, 0);
        if (semuaDataMobil.length === 0) {
            ambilDataMobil();
        }
    } else if (viewName === 'favorit') {
        viewFavorit.style.display = 'block';
        window.scrollTo(0, 0);
        tampilkanFavorit();
    } else if (viewName === 'detail') {
        viewDetail.style.display = 'block';
        window.scrollTo(0, 0);
    } else if (viewName === 'tentang') {
        viewBeranda.style.display = 'block';
        document.getElementById('tentang').scrollIntoView({ behavior: 'smooth' });
    } else if (viewName === 'kontak') {
        viewBeranda.style.display = 'block';
        document.getElementById('kontak').scrollIntoView({ behavior: 'smooth' });
    }
}

// Format harga ke Rupiah
function formatRupiah(harga) {
    if (!harga) return '-';
    let numberString = harga.toString().replace(/[^0-9]/g, '');
    if (!numberString) return harga;
    let formatted = parseInt(numberString, 10).toLocaleString('id-ID');
    return `Rp ${formatted}`;
}

// Ambil data dari API DNCC
async function ambilDataMobil() {
    const spinner = document.getElementById('loading-spinner');
    const container = document.getElementById('car-container');
    
    spinner.style.display = 'block';
    container.innerHTML = '';

    try {
        const response = await fetch('https://api-web.dnccudinus.org/api/mobil');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        semuaDataMobil = Array.isArray(result) ? result : (result.data || []);
        
        spinner.style.display = 'none';
        tampilkanMobil(semuaDataMobil, container);
    } catch (error) {
        console.error('Gagal mengambil data dari API DNCC:', error);
        spinner.style.display = 'none';
        container.innerHTML = '<p style="text-align:center; color:red;">Gagal terhubung ke API DNCC. Pastikan koneksi internet aktif.</p>';
    }
}

// Fungsi pembantu untuk membuat elemen kartu mobil
function buatKartuMobil(mobil) {
    const mobilBox = document.createElement('div');
    mobilBox.className = 'card-mobil';

    const urlFoto = mobil.foto || mobil.gambar || '';
    const namaMobil = mobil.nama || mobil.name || mobil.nama_mobil || 'Tanpa Nama';
    const brandMobil = mobil.brand || mobil.merk || '-';
    const hargaFormatted = formatRupiah(mobil.harga);
    
    // Cek apakah mobil ini ada di wishlist (berdasarkan nama atau id unik)
    const isFavorit = wishlist.some(item => (item.nama || item.name || item.nama_mobil) === namaMobil);

    mobilBox.innerHTML = `
        <button class="heart-btn ${isFavorit ? 'active' : ''}" title="Simpan ke Favorit">&hearts;</button>
        <div class="card-mobil-body">
            <img src="${urlFoto}" alt="${namaMobil}" class="img-mobil" onerror="this.src='https://via.placeholder.com/600x400?text=Gambar+Tidak+Tersedia'">
            <div class="mobil-header-info">
                <h2>${namaMobil}</h2>
                <span class="badge-brand">${brandMobil}</span>
            </div>
            <div class="mobil-details-grid">
                <p><strong>Status:</strong> ${mobil.status || '-'}</p>
                <p><strong>Tahun:</strong> ${mobil.tahun || '-'}</p>
                <p><strong>Transmisi:</strong> ${mobil.transmisi || '-'}</p>
                <p><strong>Bahan Bakar:</strong> ${mobil.bahan_bakar || '-'}</p>
            </div>
            <p style="margin: 15px 0 0 0;"><strong>Harga:</strong> <span class="harga-text">${hargaFormatted}</span></p>
            <p style="font-size: 13px; color: #0284c7; margin: 5px 0 0 0; text-align: right; font-weight: 600;">Klik kartu untuk lihat rincian &rarr;</p>
        </div>
    `;

    // Tombol Favorit (Ikon Hati)
    const heartBtn = mobilBox.querySelector('.heart-btn');
    heartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah klik kartu terbuka
        toggleWishlist(mobil, heartBtn);
    });

    // Klik bodi kartu menuju halaman detail
    const bodyCard = mobilBox.querySelector('.card-mobil-body');
    bodyCard.addEventListener('click', () => {
        tampilkanDetailMobil(mobil);
    });

    return mobilBox;
}

// Tampilkan daftar mobil di katalog
function tampilkanMobil(data, container) {
    container.innerHTML = '';
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding: 20px;">Mobil tidak ditemukan.</p>';
        return;
    }
    data.forEach(mobil => {
        container.appendChild(buatKartuMobil(mobil));
    });
}

// Toggle Wishlist (Tambah/Hapus Favorit)
function toggleWishlist(mobil, btnElement) {
    const namaMobil = mobil.nama || mobil.name || mobil.nama_mobil;
    const index = wishlist.findIndex(item => (item.nama || item.name || item.nama_mobil) === namaMobil);

    if (index === -1) {
        wishlist.push(mobil);
        btnElement.classList.add('active');
    } else {
        wishlist.splice(index, 1);
        btnElement.classList.remove('active');
    }

    localStorage.setItem('moncar_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();

    // Jika sedang di halaman favorit, refresh tampilannya
    if (document.getElementById('view-favorit').style.display === 'block') {
        tampilkanFavorit();
    }
}

function updateWishlistCount() {
    const badge = document.getElementById('wishlist-count');
    if (badge) badge.innerText = wishlist.length;
}

// Tampilkan halaman mobil favorit
function tampilkanFavorit() {
    const container = document.getElementById('favorit-container');
    container.innerHTML = '';

    if (wishlist.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding: 30px;">Belum ada mobil favorit yang disimpan. Silakan klik ikon hati pada katalog!</p>';
        return;
    }

    wishlist.forEach(mobil => {
        container.appendChild(buatKartuMobil(mobil));
    });
}

// Tampilkan Detail Mobil + Kalkulator Kredit + Tombol WhatsApp
function tampilkanDetailMobil(mobil) {
    const detailContainer = document.getElementById('detail-content-container');
    
    const urlFoto = mobil.foto || mobil.gambar || '';
    const namaMobil = mobil.nama || mobil.name || mobil.nama_mobil || 'Tanpa Nama';
    const brandMobil = mobil.brand || mobil.merk || '-';
    const hargaFormatted = formatRupiah(mobil.harga);
    
    // Angka mentah harga untuk perhitungan kalkulator kredit
    let rawHarga = parseInt((mobil.harga || '0').toString().replace(/[^0-9]/g, ''), 10) || 150000000;

    detailContainer.innerHTML = `
        <div class="detail-card-layout">
            <img src="${urlFoto}" alt="${namaMobil}" class="detail-img" onerror="this.src='https://via.placeholder.com/600x400?text=Gambar+Tidak+Tersedia'">
            
            <div class="detail-info-box">
                <div class="mobil-header-info">
                    <h2>${namaMobil}</h2>
                    <span class="badge-brand">${brandMobil}</span>
                </div>

                <div class="detail-specs-box">
                    <p><strong>Status Unit:</strong> ${mobil.status || '-'}</p>
                    <p><strong>Tahun Pembuatan:</strong> ${mobil.tahun || '-'}</p>
                    <p><strong>Sistem Transmisi:</strong> ${mobil.transmisi || '-'}</p>
                    <p><strong>Jenis Bahan Bakar:</strong> ${mobil.bahan_bakar || '-'}</p>
                </div>

                <p style="margin-bottom: 15px;"><strong>Penawaran Harga:</strong> <span class="harga-text" style="font-size: 1.4rem;">${hargaFormatted}</span></p>

                <div class="unggulan-box">
                    <h3>Keunggulan & Rekomendasi Kecocokan</h3>
                    <p>
                        Mobil <strong>${namaMobil}</strong> dari lini <strong>${brandMobil}</strong> merupakan salah satu pilihan terbaik di kelasnya. 
                        Kendaraan ini dirancang dengan teknologi modern yang menawarkan kenyamanan berkendara optimal, efisiensi bahan bakar yang baik, 
                        serta performa mesin yang tangguh untuk perjalanan dalam kota maupun jarak jauh.
                    </p>
                </div>

                <!-- Kalkulator Simulasi Kredit Mini -->
                <div class="credit-box">
                    <h3>Simulasi Kredit / Cicilan Bulanan</h3>
                    <label style="font-size: 14px; color: #475569;">Pilih Jangka Waktu (Tenor):</label>
                    <select id="tenor-select" style="padding: 8px; width: 100%; margin-top: 5px; border-radius: 6px; border: 1px solid #cbd5e1;">
                        <option value="12">1 Tahun (12 Bulan)</option>
                        <option value="24" selected>2 Tahun (24 Bulan)</option>
                        <option value="36">3 Tahun (36 Bulan)</option>
                        <option value="60">5 Tahun (60 Bulan)</option>
                    </select>
                    <div id="hasil-cicilan" class="credit-result">Estimasi Cicilan: Menghitung...</div>
                </div>

                <!-- Tombol Pesan Langsung via WhatsApp -->
                <a id="wa-booking-btn" href="#" target="_blank" class="whatsapp-btn">
                    Pesan / Tanya Unit via WhatsApp
                </a>
            </div>
        </div>
    `;

    // Logika perhitungan kalkulator kredit
    const tenorSelect = document.getElementById('tenor-select');
    const hasilCicilan = document.getElementById('hasil-cicilan');
    const waBtn = document.getElementById('wa-booking-btn');

    function hitungCicilan() {
        const tenorBulan = parseInt(tenorSelect.value, 10);
        // Asumsi DP 20% dan bunga flat ringan 6% per tahun
        const pokokHutang = rawHarga * 0.8; 
        const totalBunga = pokokHutang * (0.06 * (tenorBulan / 12));
        const cicilanPerBulan = (pokokHutang + totalBunga) / tenorBulan;
        
        hasilCicilan.innerText = `Estimasi Cicilan: ${formatRupiah(Math.round(cicilanPerBulan))} / bulan (DP 20%)`;
        
        // Buat link WhatsApp pre-filled otomatis
        const pesanWA = `Halo MON-CAR Showroom, saya tertarik dengan mobil ${namaMobil} (${brandMobil}) seharga ${hargaFormatted}. Mohon informasi ketersediaan unit dan prosedurnya. Terima kasih!`;
        waBtn.href = `https://wa.me/6281234567890?text=${encodeURIComponent(pesanWA)}`;
    }

    tenorSelect.addEventListener('change', hitungCicilan);
    hitungCicilan(); // Hitung pertama kali

    switchView('detail');
}

// Fungsi Filter Pencarian & Merek
function filterData() {
    const keyword = document.getElementById('search-input').value.toLowerCase().trim();
    
    const hasilFilter = semuaDataMobil.filter(mobil => {
        const namaMobil = (mobil.nama || mobil.name || mobil.nama_mobil || '').toLowerCase();
        const brandMobil = (mobil.brand || mobil.merk || '').toLowerCase();
        
        const cocokNama = namaMobil.includes(keyword);
        const cocokBrand = selectedBrand === 'semua' || brandMobil === selectedBrand.toLowerCase();
        
        return cocokNama && cocokBrand;
    });

    tampilkanMobil(hasilFilter, document.getElementById('car-container'));
}

document.getElementById('search-input').addEventListener('input', filterData);

const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        selectedBrand = e.target.getAttribute('data-brand');
        filterData();
    });
});