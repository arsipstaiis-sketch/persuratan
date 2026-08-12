// --- FUNGSI DEBOUNCE PENCARIAN ---
let debounceTimer;
function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        renderTabelArsip();
    }, 300);
}

// --- FUNGSI UTAMA SISTEM ---
const urlAPI = "https://script.google.com/macros/s/AKfycbyKRnIKopECo_pADMEP_Cw5soGivDREjgO_2TtmaJkbA2Ru-7mDz6bSlimcVi7FPLh_HQ/exec";
window.arsipGlobal = [];
window.currentSort = 'terbaru';

// --- VARIABEL PAGINATION (BARU) ---
let dataArsipTampil = []; 
let halamanSaatIni = 1;
const barisPerHalaman = 7;

const tableWrapper = document.getElementById('tableScrollWrapper');
const mainTable = document.getElementById('mainTable');

function showToast(pesan) {
    const toast = document.getElementById("toastNotification") || document.getElementById("toast");
    const toastMsg = document.getElementById("toastMessage");
    if (toastMsg) toastMsg.innerText = pesan;
    else toast.innerText = pesan;
    
    toast.className = "toast-notification show";
    setTimeout(() => { toast.className = toast.className.replace("show", "").trim(); }, 3000);
}

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
    
    const resultBox = document.getElementById('resultBox');
    if (resultBox) resultBox.style.display = 'none';
    
    const formNomor = document.getElementById('formPenomoran');
    if (formNomor) formNomor.reset();

    const formUpload = document.getElementById('formUpload');
    if (formUpload) formUpload.reset();

    const pencarian = document.getElementById('searchInput');
    if (pencarian && pencarian.value !== '') {
        pencarian.value = '';
        if (typeof renderTabelArsip === "function") {
            renderTabelArsip(); 
        }
    }
}

function toggleFilterMenu() {
    const menu = document.getElementById('filterMenu');
    menu.classList.toggle('show');
}

function updateFilterButtonState() {
    const fDivisi = document.getElementById('filterDivisi').value;
    const fJenis = document.getElementById('filterJenis').value;
    const fTA = document.getElementById('filterTahunAkademik').value;
    const fBerkas = document.getElementById('filterBerkas').value;
    const filterBtn = document.getElementById('filterBtn');

    if (fDivisi !== "" || fJenis !== "" || fTA !== "" || fBerkas !== "") {
        filterBtn.classList.add('active-filter');
    } else {
        filterBtn.classList.remove('active-filter');
    }
}

function resetFilter() {
    document.getElementById('filterDivisi').value = "";
    document.getElementById('filterJenis').value = "";
    document.getElementById('filterTahunAkademik').value = "";
    document.getElementById('filterBerkas').value = "";
    updateFilterButtonState();
    renderTabelArsip();
    showToast("Filter berhasil direset!");
}

function updateSortIcon() {
    const sortIcon = document.getElementById('sortIcon');
    const sortBtn = document.getElementById('sortBtn');
    if (window.currentSort === 'terbaru') {
        sortIcon.innerHTML = '<path d="M4 6h16M4 12h10M4 18h4"/>';
        sortBtn.title = "Urutan: Terbaru ke Terlama";
    } else {
        sortIcon.innerHTML = '<path d="M4 18h16M4 12h10M4 6h4"/>';
        sortBtn.title = "Urutan: Terlama ke Terbaru";
    }
}

function toggleSortOrder() {
    window.currentSort = window.currentSort === 'terbaru' ? 'terlama' : 'terbaru';
    updateSortIcon();
    showToast(`Urutan diubah ke: ${window.currentSort === 'terbaru' ? 'Terbaru' : 'Terlama'}`);
    renderTabelArsip();
}

function handleRefresh() {
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.classList.add('spin');
    
    muatDataReferensi().then(() => {
        setTimeout(() => {
            refreshIcon.classList.remove('spin');
            showToast("Data arsip berhasil disegarkan!");
        }, 400);
    });
}

window.onclick = function(event) {
    if (!event.target.closest('.filter-dropdown-wrapper')) {
        const filterMenu = document.getElementById('filterMenu');
        if (filterMenu) filterMenu.classList.remove('show');
    }
};

