        // 1. PRE-FLIGHT CHECK (Sangat Cepat)
        // Ditaruh di paling atas agar pengguna yang sudah login langsung dialihkan
        // tanpa perlu menunggu halaman login selesai dimuat.
        if (sessionStorage.getItem('userRole')) {
            window.location.replace('index.html');
        }

        // Gunakan URL API Web App Google Apps Script Anda yang sama
        const urlAPI = "https://script.google.com/macros/s/AKfycbyKRnIKopECo_pADMEP_Cw5soGivDREjgO_2TtmaJkbA2Ru-7mDz6bSlimcVi7FPLh_HQ/exec";

        function togglePassword() {
            const pwdInput = document.getElementById('password');
            const eyeIcon = document.getElementById('eyeIcon');
            if (pwdInput.type === "password") {
                pwdInput.type = "text";
                eyeIcon.classList.replace("bi-eye-slash", "bi-eye");
            } else {
                pwdInput.type = "password";
                eyeIcon.classList.replace("bi-eye", "bi-eye-slash");
            }
        }

        // Fungsi Memunculkan Notifikasi Modern
        function showModernToast(pesan, tipe = 'info') {
            const toast = document.getElementById("modernToast");
            toast.innerText = pesan;
            toast.className = "modern-toast show " + tipe;
            setTimeout(() => { 
                toast.className = toast.className.replace("show", "").trim(); 
            }, 3000);
        }

        // Pengecekan Login Terhubung ke Google Apps Script
        document.getElementById('formLogin').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('btnLogin');
            const originalText = submitBtn.innerHTML; // Gunakan innerHTML
            
            // 2. OPTIMASI SPINNER (Gunakan SVG Langsung agar aman dari CSS yang terpisah)
            submitBtn.innerHTML = `<svg style="animation: spin 1s linear infinite; margin-right: 8px; vertical-align: middle; margin-top: -2px;" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Memeriksa...`;
            submitBtn.disabled = true;
            submitBtn.style.cursor = "wait";
            submitBtn.style.opacity = "0.8";

            // 3. Jeda render 15ms agar animasi spinner muncul dengan mulus
            await new Promise(resolve => setTimeout(resolve, 15));

            const payload = {
                action: "login",
                username: document.getElementById('username').value.trim(),
                password: document.getElementById('password').value.trim()
            };

            try {
                const response = await fetch(urlAPI, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (result.status === "success") {
                    showModernToast("Login berhasil! Mengalihkan...", "success");
                    sessionStorage.setItem('userRole', result.role);
                    
                    // Reset form & tombol sebelum pindah halaman
                    document.getElementById('formLogin').reset();
                    document.getElementById('password').type = "password"; 
                    document.getElementById('eyeIcon').classList.replace("bi-eye", "bi-eye-slash");
                    
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.cursor = "pointer";
                    submitBtn.style.opacity = "1";

                    // Jeda agar notifikasi terbaca sebelum pindah halaman
                    setTimeout(() => {
                        window.location.replace('index.html'); 
                    }, 1500);
                } else {
                    showModernToast(result.message, "error");
                    // Mengembalikan tombol seperti semula jika gagal
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.cursor = "pointer";
                    submitBtn.style.opacity = "1";
                }
            } catch (err) {
                showModernToast("Terjadi kesalahan jaringan saat mencoba login.", "error");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.cursor = "pointer";
                submitBtn.style.opacity = "1";
            }
        });

        // Pembersihan otomatis jika browser memaksa load dari Cache (Tombol Back)
        window.addEventListener("pageshow", function (event) {
            // Jika benar-benar belum login, pastikan form bersih
            document.getElementById('formLogin').reset();
            document.getElementById('password').type = "password";
            const icon = document.getElementById('eyeIcon');
            if(icon) icon.classList.replace("bi-eye", "bi-eye-slash");

            const btn = document.getElementById('btnLogin');
            if(btn) {
                btn.innerHTML = "LOGIN APLIKASI";
                btn.disabled = false;
                btn.style.cursor = "pointer";
                btn.style.opacity = "1";
            }
        });
