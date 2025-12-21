let chartKombinasiInstance = null;
let chartPermutasiInstance = null;

// Registrasi plugin agar aktif
Chart.register(ChartDataLabels);

// Konfigurasi Global Font
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#334155';

function hitung() {
  const n = document.getElementById("n").value;
  const k = document.getElementById("k").value;

  if (!n || !k) {
    alert("Harap isi nilai N dan K!");
    return;
  }

  fetch(`/api/hitung?n=${n}&k=${k}`)
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Terjadi kesalahan server");
      }
      return res.json();
    })
    .then(data => {
      renderCharts(data);
      renderTextResult(data, n, k);
    })
    .catch(err => {
      alert("⚠️ GAGAL: " + err.message);
      console.error(err);
    });
}

function renderTextResult(data, n, k) {
    const resBox = document.getElementById("result-container");
    const txtKomb = document.getElementById("txt-kombinasi");
    const txtPerm = document.getElementById("txt-permutasi");

    // Format angka (contoh: 15.000)
    const valKomb = data.komb_iter.toLocaleString('id-ID');
    const valPerm = data.perm_iter.toLocaleString('id-ID');

    txtKomb.innerHTML = `Nilai matematika dari Kombinasi <strong>C(${n}, ${k})</strong> adalah <strong>${valKomb}</strong>`;
    txtPerm.innerHTML = `Nilai matematika dari Permutasi <strong>P(${n}, ${k})</strong> adalah <strong>${valPerm}</strong>`;
    
    if(resBox) resBox.style.display = "block";
}

function renderCharts(data) {
  const ctxKomb = document.getElementById("chartKombinasi").getContext('2d');
  const ctxPerm = document.getElementById("chartPermutasi").getContext('2d');

  // --- OPSI KONFIGURASI SUPAYA TEKS MUNCUL DI ATAS ---
  const sharedOptions = {
    responsive: true,
    scales: {
        y: { beginAtZero: true } // Pastikan mulai dari 0
    },
    plugins: {
      legend: { display: false },
      // INI BAGIAN PENTINGNYA:
      datalabels: {
        color: '#ffffff',     // Warna teks angka (Putih)
        anchor: 'end',        // Posisi di ujung batang
        align: 'top',         // Taruh di atas batang
        offset: 5,            // Jarak sedikit ke atas
        font: {
            weight: 'bold',
            size: 12
        },
        formatter: function(value) {
            // Format angka ribuan (1.000)
            return value.toLocaleString('id-ID');
        }
      }
    }
  };

  // --- GRAFIK 1: KOMBINASI ---
  if (chartKombinasiInstance) chartKombinasiInstance.destroy();

  chartKombinasiInstance = new Chart(ctxKomb, {
    type: "bar",
    data: {
      labels: [`Iteratif`, `Rekursif`],
      datasets: [{
        label: "Langkah",
        data: [data.step_komb_iter, data.step_komb_rec],
        backgroundColor: ["#4ade80", "#f87171"],
        borderRadius: 6,
        minBarLength: 10 // TRIK: Paksa batang minimal tinggi 10px biar kelihatan
      }]
    },
    options: sharedOptions
  });

  // --- GRAFIK 2: PERMUTASI ---
  if (chartPermutasiInstance) chartPermutasiInstance.destroy();

  chartPermutasiInstance = new Chart(ctxPerm, {
    type: "bar",
    data: {
      labels: [`Iteratif`, `Rekursif`],
      datasets: [{
        label: "Langkah",
        data: [data.step_perm_iter, data.step_perm_rec],
        backgroundColor: ["#38bdf8", "#fbbf24"],
        borderRadius: 6,
        minBarLength: 10 // Paksa batang minimal tinggi 10px
      }]
    },
    options: sharedOptions
  });
}