function formatTanggalDDMMYYYY(tanggalStr) {
    if (!tanggalStr) return "-";
    const parts = tanggalStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const dateObj = new Date(tanggalStr);
    if (isNaN(dateObj)) return tanggalStr;
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function hitungTahunAkademik(tanggalStr) {
    if (!tanggalStr) return "-";
    const dateObj = new Date(tanggalStr);
    if (isNaN(dateObj)) return "-";
    const tahun = dateObj.getFullYear();
    const bulan = dateObj.getMonth() + 1;
    return bulan >= 9 ? `${tahun}/${tahun + 1}` : `${tahun - 1}/${tahun}`;
}

async function muatDataReferensi() {
    try {
        const filterDivisiEl = document.getElementById('filterDivisi');
        const filterJenisEl = document.getElementById('filterJenis');
        const filterTAEl = document.getElementById('filterTahunAkademik');
        const filterBerkasEl = document.getElementById('filterBerkas');

        const valDivisi = filterDivisiEl ? filterDivisiEl.value : "";
        const valJenis = filterJenisEl ? filterJenisEl.value : "";
        const valTA = filterTAEl ? filterTAEl.value : "";
        const valBerkas = filterBerkasEl ? filterBerkasEl.value : "";

        const res = await fetch(urlAPI);
        const hasil = await res.json();
        
        if (hasil.status === "success") {
            window.arsipGlobal = hasil.data;

            const selDivisi = document.getElementById('divisi');
            if (selDivisi) {
                selDivisi.innerHTML = `<option value="" disabled selected>-- Pilih Divisi --</option>` + 
                    hasil.kode_divisi.map(item => `<option value="${item.kode}">${item.nama}</option>`).join('');
            }

            const selJenis = document.getElementById('jenis');
            if (selJenis) {
                selJenis.innerHTML = `<option value="" disabled selected>-- Pilih Jenis Surat --</option>` + 
                    hasil.kode_surat.map(item => `<option value="${item.kode}">${item.nama}</option>`).join('');
            }

            if (filterDivisiEl) {
                filterDivisiEl.innerHTML = `<option value="">Semua Divisi</option>` + 
                    hasil.kode_divisi.map(item => `<option value="${item.nama}">${item.nama}</option>`).join('');
                filterDivisiEl.value = valDivisi; 
            }

            if (filterJenisEl) {
                filterJenisEl.innerHTML = `<option value="">Semua Jenis</option>` + 
                    hasil.kode_surat.map(item => `<option value="${item.nama}">${item.nama}</option>`).join('');
                filterJenisEl.value = valJenis; 
            }

            const setTahunAkademik = [...new Set(hasil.data.map(item => hitungTahunAkademik(item.tanggal)))].filter(t => t !== "-").sort().reverse();
            if (filterTAEl) {
                filterTAEl.innerHTML = `<option value="">Semua Tahun</option>` + 
                    setTahunAkademik.map(ta => `<option value="${ta}">${ta}</option>`).join('');
                filterTAEl.value = valTA; 
            }

            if (filterBerkasEl) {
                filterBerkasEl.value = valBerkas; 
            }

            const loading = document.getElementById('loadingStatus');
            if (loading) loading.style.display = 'none';
            
            renderTabelArsip();
        }
    } catch (err) {
        const badanTabel = document.getElementById('badanTabel');
        if (badanTabel) badanTabel.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Gagal memuat data.</td></tr>';
    }
}

// --- FUNGSI RENDER (HANYA FILTER & SORT) ---
function renderTabelArsip() {
    updateFilterButtonState();
    updateSortIcon();

    const searchInput = document.getElementById('searchInput');
    const keyword = searchInput ? searchInput.value.toLowerCase() : "";
    
    const filterDivisi = document.getElementById('filterDivisi');
    const fDivisi = filterDivisi ? filterDivisi.value : "";
    
    const filterJenis = document.getElementById('filterJenis');
    const fJenis = filterJenis ? filterJenis.value : "";
    
    const filterTahunAkademik = document.getElementById('filterTahunAkademik');
    const fTA = filterTahunAkademik ? filterTahunAkademik.value : "";
    
    const filterBerkas = document.getElementById('filterBerkas');
    const fBerkas = filterBerkas ? filterBerkas.value : "";

    // Menyaring data
    let dataFiltered = window.arsipGlobal.filter(item => {
        const matchKeyword = (item.nomor || "").toLowerCase().includes(keyword) || (item.keterangan || "").toLowerCase().includes(keyword);
        const matchDivisi = fDivisi === "" || item.divisi === fDivisi;
        const matchJenis = fJenis === "" || item.jenis === fJenis;
        const matchTA = fTA === "" || hitungTahunAkademik(item.tanggal) === fTA;
        
        let matchBerkas = true;
        if (fBerkas === "belum") {
            matchBerkas = !item.link || item.link.trim() === "";
        }

        return matchKeyword && matchDivisi && matchJenis && matchTA && matchBerkas;
    });

    // Mengurutkan data
    dataFiltered.sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return window.currentSort === 'terbaru' ? dateB - dateA : dateA - dateB;
    });

    // Simpan data final ke variabel pagination dan reset ke halaman 1
    dataArsipTampil = dataFiltered;
    halamanSaatIni = 1;
    
    // Panggil fungsi penggambaran tabel berdasarkan halaman
    renderTabelSesuaiHalaman();
}

