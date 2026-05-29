<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    // GET semua produk
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $products = Product::whereIn('outlet_id', $outletIds)
            ->with('outlet:id,nama')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }

    // GET detail produk
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $product = Product::whereIn('outlet_id', $outletIds)
            ->with('outlet:id,nama')
            ->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $product,
        ]);
    }

    // POST buat produk baru
    public function store(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $validator = Validator::make($request->all(), [
            'outlet_id'  => 'required|integer|in:' . $outletIds->join(','),
            'nama'       => 'required|string|max:255',
            'kategori'   => 'nullable|string|max:255',
            'harga'      => 'required|numeric|min:0',
            'satuan'     => 'nullable|string|max:255',
            'modal'      => 'nullable|numeric|min:0',
            'stok'       => 'nullable|integer|min:0',
            'gambar_url' => 'nullable|url',
        ], [
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'outlet_id.in'       => 'Anda tidak memiliki akses ke outlet tersebut.',
            'nama.required'      => 'Nama produk wajib diisi.',
            'harga.required'     => 'Harga wajib diisi.',
            'harga.numeric'      => 'Harga harus berupa angka.',
            'harga.min'          => 'Harga tidak boleh minus.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $product = Product::create([
            'outlet_id'  => $request->outlet_id,
            'nama'       => $request->nama,
            'kategori'   => $request->kategori,
            'harga'      => $request->harga,
            'satuan'     => $request->satuan ?? 'pcs',
            'modal'      => $request->modal,
            'stok'       => $request->stok ?? 0,
            'gambar_url' => $request->gambar_url,
            'is_active'  => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data'    => $product->load('outlet:id,nama'),
        ], 201);
    }

    // PUT update produk
    public function update(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $product = Product::whereIn('outlet_id', $outletIds)->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nama'       => 'sometimes|required|string|max:255',
            'kategori'   => 'nullable|string|max:255',
            'harga'      => 'sometimes|required|numeric|min:0',
            'satuan'     => 'nullable|string|max:255',
            'modal'      => 'nullable|numeric|min:0',
            'stok'       => 'nullable|integer|min:0',
            'gambar_url' => 'nullable|url',
            'is_active'  => 'sometimes|boolean',
        ], [
            'nama.required'  => 'Nama produk wajib diisi.',
            'harga.required' => 'Harga wajib diisi.',
            'harga.numeric'  => 'Harga harus berupa angka.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $product->update($request->only(
            'nama', 'kategori', 'harga', 'modal', 'satuan', 'stok', 'gambar_url', 'is_active'
        ));

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diupdate.',
            'data'    => $product->fresh()->load('outlet:id,nama'),
        ]);
    }

    // DELETE produk
    public function destroy(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $product = Product::whereIn('outlet_id', $outletIds)->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
}