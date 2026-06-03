<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\HashVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentCallbackController extends Controller
{
    public function midtransNotification(Request $request)
    {
        $payload = $request->all();
        Log::info('Midtrans Notification', $payload);

        \Midtrans\Config::$serverKey = config('midtrans.server_key');
        \Midtrans\Config::$isProduction = config('midtrans.is_production');

        try {
            $notification = new \Midtrans\Notification();
        } catch (\Exception $e) {
            Log::error('Midtrans Error: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }

        $transactionStatus = $notification->transaction_status;
        $orderId = $notification->order_id;

        DB::beginTransaction();
        try {
            /** @var Transaction $transaction */
            $transaction = Transaction::where('transaction_code', $orderId)
                ->lockForUpdate()
                ->first();

            if (!$transaction) {
                DB::rollBack();
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            if ($transaction->status === 'success') {
                DB::rollBack();
                return response()->json(['message' => 'Already processed']);
            }

            if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
                $transaction->update(['status' => 'success']);

                // Generate HashVerification karena transaksi sudah lunas
                $previousHash = HashVerification::whereHas('transaction', function ($q) use ($transaction) {
                    $q->where('transactions.outlet_id', $transaction->outlet_id)
                      ->where('transactions.status', 'success');
                })
                    ->orderByDesc('id')
                    ->value('hash_sha256');

                $signature = implode('|', [
                    $transaction->transaction_code,
                    $transaction->outlet_id,
                    $transaction->total_amount,
                    $transaction->created_at->timestamp,
                    $previousHash ?? '',
                ]);

                $hash = hash('sha256', $signature);

                HashVerification::create([
                    'transaction_id' => $transaction->id,
                    'hash_sha256'    => $hash,
                    'previous_hash'  => $previousHash,
                    'status'         => 'verified',
                ]);
                
            } else if ($transactionStatus == 'cancel' || $transactionStatus == 'deny' || $transactionStatus == 'expire') {
                $transaction->update(['status' => 'voided']);
                
                // Return stock if cancelled
                $items = $transaction->items;
                foreach ($items as $item) {
                    if ($item->product_id) {
                        DB::table('outlet_product')
                            ->where('outlet_id', $transaction->outlet_id)
                            ->where('product_id', $item->product_id)
                            ->increment('stok', $item->qty);
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment callback error: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }
}