// --- FUNGSI MENGGAMBAR TABEL SESUAI HALAMAN (BARU) ---
function renderTabelSesuaiHalaman() {
    const roleSaatIni = sessionStorage.getItem('userRole') || 'pengguna';
    const isAdmin = (roleSaatIni === 'admin');

    const headerRow = document.getElementById('tableHeaderRow');
    if (headerRow) {
        if (isAdmin) {
            headerRow.innerHTML = `
                <th class="col-tanggal">Tanggal</th>
                <th class="col-ta">Tahun<br>Akademik</th>
                <th class="col-divisi">Divisi</th>
                <th class="col-jenis">Jenis</th>
                <th class="col-nomor">Nomor Surat</th>
                <th class="col-keterangan">Keterangan</th>
                <th class="col-berkas">Berkas</th>
                <th class="col-aksi">Aksi</th>
            `;
        } else {
            headerRow.innerHTML = `
                <th class="col-tanggal">Tanggal</th>
                <th class="col-ta">Tahun<br>Akademik</th>
                <th class="col-divisi">Divisi</th>
                <th class="col-jenis">Jenis</th>
                <th class="col-nomor">Nomor Surat</th>
                <th class="col-keterangan">Keterangan</th>
                <th class="col-berkas">Berkas</th>
            `;
        }
    }

    // Hitung indeks pemotongan array
    const startIndex = (halamanSaatIni - 1) * barisPerHalaman;
    const endIndex = startIndex + barisPerHalaman;
    const dataHalamanIni = dataArsipTampil.slice(startIndex, endIndex);

    const htmlBaris = dataHalamanIni.map(item => {
        let linkAman = item.link;
        if (linkAman && !linkAman.startsWith('http')) linkAman = 'https://' + linkAman;
        const tanggalFormatted = formatTanggalDDMMYYYY(item.tanggal);
        const tahunAkademik = hitungTahunAkademik(item.tanggal);
        
        let kolomAksiHtml = '';
        if (isAdmin) {
            kolomAksiHtml = `
                <td class="col-aksi">
                    <button class="action-icon-btn" onclick="bukaModalEdit('${item.nomor}')" title="Edit Arsip">
                        <svg viewBox="0 0 24 24" width="18" height="18" style="fill: none !important; stroke: currentColor !important; stroke-width: 2px; stroke-linecap: round; stroke-linejoin: round;">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </td>
            `;
        }

        return `
            <tr>
                <td class="col-tanggal">${tanggalFormatted}</td>
                <td class="col-ta"><span style="font-weight:600; color:var(--text-gray);">${tahunAkademik}</span></td>
                <td class="col-divisi">${item.divisi}</td>
                <td class="col-jenis">${item.jenis}</td>
                <td class="col-nomor">${item.nomor}</td>
                <td class="col-keterangan">${item.keterangan}</td>
                <td class="col-berkas">${linkAman ? `<a href="${linkAman}" target="_blank" class="badge-pdf" title="Lihat PDF">
                    <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 4px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Lihat</a>` : '<span class="badge-empty">Belum ada</span>'}</td>
                ${kolomAksiHtml}
            </tr>
        `;
    }).join('');
    
    const colspanVal = isAdmin ? 8 : 7;
    const badanTabel = document.getElementById('badanTabel');
    if (badanTabel) badanTabel.innerHTML = htmlBaris || `<tr><td colspan="${colspanVal}" style="text-align:center; color:var(--text-gray); padding:30px;">Tidak ada arsip yang cocok.</td></tr>`;
    
    perbaruiInfoPagination();
}

