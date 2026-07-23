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

const tableWrapper = document.getElementById('tableScrollWrapper');
const bottomProxy = document.getElementById('bottomScrollProxy');
const bottomContent = document.getElementById('bottomScrollContent');
const mainTable = document.getElementById('mainTable');

function updateProxyWidth() {
    if (mainTable && bottomContent) {
        if (mainTable.scrollWidth > tableWrapper.clientWidth) {
            bottomProxy.style.display = 'block';
            bottomContent.style.width = mainTable.scrollWidth + 'px';
        } else {
            bottomProxy.style.display = 'none';
        }
    }
}

function syncScroll(source) {
    if (source === 'proxy') {
        tableWrapper.scrollLeft = bottomProxy.scrollLeft;
    } else {
        bottomProxy.scrollLeft = tableWrapper.scrollLeft;
    }
}

tableWrapper.addEventListener('scroll', () => syncScroll('table'));
window.addEventListener('resize', updateProxyWidth);

function showToast(pesan) {
    const toast = document.getElementById("toast");
    toast.innerText = pesan;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btnElement.classList.add('active');
    
    document.getElementById('reminderBox').style.display = 'none';
    
    if (tabId === 'arsip') {
        setTimeout(updateProxyWidth, 100);
    } else {
        document.getElementById('bottomScrollProxy').style.display = 'none';
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
        // 1. INGAT/SIMPAN STATUS FILTER SAAT INI SEBELUM DATA DI-REFRESH
        const filterDivisiEl = document.getElementById('filterDivisi');
        const filterJenisEl = document.getElementById('filterJenis');
        const filterTAEl = document.getElementById('filterTahunAkademik');
        const filterBerkasEl = document.getElementById('filterBerkas');

        const valDivisi = filterDivisiEl ? filterDivisiEl.value : "";
        const valJenis = filterJenisEl ? filterJenisEl.value : "";
        const valTA = filterTAEl ? filterTAEl.value : "";
        const valBerkas = filterBerkasEl ? filterBerkasEl.value : "";

        // Mengambil data terbaru dari Google Sheet
        const res = await fetch(urlAPI);
        const hasil = await res.json();
        
        if (hasil.status === "success") {
            window.arsipGlobal = hasil.data;

            // Memperbarui dropdown Form Penomoran
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

            // Memperbarui dropdown Filter DAN MENGEMBALIKAN NILAI YANG DIINGAT (Disimpan)
            if (filterDivisiEl) {
                filterDivisiEl.innerHTML = `<option value="">Semua Divisi</option>` + 
                    hasil.kode_divisi.map(item => `<option value="${item.nama}">${item.nama}</option>`).join('');
                filterDivisiEl.value = valDivisi; // Kembalikan ke pilihan terakhir pengguna
            }

            if (filterJenisEl) {
                filterJenisEl.innerHTML = `<option value="">Semua Jenis</option>` + 
                    hasil.kode_surat.map(item => `<option value="${item.nama}">${item.nama}</option>`).join('');
                filterJenisEl.value = valJenis; // Kembalikan ke pilihan terakhir pengguna
            }

            const setTahunAkademik = [...new Set(hasil.data.map(item => hitungTahunAkademik(item.tanggal)))].filter(t => t !== "-").sort().reverse();
            if (filterTAEl) {
                filterTAEl.innerHTML = `<option value="">Semua Tahun</option>` + 
                    setTahunAkademik.map(ta => `<option value="${ta}">${ta}</option>`).join('');
                filterTAEl.value = valTA; // Kembalikan ke pilihan terakhir pengguna
            }

            if (filterBerkasEl) {
                filterBerkasEl.value = valBerkas; // Kembalikan status filter berkas
            }

            const loading = document.getElementById('loadingStatus');
            if (loading) loading.style.display = 'none';
            
            // Render tabel menggunakan kondisi filter yang sudah di-restore
            renderTabelArsip();
        }
    } catch (err) {
        const badanTabel = document.getElementById('badanTabel');
        if (badanTabel) badanTabel.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Gagal memuat data.</td></tr>';
    }
}

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

    dataFiltered.sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return window.currentSort === 'terbaru' ? dateB - dateA : dateA - dateB;
    });

    const htmlBaris = dataFiltered.map(item => {
        let linkAman = item.link;
        if (linkAman && !linkAman.startsWith('http')) linkAman = 'https://' + linkAman;
        const tanggalFormatted = formatTanggalDDMMYYYY(item.tanggal);
        const tahunAkademik = hitungTahunAkademik(item.tanggal);
        
        return `
            <tr>
                <td class="col-tanggal">${tanggalFormatted}</td>
                <td class="col-ta"><span style="font-weight:600; color:var(--text-gray);">${tahunAkademik}</span></td>
                <td class="col-divisi">${item.divisi}</td>
                <td class="col-jenis">${item.jenis}</td>
                <td class="col-nomor">${item.nomor}</td>
                <td class="col-keterangan">${item.keterangan}</td>
                <td class="col-berkas">${linkAman ? `<a href="${linkAman}" target="_blank" class="badge-pdf" title="Lihat PDF">
                    <!-- Ikon Berkas File Modern -->
                    <svg viewBox="0 0 24 24" width="14" height="14" style="margin-right: 4px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    Lihat</a>` : '<span class="badge-empty">Belum ada</span>'}</td>
                <td class="col-aksi">
                    <button class="action-icon-btn" onclick="bukaModalEdit('${item.nomor}')" title="Edit Arsip">
                        <!-- Ikon Pensil Edit Modern -->
                        <svg viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    const badanTabel = document.getElementById('badanTabel');
    if (badanTabel) badanTabel.innerHTML = htmlBaris || '<tr><td colspan="8" style="text-align:center; color:var(--text-gray); padding:30px;">Tidak ada arsip yang cocok.</td></tr>';
    setTimeout(updateProxyWidth, 50);
}

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
        document.getElementById('modalEdit').style.display = 'flex';
    }
}

