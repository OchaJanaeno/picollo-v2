<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function adminDashboard(Request $request)
    {
        $user = $request->user();

        // Ambil outlet milik admin ini
        $outletIds = $user->outlets()->pluck('outlets.id');

        //STAT CARDS

        // Total pendapatan keseluruhan (transaksi success)
        $totalPendapatan = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->sum('total_amount');

        // Total transaksi hari ini
        $transaksiHariIni = Transaction::whereIn('outlet_id', $outletIds)
            ->whereDate('created_at', today())
            ->count();

        // Total produk aktif
        $totalProdukAktif = Product::whereIn('outlet_id', $outletIds)
            ->where('is_active', true)
            ->count();

        // Total outlet aktif milik admin
        $totalOutletAktif = Outlet::whereIn('id', $outletIds)
            ->where('status', 'aktif')
            ->count();

        // Pendapatan hari ini
        $pendapatanHariIni = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereDate('created_at', today())
            ->sum('total_amount');

        // Estimasi keuntungan dari stok yang ada
        $estimasiKeuntungan = Product::whereIn('outlet_id', $outletIds)
            ->where('is_active', true)
            ->whereNotNull('modal')
            ->whereNotNull('stok')
            ->get()
            ->sum(fn($p) => ($p->harga - $p->modal) * $p->stok);

        //GRAFIK 7 HARI TERAKHIR

        $grafikPendapatan = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select(
                DB::raw('DATE(created_at) as tanggal'),
                DB::raw('SUM(total_amount) as total'),
                DB::raw('COUNT(*) as jumlah_transaksi')
            )
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        //TRANSAKSI TERBARU

        $transaksiTerbaru = Transaction::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(fn($t) => [
                'id'                  => $t->id,
                'transaction_code'    => $t->transaction_code,
                'outlet'              => $t->outlet?->nama,
                'kasir'               => $t->kasir?->name,
                'total_amount'        => $t->total_amount,
                'metode_pembayaran'   => $t->metode_pembayaran,
                'status'              => $t->status,
                'created_at'          => $t->created_at,
            ]);

        //RESPONSE

        return response()->json([
            'success' => true,
            'data'    => [
                'stat_cards' => [
                    'total_pendapatan'     => $totalPendapatan,
                    'pendapatan_hari_ini'  => $pendapatanHariIni,
                    'transaksi_hari_ini'   => $transaksiHariIni,
                    'total_produk_aktif'   => $totalProdukAktif,
                    'total_outlet_aktif'   => $totalOutletAktif,
                    'estimasi_keuntungan'  => $estimasiKeuntungan,
                ],
                'grafik_pendapatan' => $grafikPendapatan,
                'transaksi_terbaru' => $transaksiTerbaru,
            ]
        ]);
    }
}