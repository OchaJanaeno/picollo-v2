<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CorrectionLog;
use App\Models\Transaction;
use App\Models\HashVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CorrectionLogController extends Controller
{
    // GET semua log koreksi
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $logs = CorrectionLog::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )
        ->with(['transaction:id,transaction_code', 'correctedBy:id,name', 'outlet:id,nama'])
        ->orderByDesc('created_at')
        ->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }

    // POST buat koreksi transaksi
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id'  => 'required|integer|exists:transactions,id',
            'alasan'          => 'required|string',
            'correction_type' => 'required|in:edit,void',
            'new_data'        => 'required_if:correction_type,edit|array',
        ], [
            'transaction_id.required'  => 'Transaksi wajib dipilih.',
            'alasan.required'          => 'Alasan koreksi wajib diisi.',
            'correction_type.required' => 'Tipe koreksi wajib dipilih.',
            'correction_type.in'       => 'Tipe koreksi harus edit atau void.',
            'new_data.required_if'     => 'Data baru wajib diisi untuk koreksi edit.',
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

        // Simpan data lama sebelum diubah
        $oldData     = $transaction->toArray();
        $hashSebelum = $transaction->hashVerification?->hash_sha256;

        // Proses koreksi
        if ($request->correction_type === 'void') {
            $transaction->update(['status' => 'voided']);
        } else {
            // Hanya izinkan field yang aman diubah
            $allowedFields = ['catatan', 'metode_pembayaran', 'payment_reference'];
            $updateData    = array_intersect_key($request->new_data, array_flip($allowedFields));
            $transaction->update($updateData);
        }

        $newData = $transaction->fresh()->toArray();

        // Generate hash sesudah koreksi
        $hashSesudah = hash('sha256', json_encode($newData));

        $log = CorrectionLog::create([
            'transaction_id'  => $transaction->id,
            'corrected_by'    => $request->user()->id,
            'outlet_id'       => $transaction->outlet_id,
            'alasan'          => $request->alasan,
            'old_data'        => $oldData,
            'new_data'        => $newData,
            'correction_type' => $request->correction_type,
            'hash_sebelum'    => $hashSebelum,
            'hash_sesudah'    => $hashSesudah,
            'status'          => 'flagged',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Koreksi berhasil dicatat.',
            'data'    => $log->load(['transaction:id,transaction_code', 'correctedBy:id,name']),
        ], 201);
    }

    // PATCH approve koreksi (admin)
    public function approve(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $log = CorrectionLog::whereHas('transaction', fn($q) =>
            $q->whereIn('outlet_id', $outletIds)
        )->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Log koreksi tidak ditemukan.',
            ], 404);
        }

        if ($log->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Koreksi sudah diapprove sebelumnya.',
            ], 422);
        }

        $log->update(['status' => 'approved']);

        return response()->json([
            'success' => true,
            'message' => 'Koreksi berhasil diapprove.',
            'data'    => $log->fresh()->load(['transaction:id,transaction_code', 'correctedBy:id,name']),
        ]);
    }
}
