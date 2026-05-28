<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HashVerification;
use App\Models\Transaction;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HashVerificationController extends Controller
{
    // ── GET semua hash verifikasi ─────────────────────────
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $verifications = HashVerification::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )
        ->with([
            'transaction:id,transaction_code,outlet_id,total_amount,created_at',
            'verifiedBy:id,name',
        ])
        ->orderByDesc('created_at')
        ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $verifications,
        ]);
    }

    // ── GET detail hash verifikasi ────────────────────────
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $verification = HashVerification::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )
        ->with([
            'transaction:id,transaction_code,outlet_id,total_amount,created_at',
            'verifiedBy:id,name',
        ])
        ->find($id);

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'Data verifikasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $verification,
        ]);
    }

    // ── POST verifikasi hash transaksi ────────────────────
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|integer|exists:transactions,id',
        ], [
            'transaction_id.required' => 'ID transaksi wajib diisi.',
            'transaction_id.exists'   => 'Transaksi tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outletIds   = $request->user()->outlets()->pluck('outlets.id');
        $transaction = Transaction::whereIn('outlet_id', $outletIds)
            ->with('hashVerification')
            ->find($request->transaction_id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        if (!$transaction->hashVerification) {
            return response()->json([
                'success' => false,
                'message' => 'Hash untuk transaksi ini belum ada.',
            ], 404);
        }

        // Regenerate hash dari data transaksi
        $hashData = json_encode([
            'transaction_code' => $transaction->transaction_code,
            'outlet_id'        => $transaction->outlet_id,
            'total_amount'     => $transaction->total_amount,
            'created_at'       => $transaction->created_at,
        ]);
        $recomputedHash = hash('sha256', $hashData);
        $storedHash     = $transaction->hashVerification->hash_sha256;

        // Bandingkan hash
        $isValid = hash_equals($storedHash, $recomputedHash);
        $status  = $isValid ? 'verified' : 'fraud_detected';

        // Update status verifikasi
        $transaction->hashVerification->update([
            'status'      => $status,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        // Catat ke audit log
        AuditLog::create([
            'user_id'     => $request->user()->id,
            'action'      => 'verify_hash',
            'entity_type' => 'Transaction',
            'entity_id'   => $transaction->id,
            'new_value'   => ['status' => $status, 'hash' => $storedHash],
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $isValid
                ? 'Hash valid! Transaksi tidak dimanipulasi.'
                : '⚠️ FRAUD DETECTED! Hash tidak cocok, transaksi kemungkinan dimanipulasi!',
            'data'    => [
                'transaction_code' => $transaction->transaction_code,
                'stored_hash'      => $storedHash,
                'recomputed_hash'  => $recomputedHash,
                'is_valid'         => $isValid,
                'status'           => $status,
                'verified_by'      => $request->user()->name,
                'verified_at'      => now(),
            ],
        ]);
    }

    // ── POST verifikasi integritas seluruh chain ──────────
    public function verifyChain(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id' => 'required|integer|exists:outlets,id',
            'tanggal'   => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        // Ambil semua transaksi hari itu urut by id
        $transactions = Transaction::where('outlet_id', $request->outlet_id)
            ->where('status', 'success')
            ->whereDate('created_at', $request->tanggal)
            ->with('hashVerification')
            ->orderBy('id')
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada transaksi pada tanggal tersebut.',
            ], 404);
        }

        $chainValid  = true;
        $chainResult = [];
        $prevHash    = null;

        foreach ($transactions as $trx) {
            $hashData = json_encode([
                'transaction_code' => $trx->transaction_code,
                'outlet_id'        => $trx->outlet_id,
                'total_amount'     => $trx->total_amount,
                'created_at'       => $trx->created_at,
            ]);
            $recomputedHash = hash('sha256', $hashData);
            $storedHash     = $trx->hashVerification?->hash_sha256;
            $isValid        = $storedHash && hash_equals($storedHash, $recomputedHash);

            if (!$isValid) $chainValid = false;

            $chainResult[] = [
                'transaction_code' => $trx->transaction_code,
                'stored_hash'      => $storedHash,
                'recomputed_hash'  => $recomputedHash,
                'prev_hash'        => $prevHash,
                'is_valid'         => $isValid,
            ];

            $prevHash = $storedHash;
        }

        return response()->json([
            'success' => true,
            'message' => $chainValid
                ? 'Seluruh chain valid! Tidak ada manipulasi data.'
                : '⚠️ Chain rusak! Ada transaksi yang kemungkinan dimanipulasi.',
            'data'    => [
                'outlet_id'    => $request->outlet_id,
                'tanggal'      => $request->tanggal,
                'total_trx'    => $transactions->count(),
                'chain_valid'  => $chainValid,
                'chain_detail' => $chainResult,
            ],
        ]);
    }
}