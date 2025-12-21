package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

var langkahRekursifKombinasi int
var langkahRekursifPermutasi int

// ===== ALGORITMA =====

func kombinasiIteratif(n, k int) (int, int) {
	langkah := 0
	if k == 0 || k > n {
		return 0, langkah
	}
	if k == 0 || k == n {
		return 1, langkah
	}
	if k > n-k {
		k = n - k
	}

	hasil := 1
	for i := 0; i < k; i++ {
		hasil = hasil * (n - i) / (i + 1)
		langkah++
	}
	return hasil, langkah
}

func kombinasiRekursif(n, k int) int {
	langkahRekursifKombinasi++
	if k == 0 || k == n {
		return 1
	}
	if k > n {
		return 0
	}
	return kombinasiRekursif(n-1, k-1) + kombinasiRekursif(n-1, k)
}

func permutasiIteratif(n, k int) (int, int) {
	hasil := 1
	langkah := 0
	for i := 0; i < k; i++ {
		hasil *= (n - i)
		langkah++
	}
	return hasil, langkah
}

func permutasiRekursif(n, k int) int {
	langkahRekursifPermutasi++
	if k == 0 {
		return 1
	}
	return n * permutasiRekursif(n-1, k-1)
}

// ===== API =====

func hitungHandler(w http.ResponseWriter, r *http.Request) {
    n, _ := strconv.Atoi(r.URL.Query().Get("n"))
    k, _ := strconv.Atoi(r.URL.Query().Get("k"))

    w.Header().Set("Content-Type", "application/json")

    // --- VALIDASI SAFETY GUARD ---
    // Batasi N maksimal 20 agar tidak Overflow & Server Hang
    if n > 20 {
        w.WriteHeader(http.StatusBadRequest) // Kirim kode error 400
        json.NewEncoder(w).Encode(map[string]string{
            "error": "Nilai N terlalu besar! Maksimal 20 demi keamanan server.",
        })
        return
    }
    if n < 0 || k < 0 {
         w.WriteHeader(http.StatusBadRequest)
         json.NewEncoder(w).Encode(map[string]string{
            "error": "Nilai tidak boleh negatif.",
        })
        return
    }
    // -----------------------------

    kombIter, stepKombIter := kombinasiIteratif(n, k)
    langkahRekursifKombinasi = 0
    kombRec := kombinasiRekursif(n, k)

    permIter, stepPermIter := permutasiIteratif(n, k)
    langkahRekursifPermutasi = 0
    permRec := permutasiRekursif(n, k)

    response := map[string]int{
        "komb_iter":      kombIter,
        "komb_rec":       kombRec,
        "perm_iter":      permIter,
        "perm_rec":       permRec,
        "step_komb_iter": stepKombIter,
        "step_komb_rec":  langkahRekursifKombinasi,
        "step_perm_iter": stepPermIter,
        "step_perm_rec":  langkahRekursifPermutasi,
    }

    json.NewEncoder(w).Encode(response)
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./")))
	http.HandleFunc("/api/hitung", hitungHandler)
	http.ListenAndServe(":8080", nil)
}
