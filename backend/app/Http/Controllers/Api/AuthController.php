<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Outlet;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use App\Models\AuditLog;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            'email'       => 'required|string|email|max:255|unique:users',
            'password'    => [
                'required',
                'confirmed',
                PasswordRule::min(8)
            ],
            'nama_bisnis' => 'required|string|max:255',
        ], [
            'name.required'        => 'Nama lengkap wajib diisi.',
            'email.required'       => 'Email wajib diisi.',
            'email.unique'         => 'Email sudah terdaftar.',
            'password.required'    => 'Password wajib diisi.',
            'nama_bisnis.required' => 'Nama bisnis wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $user->assignRole('admin');

        $outlet = Outlet::create([
            'nama'        => $request->nama_bisnis,
            'kode_outlet' => 'OT-' . strtoupper(Str::random(6)),
            'status'      => 'aktif',
        ]);

        $user->outlets()->attach($outlet->id);

        $token = JWTAuth::fromUser($user);

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil!',
            'data'    => [
                'user'   => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->getRoleNames()->first(),
                ],
                'outlet' => [
                    'id'          => $outlet->id,
                    'nama'        => $outlet->nama,
                    'kode_outlet' => $outlet->kode_outlet,
                ],
                'token' => $token,
            ]
        ], 201);
    }

    // LOGIN
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required',
        ], [
            'email.required'    => 'Email wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            if (!$token = JWTAuth::attempt($credentials)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email atau password salah.',
                ], 401);
            }
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat membuat token.',
            ], 500);
        }

        $user = JWTAuth::user();
        $user->update(['last_login_at' => now()]);

        // Log login activity
        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'entity_type' => 'session',
            'entity_id' => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil!',
            'data'    => [
                'user'  => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => $user->getRoleNames()->first(),
                ],
                'token'      => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ]
        ]);
    }

    // LOGOUT
    public function logout(Request $request)
    {
        try {
            $user = JWTAuth::user();
            if ($user) {
                // Log logout activity
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'logout',
                    'entity_type' => 'session',
                    'entity_id' => $user->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }

            JWTAuth::invalidate(JWTAuth::getToken());
            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil.',
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal logout.',
            ], 500);
        }
    }

    // ME
    public function me()
    {
        $user = JWTAuth::user();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'role'       => $user->getRoleNames()->first(),
                'no_telepon' => $user->no_telepon,
                'instansi'   => $user->instansi,
                'avatar_url' => $user->avatar_url,
                'outlets'    => $user->outlets,
            ]
        ]);
    }

    // UPDATE PROFILE
    public function updateProfile(Request $request)
    {
        $user = JWTAuth::user();

        $validator = Validator::make($request->all(), [
            'name'       => 'nullable|string|max:255',
            'no_telepon' => 'nullable|string|max:20',
            'instansi'   => 'nullable|string|max:255',
            'avatar'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        $dataToUpdate = [];
        if ($request->has('name')) $dataToUpdate['name'] = $request->name;
        if ($request->has('no_telepon')) $dataToUpdate['no_telepon'] = $request->no_telepon;
        if ($request->has('instansi')) $dataToUpdate['instansi'] = $request->instansi;

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            // Move file to public/avatars to ensure it is directly accessible
            $file->move(public_path('avatars'), $filename);
            
            // Delete old avatar if it exists
            if ($user->avatar_url) {
                $oldPath = public_path(parse_url($user->avatar_url, PHP_URL_PATH));
                if (file_exists($oldPath) && is_file($oldPath)) {
                    @unlink($oldPath);
                }
            }
            
            $dataToUpdate['avatar_url'] = url('avatars/' . $filename);
        }

        if (!empty($dataToUpdate)) {
            $user->update($dataToUpdate);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => $user->fresh()
        ]);
    }

    // REFRESH TOKEN
    public function refresh()
    {
        try {
            $token = JWTAuth::refresh(JWTAuth::getToken());
            return response()->json([
                'success'    => true,
                'token'      => $token,
                'token_type' => 'bearer',
                'expires_in' => config('jwt.ttl') * 60,
            ]);
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token tidak valid atau sudah kadaluarsa.',
            ], 401);
        }
    }

    // FORGOT PASSWORD
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email'    => 'Format email tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'success' => true,
            'message' => 'Jika email terdaftar, link reset password telah dikirim.',
        ]);
    }

    // RESET PASSWORD
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8)
            ],
        ], [
            'token.required'    => 'Token reset tidak valid.',
            'email.required'    => 'Email wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal.',
                'errors'  => $validator->errors()
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login dengan password baru.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Token tidak valid atau sudah kadaluarsa.',
            'errors'  => ['token' => [__($status)]]
        ], 422);
    }
}