// --- FUNGSI KONTROL NAVIGASI HALAMAN (BARU) ---
function gantiHalaman(arah) {
    const totalHalaman = Math.ceil(dataArsipTampil.length / barisPerHalaman);
    halamanSaatIni += arah;
    
    if (halamanSaatIni < 1) halamanSaatIni = 1;
    if (halamanSaatIni > totalHalaman) halamanSaatIni = totalHalaman;
    
    renderTabelSesuaiHalaman();
}

function perbaruiInfoPagination() {
    const totalData = dataArsipTampil.length;
    const totalHalaman = Math.ceil(totalData / barisPerHalaman);
    
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    const info = document.getElementById('paginationInfo');

    if (info) {
        const start = totalData === 0 ? 0 : ((halamanSaatIni - 1) * barisPerHalaman) + 1;
        const end = Math.min(halamanSaatIni * barisPerHalaman, totalData);
        info.innerText = `Menampilkan ${start}-${end} dari ${totalData} data`;
    }

    if (btnPrev) {
        btnPrev.disabled = (halamanSaatIni === 1 || totalData === 0);
        btnPrev.style.opacity = btnPrev.disabled ? "0.5" : "1";
    }
    
    if (btnNext) {
        btnNext.disabled = (halamanSaatIni >= totalHalaman || totalData === 0);
        btnNext.style.opacity = btnNext.disabled ? "0.5" : "1";
    }
}

// --- SISA KODE LAINNYA ---
function generateNomorOtomatisPreview() {
    const tglVal = document.getElementById('tanggal').value;
    const divisiKode = document.getElementById('divisi').value;
    const jenisKode = document.getElementById('jenis').value;
    if (!tglVal) return "";

    const inputDate = new Date(tglVal);
    const inputYear = inputDate.getFullYear();
    const inputMonth = inputDate.getMonth() + 1;
    const labelTarget = inputMonth >= 9 ? `${inputYear}-${inputYear+1}` : `${inputYear-1}-${inputYear}`;
    
    const romanMap = { "I":1, "II":2, "III":3, "IV":4, "V":5, "VI":6, "VII":7, "VIII":8, "IX":9, "X":10, "XI":11, "XII":12 };
    const arrayRomawi = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
    const inputRomawi = arrayRomawi[inputMonth - 1];

    let maxUrutan = 0;
    
    window.arsipGlobal.forEach(item => {
        const parts = (item.nomor || "").split('/');
        
        if (parts.length >= 5) {
            const seq = parseInt(parts[0], 10);
            const bulanLamaRomawi = parts[parts.length - 2];
            let tahunLama = parseInt(parts[parts.length - 1], 10);
            
            if (tahunLama < 100) {
                tahunLama += 2000;
            }

            const bulanLamaInt = romanMap[bulanLamaRomawi];

            if (!isNaN(seq) && !isNaN(tahunLama) && bulanLamaInt) {
                const labelLama = bulanLamaInt >= 9 ? `${tahunLama}-${tahunLama+1}` : `${tahunLama-1}-${tahunLama}`;
                
                if (labelLama === labelTarget && seq > maxUrutan) {
                    maxUrutan = seq;
                }
            }
        }
    });

    const urutanSelanjutnya = String(maxUrutan + 1).padStart(3, '0');
    const stringDivisiKode = [divisiKode, jenisKode].filter(Boolean).join('-');
    
    let komponenNomor = [urutanSelanjutnya];
    if (stringDivisiKode) komponenNomor.push(stringDivisiKode);
    
    const tahunOutput = String(inputYear).slice(-2);
    
    komponenNomor.push("STAIIS", inputRomawi, tahunOutput);
    return komponenNomor.join('/');
}

