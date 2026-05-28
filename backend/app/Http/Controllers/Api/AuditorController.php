<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuditorController extends Controller
{
    //GET semua auditor
    public function index(Request $request)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditors = User::role(['auditor_internal', 'auditor_eksternal'])
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'name'          => $a->name,
                'email'         => $a->email,
                'no_telepon'    => $a->no_telepon,
                'is_active'     => $a->is_active,
                'last_login_at' => $a->last_login_at,
                'outlets'       => $a->outlets,
            ]);

        return response()->json([
            'success' => true,
            'data'    => $auditors,
        ]);
    }

    //GET detail auditor
    public function show(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditor = User::role(['auditor_internal', 'auditor_eksternal'])
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->with('outlets:id,nama,kode_outlet')
            ->find($id);

        if (!$auditor) {
            return response()->json([
                'success' => false,
                'message' => 'Auditor tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $auditor,
        ]);
    }

    //POST buat akun auditor
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
            'name.required'      => 'Nama auditor wajib diisi.',
            'email.required'     => 'Email wajib diisi.',
            'email.unique'       => 'Email sudah terdaftar.',
            'password.required'  => 'Password wajib diisi.',
            'outlet_id.required' => 'Outlet wajib dipilih.',
            'outlet_id.exists'   => 'Outlet tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Pastikan outlet milik admin ini
        $outletIds = $request->user()->outlets()->pluck('outlets.id');
        if (!$outletIds->contains($request->outlet_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
            ], 403);
        }

        $auditor = User::create([
            'name'       => $request->name,
            'email'      => $request->email,
            'password'   => Hash::make($request->password),
            'no_telepon' => $request->no_telepon,
            'is_active'  => true,
        ]);

        // Assign role auditor
        $auditor->assignRole('auditor');

        // Assign ke outlet
        $auditor->outlets()->attach($request->outlet_id);

        return response()->json([
            'success' => true,
            'message' => 'Akun auditor berhasil dibuat.',
            'data'    => [
                'id'         => $auditor->id,
                'name'       => $auditor->name,
                'email'      => $auditor->email,
                'no_telepon' => $auditor->no_telepon,
                'outlet_id'  => $request->outlet_id,
            ],
        ], 201);
    }

    //PUT update auditor
    public function update(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditor = User::role(['auditor_internal', 'auditor_eksternal'])
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$auditor) {
            return response()->json([
                'success' => false,
                'message' => 'Auditor tidak ditemukan.',
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

        $auditor->update(array_filter([
            'name'       => $request->name,
            'no_telepon' => $request->no_telepon,
            'is_active'  => $request->is_active,
            'password'   => $request->password ? Hash::make($request->password) : null,
        ], fn($v) => !is_null($v)));

        if ($request->outlet_id) {
            if (!$outletIds->contains($request->outlet_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke outlet tersebut.',
                ], 403);
            }
            $auditor->outlets()->sync([$request->outlet_id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data auditor berhasil diupdate.',
            'data'    => $auditor->fresh()->load('outlets:id,nama'),
        ]);
    }

    //DELETE auditor
    public function destroy(Request $request, $id)
    {
        $outletIds = $request->user()->outlets()->pluck('outlets.id');

        $auditor = User::role(['auditor_internal', 'auditor_eksternal'])
            ->whereHas('outlets', fn($q) => $q->whereIn('outlets.id', $outletIds))
            ->find($id);

        if (!$auditor) {
            return response()->json([
                'success' => false,
                'message' => 'Auditor tidak ditemukan.',
            ], 404);
        }

        $auditor->outlets()->detach();
        $auditor->tokens()->delete();
        $auditor->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun auditor berhasil dihapus.',
        ]);
    }
}