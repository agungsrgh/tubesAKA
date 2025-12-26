let chartKombinasiInstance = null;
let chartPermutasiInstance = null;

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

function hitung() {
    const nInput = document.getElementById("n");
    const kInput = document.getElementById("k");

    if (!nInput || !kInput) {
        alert("Elemen input tidak ditemukan!");
        return;
    }

    const n = parseInt(nInput.value);
    const k = parseInt(kInput.value);

    if (isNaN(n) || isNaN(k)) {
        alert("Harap isi nilai N dan K!");
        return;
    }

    // Ambil Data Akurat dari Backend Go
    fetch(`/api/hitung?n=${n}&k=${k}`)
        .then(async res => {
            if (!res.ok) throw new Error("Server Error");
            return res.json();
        })
        .then(data => {
            generateStory(data, n, k);
            // Jalankan simulasi grafik dengan data REAL
            const simulation = simulateFullCurve(n);
            renderLineCharts(simulation, k);
        })
        .catch(err => {
            console.error(err);
            alert("⚠️ GAGAL: " + err.message);
        });
}

function generateStory(data, n, k) {
    const title = document.getElementById("story-title");
    const text = document.getElementById("story-text");
    const txtKomb = document.getElementById("txt-kombinasi");
    const txtPerm = document.getElementById("txt-permutasi");
    const box = document.getElementById("result-container");

    const valKomb = data.komb_iter.toLocaleString('id-ID');
    const valPerm = data.perm_iter.toLocaleString('id-ID');
    const stepRec = data.step_komb_rec.toLocaleString('id-ID');

    // Update Angka di Kotak
    if(txtKomb) txtKomb.innerHTML = `Kombinasi C(${n},${k}): <strong>${valKomb}</strong>`;
    if(txtPerm) txtPerm.innerHTML = `Permutasi P(${n},${k}): <strong>${valPerm}</strong>`;

    if(title) title.innerText = `Laporan Manajer (N=${n}, K=${k})`;
    if(text) text.innerHTML = `
        Dari <strong>${n} lagu hits</strong>, kita harus memilih <strong>${k} lagu</strong>.
        <br><br>
        <strong>1. Tahap Seleksi (Kombinasi):</strong><br>
        Ada <strong>${valKomb} variasi paket</strong>.
        <br><br>
        <strong>2. Tahap Rundown (Permutasi):</strong><br>
        Ada <strong>${valPerm} kemungkinan urutan</strong>. Algoritma stabil (Linear).
    `;

    if(box) box.style.display = "block";
}

// --- LOGIKA SIMULASI REAL (DENGAN CACHE) ---
// Ini menghitung langkah PERSIS sama seperti kode Go kamu.
// Menggunakan 'memoSteps' agar browser tidak crash saat N besar.

let memoSteps = {}; // Tempat nyimpen hasil hitungan biar gak diulang

function getRealRecursiveSteps(n, k) {
    const key = `${n},${k}`;
    
    // Cek apakah sudah pernah dihitung? Kalau sudah, ambil dari ingatan.
    if (memoSteps[key] !== undefined) return memoSteps[key];

    // Logika Hitung Langkah (Sama persis kayak Go)
    // Setiap kali fungsi dipanggil = 1 langkah
    let steps = 1; 

    if (k > n) {
        // Base case user: return 0. Tidak ada panggilan anak.
    } else if (k === 0) {
        // Base case user: return 1. Tidak ada panggilan anak.
    } else {
        // Rekursif: Panggil anak kiri + anak kanan
        steps += getRealRecursiveSteps(n - 1, k - 1);
        steps += getRealRecursiveSteps(n - 1, k);
    }

    // Simpan ke ingatan
    memoSteps[key] = steps;
    return steps;
}

function simulateFullCurve(n) {
    let labels = [];
    let kombIter = [];
    let kombRec = []; // Ini yang akan diisi data REAL
    let permIter = [];
    let permRec = [];

    // Reset ingatan setiap kali simulasi baru
    memoSteps = {};

    for (let i = 0; i <= n; i++) {
        labels.push(i);
        
        // 1. Kombinasi Iteratif (Hijau)
        // Logika: Jika K > N-K, kita balik (optimasi).
        let k_opt = (i > n - i) ? n - i : i;
        let stepsKI = (k_opt === 0) ? 0 : k_opt; 
        kombIter.push(stepsKI);

        // 2. Kombinasi Rekursif (Merah) - DATA PASTI
        // Panggil fungsi hitung langkah asli
        let realSteps = getRealRecursiveSteps(n, i);
        kombRec.push(realSteps);

        // 3. Permutasi (Biru & Kuning)
        permIter.push(i);
        permRec.push(i + 1);
    }
    return { labels, kombIter, kombRec, permIter, permRec };
}

function renderLineCharts(data, userK) {
    const ctxKombElement = document.getElementById("chartKombinasi");
    const ctxPermElement = document.getElementById("chartPermutasi");

    if (!ctxKombElement || !ctxPermElement) return;

    const ctxKomb = ctxKombElement.getContext('2d');
    const ctxPerm = ctxPermElement.getContext('2d');
    
    // Plugin Garis Penanda
    const verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw: (chart) => {
            if (chart.tooltip?._active?.length) return;
            const ctx = chart.ctx;
            
            // Cek apakah userK ada dalam jangkauan sumbu X
            const meta = chart.getDatasetMeta(0);
            if (userK >= meta.data.length) return;

            const x = chart.scales.x.getPixelForValue(userK);
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(`K=${userK}`, x, topY - 10);
        }
    };

    const commonOptions = {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { labels: { color: '#fff' } },
            tooltip: { 
                enabled: true,
                callbacks: {
                    label: function(context) {
                        // Tampilkan angka dengan pemisah ribuan (Contoh: 15.504)
                        return context.dataset.label + ": " + context.raw.toLocaleString('id-ID');
                    }
                }
            }
        },
        scales: {
            x: { grid: { color: '#334155' }, ticks: { color: '#cbd5e1' } },
            y: { grid: { color: '#334155' }, ticks: { color: '#cbd5e1' }, beginAtZero: true }
        }
    };

    // Hancurkan chart lama jika ada
    if (chartKombinasiInstance) chartKombinasiInstance.destroy();
    if (chartPermutasiInstance) chartPermutasiInstance.destroy();

    // Render Chart Kombinasi
    chartKombinasiInstance = new Chart(ctxKomb, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Rekursif (Merah)',
                    data: data.kombRec,
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: (ctx) => ctx.dataIndex === userK ? 6 : 2, 
                    pointBackgroundColor: '#fff'
                },
                {
                    label: 'Iteratif (Hijau)',
                    data: data.kombIter,
                    borderColor: '#4ade80',
                    tension: 0.1,
                    pointRadius: (ctx) => ctx.dataIndex === userK ? 6 : 0,
                    pointBackgroundColor: '#fff'
                }
            ]
        },
        options: commonOptions,
        plugins: [verticalLinePlugin]
    });

    // Render Chart Permutasi
    chartPermutasiInstance = new Chart(ctxPerm, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Rekursif',
                    data: data.permRec,
                    borderColor: '#fbbf24',
                    borderDash: [5, 5],
                    pointRadius: 0
                },
                {
                    label: 'Iteratif',
                    data: data.permIter,
                    borderColor: '#38bdf8',
                    pointRadius: (ctx) => ctx.dataIndex === userK ? 6 : 0,
                    pointBackgroundColor: '#fff'
                }
            ]
        },
        options: commonOptions,
        plugins: [verticalLinePlugin]
    });
}