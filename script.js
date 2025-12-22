let chartKombinasiInstance = null;
let chartPermutasiInstance = null;

// Registrasi Plugin
Chart.register(ChartDataLabels);
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';

function hitung() {
    const n = document.getElementById("n").value;
    const k = document.getElementById("k").value;

    if (!n || !k) {
        alert("Harap isi jumlah lagu (N) dan slot tampil (K)!");
        return;
    }

    fetch(`/api/hitung?n=${n}&k=${k}`)
        .then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Server Error");
            }
            return res.json();
        })
        .then(data => {
            renderCharts(data);
            generateStory(data, n, k);
        })
        .catch(err => alert("⚠️ GAGAL: " + err.message));
}

function generateStory(data, n, k) {
    const text = document.getElementById("story-text");
    const txtKomb = document.getElementById("txt-kombinasi");
    const txtPerm = document.getElementById("txt-permutasi");
    const box = document.getElementById("result-container");

    const valKomb = data.komb_iter.toLocaleString('id-ID');
    const valPerm = data.perm_iter.toLocaleString('id-ID');

    // Tampilkan Angka Matematika Kecil
    txtKomb.innerHTML = `🧮 Kombinasi C(${n},${k}): <strong>${valKomb}</strong>`;
    txtPerm.innerHTML = `🧮 Permutasi P(${n},${k}): <strong>${valPerm}</strong>`;

    // CERITA KONSER (Update: Teks Peringatan Dihapus)
    text.innerHTML = `
        Dari <strong>${n} lagu</strong> di album, kita harus memilih <strong>${k} lagu</strong> untuk tampil di TV.
        <br><br>
        <strong>Tahap 1: Seleksi Lagu (Masalah Kombinasi)</strong><br>
        Ada <strong>${valKomb} kemungkinan paket lagu</strong> yang bisa kita pilih. Di tahap ini, kita belum memikirkan urutan, yang penting lagunya terpilih.
        <br><br>
        <strong>Tahap 2: Susunan Rundown (Masalah Permutasi)</strong><br>
        Setelah lagu terpilih, kita harus atur urutan (Opening vs Ending). Karena urutan mempengaruhi mood penonton, jumlah skenarionya melonjak jadi <strong>${valPerm} kemungkinan</strong>.
    `;

    box.style.display = "block";
}

function renderCharts(data) {
    const ctxKomb = document.getElementById("chartKombinasi").getContext('2d');
    const ctxPerm = document.getElementById("chartPermutasi").getContext('2d');
    
    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            datalabels: {
                color: '#fff', anchor: 'end', align: 'top', offset: 0,
                font: { weight: 'bold' },
                formatter: (val) => val.toLocaleString('id-ID')
            }
        },
        scales: { y: { beginAtZero: true } }
    };

    // Grafik Kombinasi
    if (chartKombinasiInstance) chartKombinasiInstance.destroy();
    chartKombinasiInstance = new Chart(ctxKomb, {
        type: "bar",
        data: {
            labels: ["Iteratif (Efisien)", "Rekursif (Berat)"],
            datasets: [{
                data: [data.step_komb_iter, data.step_komb_rec],
                backgroundColor: ["#4ade80", "#f87171"],
                borderRadius: 5,
                minBarLength: 20
            }]
        },
        options: commonOptions
    });

    // Grafik Permutasi
    if (chartPermutasiInstance) chartPermutasiInstance.destroy();
    chartPermutasiInstance = new Chart(ctxPerm, {
        type: "bar",
        data: {
            labels: ["Iteratif", "Rekursif"],
            datasets: [{
                data: [data.step_perm_iter, data.step_perm_rec],
                backgroundColor: ["#38bdf8", "#fbbf24"],
                borderRadius: 5,
                minBarLength: 20
            }]
        },
        options: commonOptions
    });
}