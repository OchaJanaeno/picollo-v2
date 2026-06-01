<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password as PasswordRule;

class KasirController extends Controller
{
    // GET semua kasir milik outlet admin
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasirList = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->get()
            ->map(fn($k) => [
                'id'          => $k->id,
                'name'        => $k->name,
                'email'       => $k->email,
                'no_telepon'  => $k->no_telepon,
                'is_active'   => $k->is_active,
                'last_login_at' => $k->last_login_at,
                'outlets'     => $k->outlets,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $kasirList,
        ]);
    }

    // GET detail satu kasir
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $kasir,
        ]);
    }

    // POST buat akun kasir baru
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|unique:users',
            'password'   => [
                'required',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
            'no_telepon' => 'nullable|string|max:20',
            'outlet_id'  => 'required|integer|exists:outlets,id',
        ], [
            'name.required'     => 'Nama kasir wajib diisi.',
            'email.required'    => 'Email wajib diisi.',
            'email.unique'      => 'Email sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'outlet_id.exists'  => 'Outlet tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Pastikan outlet_id milik admin ini
        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        $kasir = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'no_telepon' => $request->no_telepon,
            'is_active'  => true,
        ]);

        // Assign role kasir
        $kasir->assignRole('kasir');

        // Assign ke outlet
        $kasir->outlets()->attach($request->outlet_id);

        return response()->json([
            'success' => true,
            'message' => 'Akun kasir berhasil dibuat.',
            'data'    => [
                'id'         => $kasir->id,
                'name'       => $kasir->name,
                'email'      => $kasir->email,
                'no_telepon' => $kasir->no_telepon,
                'outlet_id'  => $request->outlet_id,
            ],
        ], 201);
    }

    // PUT update kasir
    public function update(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'       => 'sometimes|required|string|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'is_active'  => 'sometimes|boolean',
            'outlet_id'  => 'sometimes|integer|exists:outlets,id',
            'password'   => [
                'sometimes',
                'confirmed',
                PasswordRule::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Update data dasar
        $kasir->update(array_filter([
            'name'       => $request->name,
            'no_telepon' => $request->no_telepon,
            'is_active'  => $request->is_active,
            'password'   => $request->password ? Hash::make($request->password) : null,
        ], fn($v) => !is_null($v)));

        // Pindah outlet kalau diminta
        if ($request->outlet_id) {
            if (!$outletIds->contains($request->outlet_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
                ], 403);
            }
            $kasir->outlets()->sync([$request->outlet_id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data kasir berhasil diupdate.',
            'data'    => $kasir->fresh()->load('outlets:id,nama'),
        ]);
    }

    // DELETE kasir
    public function destroy(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        $kasir->outlets()->detach();
        $kasir->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun kasir berhasil dihapus.',
        ]);
    }

    // PATCH toggle status kasir
    public function toggleStatus(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $kasir = User::role('kasir')
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$kasir) {
            return response()->json([
                'success' => false,
                'message' => 'Kasir tidak ditemukan.',
            ], 404);
        }

        $kasir->is_active = !$kasir->is_active;
        $kasir->save();

        return response()->json([
            'success' => true,
            'message' => 'Status kasir berhasil diubah.',
            'data'    => $kasir,
        ]);
    }
}