function tutupModal() {
    document.getElementById('modalEdit').style.display = 'none';
}

const formPenomoran = document.getElementById('formPenomoran');
if (formPenomoran) {
    formPenomoran.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        const tombol = document.getElementById('btnSubmitPenomoran');
        tombol.innerText = "Membuat Nomor...";
        tombol.disabled = true;

        const elDivisi = document.getElementById('divisi');
        const elJenis = document.getElementById('jenis');
        const generatedNomor = generateNomorOtomatisPreview();

        const dataBaru = {
            action: "create",
            tanggal: document.getElementById('tanggal').value,
            divisi: elDivisi.options[elDivisi.selectedIndex].text, 
            jenis: elJenis.options[elJenis.selectedIndex].text,
            nomor: generatedNomor, 
            keterangan: document.getElementById('keterangan').value
        };

        try {
            await fetch(urlAPI, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(dataBaru) });
            this.reset();
            
            navigator.clipboard.writeText(generatedNomor).then(() => {
                showToast(`Nomor ${generatedNomor} dibuat & disalin!`);
            }).catch(() => {
                showToast("Nomor berhasil dibuat!");
            });
            
            document.getElementById('reminderBox').style.display = 'block';
            muatDataReferensi();
        } catch (err) {
            showToast("Terjadi kesalahan jaringan.");
        } finally {
            tombol.innerText = "Buat Nomor";
            tombol.disabled = false;
        }
    });
}

const formEdit = document.getElementById('formEdit');
if (formEdit) {
    formEdit.addEventListener('submit', async function(e) {
        e.preventDefault();
        const tombol = document.getElementById('btnSubmitEdit');
        tombol.innerText = "Menyimpan...";
        tombol.disabled = true;

        const updateData = {
            action: "edit",
            old_nomor: document.getElementById('edit_old_nomor').value,
            tanggal: document.getElementById('edit_tanggal').value,
            divisi: document.getElementById('edit_divisi').value,
            jenis: document.getElementById('edit_jenis').value,
            nomor: document.getElementById('edit_nomor').value,
            keterangan: document.getElementById('edit_keterangan').value
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
            tombol.innerText = "Simpan Perubahan";
            tombol.disabled = false;
        }
    });
}

const formUpload = document.getElementById('formUpload');
if (formUpload) {
    formUpload.addEventListener('submit', async function(e) {
        e.preventDefault();
        const tombol = document.getElementById('btnSubmitUpload');
        const file = document.getElementById('upload_file').files[0];
        if (!file) return showToast("Pilih file PDF terlebih dahulu.");

        tombol.innerText = "Mengupload...";
        tombol.disabled = true;

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
                tombol.innerText = "Upload";
                tombol.disabled = false;
            }
        };
    });
}

// Menjalankan fungsi muat referensi pertama kali saat script dimuat
muatDataReferensi();
