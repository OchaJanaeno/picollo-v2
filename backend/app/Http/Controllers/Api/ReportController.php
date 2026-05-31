<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Helper: Bangun base query transaksi berdasarkan akses outlet user & rentang tanggal.
     * Dipakai bersama oleh index() dan exportPdf().
     */
    private function getBaseTransactionQuery(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        // Filter ke outlet spesifik jika diminta dan user punya akses
        if ($request->outlet_id && $outletIds->contains($request->outlet_id)) {
            $outletIds = collect([$request->outlet_id]);
        }

        return Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date   . ' 23:59:59',
            ])
            ->with(['outlet:id,nama', 'kasir:id,name'])
            ->orderBy('created_at');
    }

    // GET laporan keuangan (JSON untuk Dashboard)
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'nullable|integer|exists:outlets,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $transaksi = $this->getBaseTransactionQuery($request)->get();

        $ringkasan = [
            'total_pendapatan' => $transaksi->sum('total_amount'),
            'total_transaksi'  => $transaksi->count(),
            'total_qris'       => $transaksi->where('metode_pembayaran', 'qris')->sum('total_amount'),
            'total_tunai'      => $transaksi->where('metode_pembayaran', 'tunai')->sum('total_amount'),
            'total_transfer'   => $transaksi->where('metode_pembayaran', 'transfer')->sum('total_amount'),
        ];

        $perOutlet = $transaksi->groupBy('outlet_id')->map(fn($items) => [
            'outlet_id'   => $items->first()->outlet_id,
            'outlet_nama' => $items->first()->outlet?->nama,
            'total'       => $items->sum('total_amount'),
            'jumlah'      => $items->count(),
        ])->values();

        $perHari = $transaksi->groupBy(fn($t) => $t->created_at->format('Y-m-d'))
            ->map(fn($items, $tanggal) => [
                'tanggal' => $tanggal,
                'total'   => $items->sum('total_amount'),
                'jumlah'  => $items->count(),
            ])->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'periode'    => ['start_date' => $request->start_date, 'end_date' => $request->end_date],
                'ringkasan'  => $ringkasan,
                'per_outlet' => $perOutlet,
                'per_hari'   => $perHari,
            ],
        ]);
    }

    // GET export PDF laporan transaksi
    public function exportPdf(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'nullable|integer|exists:outlets,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Batasi maksimal 30 hari agar PDF tidak terlalu besar
        $start = Carbon::parse($request->start_date);
        $end   = Carbon::parse($request->end_date);

        if ($start->diffInDays($end) > 30) {
            return response()->json([
                'success' => false,
                'message' => 'Maksimal rentang waktu untuk export PDF adalah 30 hari.',
            ], 422);
        }

        $transaksi = $this->getBaseTransactionQuery($request)->get();

        $pdf = Pdf::loadView('reports.laporan-pdf', [
            'transaksi'  => $transaksi,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'total'      => $transaksi->sum('total_amount'),
            'user'       => $request->user(),
        ]);

        return $pdf->download("laporan-{$request->start_date}-ke-{$request->end_date}.pdf");
    }
}