function bukaModalEdit(nomor) {
    const dataRow = window.arsipGlobal.find(item => item.nomor === nomor);
    if(dataRow) {
        document.getElementById('edit_old_nomor').value = dataRow.nomor;
        document.getElementById('edit_tanggal').value = dataRow.tanggal;
        document.getElementById('edit_divisi').value = dataRow.divisi;
        document.getElementById('edit_jenis').value = dataRow.jenis;
        document.getElementById('edit_nomor').value = dataRow.nomor;
        document.getElementById('edit_keterangan').value = dataRow.keterangan;
        const inputBerkas = document.getElementById('editBerkas');
        if (inputBerkas) {
            inputBerkas.value = dataRow.link ? dataRow.link : '';
        }
        document.getElementById('modalEdit').style.display = 'flex';
    }
}

function tutupModal() {
    document.getElementById('modalEdit').style.display = 'none';
}
function tutupResultBox() {
    document.getElementById('resultBox').style.display = 'none';
}
function copyNumber() {
    const el = document.getElementById('resultNumberText');
    const teksNomor = el.getAttribute('data-nomor') || el.innerText;
    
    if (!teksNomor) {
        showToast("Tidak ada nomor untuk disalin.");
        return;
    }

    navigator.clipboard.writeText(teksNomor).then(() => {
        showToast("Nomor surat berhasil disalin: " + teksNomor);
    }).catch(err => {
        console.error('Gagal menyalin:', err);
        showToast("Gagal menyalin nomor. Silakan copy secara manual.");
    });
}
const formPenomoran = document.getElementById('formPenomoran');
if (formPenomoran) {
    formPenomoran.addEventListener('submit', async function(e) {
        e.preventDefault();

        const tombol = document.getElementById('btnSubmitPenomoran');
        const teksAsli = tombol.innerHTML; 
        
        tombol.innerHTML = `<svg style="animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle; margin-top: -2px;" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Merekam...`;
        tombol.disabled = true;
        tombol.style.opacity = "0.8";
        tombol.style.cursor = "wait";

        await new Promise(resolve => setTimeout(resolve, 15));

        const elDivisi = document.getElementById('divisi');
        const elJenis = document.getElementById('jenis');
        
        const inputJumlah = document.getElementById('jumlahGenerate');
        const jumlahTarget = inputJumlah && inputJumlah.value ? parseInt(inputJumlah.value) : 1;
        
        const nomorDasar = generateNomorOtomatisPreview(); 
        const bagianNomor = nomorDasar.split('/'); 
        const urutanAwal = parseInt(bagianNomor[0], 10);
        
        let arrayDataBaru = [];
        let nomorPertama = "";
        let nomorTerakhir = "";

        for (let i = 0; i < jumlahTarget; i++) {
            let urutanBaru = String(urutanAwal + i).padStart(3, '0');
            let formatBaru = [...bagianNomor];
            formatBaru[0] = urutanBaru; 
            let nomorFinal = formatBaru.join('/');
            
            if (i === 0) nomorPertama = nomorFinal;
            if (i === jumlahTarget - 1) nomorTerakhir = nomorFinal;

            arrayDataBaru.push({
                nomor: nomorFinal,
                tanggal: document.getElementById('tanggal').value,
                divisi: elDivisi.options[elDivisi.selectedIndex].text,
                jenis: elJenis.options[elJenis.selectedIndex].text,
                keterangan: jumlahTarget > 1 ? `${document.getElementById('keterangan').value} (${i + 1}/${jumlahTarget})` : document.getElementById('keterangan').value
            });
        }

        const payload = {
            action: "create_bulk",
            data: arrayDataBaru
        };

        try {
            await fetch(urlAPI, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
            this.reset();
            
            const resultNumberEl = document.getElementById('resultNumberText');
            resultNumberEl.setAttribute('data-nomor', nomorPertama);
            
            const urlVerifikasi = `https://persuratan-staiis.vercel.app/verifikasi.html?nomor=${encodeURIComponent(nomorPertama)}`;
            document.getElementById('qrCodeImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${urlVerifikasi}&margin=0`;
            
            let deskripsiAsli = payload.data[0].keterangan.replace(" (1/" + jumlahTarget + ")", "");
            
            if (jumlahTarget > 1) {
                resultNumberEl.innerHTML = `${nomorPertama} <span style="color: var(--text-gray); font-size: 13px; font-weight: 500; font-style: italic; margin-left: 8px;">(s/d ${nomorTerakhir})</span>`;
                document.getElementById('resultDescText').innerText = deskripsiAsli;
            } else {
                resultNumberEl.innerText = nomorPertama;
                document.getElementById('resultDescText').innerText = deskripsiAsli;
            }
            
            document.getElementById('resultBox').style.display = 'block';

            muatDataReferensi();
        } catch (err) {
            alert("Terjadi kesalahan jaringan.");
        } finally {
            tombol.innerHTML = teksAsli;
            tombol.disabled = false;
            tombol.style.opacity = "1";
            tombol.style.cursor = "pointer";
        }
    });
}

const formEdit = document.getElementById('formEdit');
if (formEdit) {
    formEdit.addEventListener('submit', async function(e) {
        e.preventDefault();
        const tombolEdit = this.querySelector('button[type="submit"]'); 
        const teksAsliEdit = tombolEdit.innerText;
    
        tombolEdit.innerHTML = '<span class="spinner"></span> Menyimpan...';
        tombolEdit.disabled = true;
        tombolEdit.style.opacity = "0.8";
        tombolEdit.style.cursor = "wait";

        const updateData = {
            action: "edit",
            old_nomor: document.getElementById('edit_old_nomor').value,
            tanggal: document.getElementById('edit_tanggal').value,
            divisi: document.getElementById('edit_divisi').value,
            jenis: document.getElementById('edit_jenis').value,
            nomor: document.getElementById('edit_nomor').value,
            keterangan: document.getElementById('edit_keterangan').value,
            berkas: document.getElementById('editBerkas').value.trim()
        };

        try {
            const response = await fetch(urlAPI, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(updateData) });
            const result = await response.json();
            
            if (result.status === "success") {
                showToast("Perubahan berhasil disimpan!");
                tutupModal();
                muatDataReferensi();
            } else {
                showToast("Gagal: " + result.message);
            }
        } catch (err) {
            showToast("Kesalahan jaringan.");
        } finally {
            tombolEdit.innerText = teksAsliEdit;
            tombolEdit.disabled = false;
            tombolEdit.style.opacity = "1";
            tombolEdit.style.cursor = "pointer";
        }
    });
}

const formUpload = document.getElementById('formUpload');
if (formUpload) {
    formUpload.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('upload_file'); 
        const file = fileInput.files[0];

        if (!file) {
            alert("Silakan pilih file hasil scan terlebih dahulu!");
            return;
        }

        const tombolUpload = this.querySelector('button[type="submit"]'); 
        const teksAsliUpload = tombolUpload.innerText;
    
        tombolUpload.innerHTML = '<span class="spinner"></span> Mengunggah...';
        tombolUpload.disabled = true;
        tombolUpload.style.opacity = "0.8";
        tombolUpload.style.cursor = "wait";

        const reader = new FileReader();
        reader.readAsDataURL(file); 
        
        reader.onload = async function () {
            const uploadPayload = {
                action: "upload",
                nomor: document.getElementById('upload_nomor').value,
                filename: file.name,
                mimeType: file.type,
                base64: reader.result.split(',')[1]
            };

            try {
                const response = await fetch(urlAPI, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(uploadPayload) });
                const result = await response.json();

                if (result.status === "success") {
                    showToast("Berkas PDF berhasil diupload!");
                    document.getElementById('formUpload').reset();
                    muatDataReferensi();
                } else {
                    showToast("Gagal: " + result.message);
                }
            } catch (err) {
                showToast("Kesalahan jaringan saat mengupload file.");
            } finally {
                tombolUpload.innerText = teksAsliUpload;
                tombolUpload.disabled = false;
                tombolUpload.style.opacity = "1";
                tombolUpload.style.cursor = "pointer";
            }
        };
    });
}

muatDataReferensi();

function logoutSistem() {
    const modal = document.getElementById('logoutModal');
    if(modal) modal.classList.add('show');
}

function tutupLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if(modal) modal.classList.remove('show');
}

function prosesLogout() {
    sessionStorage.removeItem('userRole');
    window.location.replace('login.html'); 
}
