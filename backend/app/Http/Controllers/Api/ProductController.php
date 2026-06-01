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
            'gambar_url' => 'nullable|string|max:2048',
            'foto'       => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
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

        $gambarUrl = $request->gambar_url;
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            if (!file_exists(public_path('uploads/products'))) {
                mkdir(public_path('uploads/products'), 0755, true);
            }
            $file->move(public_path('uploads/products'), $filename);
            $gambarUrl = asset('uploads/products/' . $filename);
        }

        $product = Product::create([
            'outlet_id'  => $request->outlet_id,
            'nama'       => $request->nama,
            'kategori'   => $request->kategori,
            'harga'      => $request->harga,
            'satuan'     => $request->satuan ?? 'pcs',
            'modal'      => $request->modal,
            'stok'       => $request->stok ?? 0,
            'gambar_url' => $gambarUrl,
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
            'gambar_url' => 'nullable|string|max:2048',
            'is_active'  => 'sometimes|boolean',
            'foto'       => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
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

        $gambarUrl = $request->gambar_url;
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            if (!file_exists(public_path('uploads/products'))) {
                mkdir(public_path('uploads/products'), 0755, true);
            }
            $file->move(public_path('uploads/products'), $filename);
            $gambarUrl = asset('uploads/products/' . $filename);
        }

        $product->update(array_filter([
            'nama'       => $request->nama,
            'kategori'   => $request->kategori,
            'harga'      => $request->harga,
            'modal'      => $request->modal,
            'satuan'     => $request->satuan,
            'stok'       => $request->stok,
            'gambar_url' => $gambarUrl,
            'is_active'  => $request->is_active,
        ], fn($v) => !is_null($v)));

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