<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\HashVerification;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class TransactionController extends Controller
{
    //GET semua transaksi
    public function index(Request $request)
    {
        $user = $request->user();
        $outletIds = $user->outlets()->pluck('outlets.id');

        $query = Transaction::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name', 'items'])
            ->orderByDesc('created_at');

        if ($user->hasRole('kasir')) {
            $query->where('user_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate(15),
        ]);
    }

    //GET detail transaksi
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $transaction = Transaction::whereIn('outlet_id', $outletIds)
            ->with(['outlet:id,nama', 'kasir:id,name', 'items', 'hashVerification'])
            ->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction,
        ]);
    }

    //POST buat transaksi baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'outlet_id' => 'required|integer|exists:outlets,id',
            'metode_pembayaran' => 'required|in:qris,tunai,transfer',
            'payment_reference' => 'nullable|string|max:255',
            'catatan' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.qty' => 'required|integer|min:1',
        ], [
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
            'metode_pembayaran.in' => 'Metode pembayaran harus qris, tunai, atau transfer.',
            'items.required' => 'Item transaksi wajib diisi.',
            'items.min' => 'Minimal 1 item transaksi.',
            'items.*.product_id.required' => 'Product ID wajib diisi.',
            'items.*.qty.required' => 'Qty wajib diisi.',
            'items.*.qty.min' => 'Qty minimal 1.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        DB::beginTransaction();
        try {
            $totalAmount = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $product = Product::where('id', $item['product_id'])
                    ->where('outlet_id', $request->outlet_id)
                    ->where('is_active', true)
                    ->first();

                if (!$product) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Produk ID {$item['product_id']} tidak ditemukan atau tidak aktif.",
                    ], 422);
                }

                // Cek stok kalau stok dikelola
                if ($product->stok !== null && $product->stok < $item['qty']) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Stok produk '{$product->nama}' tidak cukup. Stok tersedia: {$product->stok}.",
                    ], 422);
                }

                $subtotal = $product->harga * $item['qty'];
                $totalAmount += $subtotal;

                $itemsData[] = [
                    'product_id' => $product->id,
                    'nama_produk' => $product->nama,
                    'harga_satuan' => $product->harga,
                    'qty' => $item['qty'],
                    'subtotal' => $subtotal,
                ];

                // Kurangi stok kalau stok dikelola
                if ($product->stok !== null) {
                    $product->decrement('stok', $item['qty']);
                }
            }

            // Buat transaksi
            $transaction = Transaction::create([
                'transaction_code' => 'TRX-' . strtoupper(Str::random(8)),
                'outlet_id' => $request->outlet_id,
                'user_id' => $request->user()->id,
                'total_amount' => $totalAmount,
                'metode_pembayaran' => $request->metode_pembayaran,
                'payment_reference' => $request->payment_reference,
                'status' => 'success',
                'catatan' => $request->catatan,
            ]);

            // Simpan items
            foreach ($itemsData as $item) {
                TransactionItem::create(array_merge($item, [
                    'transaction_id' => $transaction->id,
                ]));
            }

            // Ambil previous_hash dari transaksi terakhir di outlet yang sama
            $previousHash = HashVerification::whereHas('transaction', function ($q) use ($request) {
                $q->where('outlet_id', $request->outlet_id)
                    ->where('status', 'success');
            })
                ->orderByDesc('id')
                ->value('hash_sha256');

            // Generate hash SHA-256 (include previous_hash untuk chain)
            $hashData = json_encode([
                'transaction_code' => $transaction->transaction_code,
                'outlet_id' => $transaction->outlet_id,
                'total_amount' => $transaction->total_amount,
                'items' => $itemsData,
                'created_at' => $transaction->created_at->timestamp,
                'previous_hash' => $previousHash,
            ]);
            $hash = hash('sha256', $hashData);

            HashVerification::create([
                'transaction_id' => $transaction->id,
                'hash_sha256' => $hash,
                'previous_hash' => $previousHash,
                'status' => 'pending',
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibuat.',
                'data' => $transaction->load(['items', 'hashVerification']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }
}
