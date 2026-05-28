<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\DailyRecap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportController extends Controller
{
    // ── GET laporan keuangan ──────────────────────────────
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'nullable|integer|exists:outlets,id',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        // Filter outlet spesifik kalau diminta
        if ($request->outlet_id) {
            if (!$outletIds->contains($request->outlet_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
                ], 403);
            }
            $outletIds = collect([$request->outlet_id]);
        }

        $transaksi = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59',
            ])
            ->with('outlet:id,nama')
            ->get();

        $totalPendapatan = $transaksi->sum('total_amount');
        $totalTransaksi  = $transaksi->count();
        $totalQris       = $transaksi->where('metode_pembayaran', 'qris')->sum('total_amount');
        $totalTunai      = $transaksi->where('metode_pembayaran', 'tunai')->sum('total_amount');
        $totalTransfer   = $transaksi->where('metode_pembayaran', 'transfer')->sum('total_amount');

        // Rekap per outlet
        $perOutlet = $transaksi->groupBy('outlet_id')->map(function ($items) {
            $first = $items->first();
            return [
                'outlet_id'   => $first->outlet_id,
                'outlet_nama' => $first->outlet?->nama,
                'total'       => $items->sum('total_amount'),
                'jumlah'      => $items->count(),
            ];
        })->values();

        // Rekap per hari
        $perHari = $transaksi->groupBy(fn($t) => $t->created_at->format('Y-m-d'))
            ->map(fn($items, $tanggal) => [
                'tanggal' => $tanggal,
                'total'   => $items->sum('total_amount'),
                'jumlah'  => $items->count(),
            ])->values();

        return response()->json([
            'success' => true,
            'data'    => [
                'periode'          => [
                    'start_date' => $request->start_date,
                    'end_date'   => $request->end_date,
                ],
                'ringkasan'        => [
                    'total_pendapatan' => $totalPendapatan,
                    'total_transaksi'  => $totalTransaksi,
                    'total_qris'       => $totalQris,
                    'total_tunai'      => $totalTunai,
                    'total_transfer'   => $totalTransfer,
                ],
                'per_outlet'       => $perOutlet,
                'per_hari'         => $perHari,
            ],
        ]);
    }

    // ── GET export PDF ─────────────────────────────────────
    public function exportPdf(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $transaksi = Transaction::whereIn('outlet_id', $outletIds)
            ->where('status', 'success')
            ->whereBetween('created_at', [
                $request->start_date . ' 00:00:00',
                $request->end_date . ' 23:59:59',
            ])
            ->with(['outlet:id,nama', 'kasir:id,name'])
            ->orderBy('created_at')
            ->get();

        // Generate HTML untuk PDF
        $html = view('reports.laporan-pdf', [
            'transaksi'  => $transaksi,
            'start_date' => $request->start_date,
            'end_date'   => $request->end_date,
            'total'      => $transaksi->sum('total_amount'),
            'user'       => $request->user(),
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);

        return $pdf->download("laporan-{$request->start_date}-{$request->end_date}.pdf");
    }
}