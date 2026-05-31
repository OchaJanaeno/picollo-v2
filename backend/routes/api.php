<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OutletController;
use App\Http\Controllers\Api\KasirController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\DailyRecapController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CorrectionLogController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\HashVerificationController;
use App\Http\Controllers\Api\AuditorController;

// Public routes — dengan throttle untuk keamanan
Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::get('/me',       [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/dashboard/admin',                      [DashboardController::class, 'adminDashboard']);
        Route::apiResource('/outlets',                      OutletController::class);
        Route::apiResource('/kasir',                        KasirController::class);
        Route::apiResource('/auditors',                     AuditorController::class);
        Route::apiResource('/products',                     ProductController::class);
        Route::patch('/daily-recaps/{id}/approve',          [DailyRecapController::class, 'approve']);
        Route::patch('/correction-logs/{id}/approve',       [CorrectionLogController::class, 'approve']);
        Route::post('/hash-verifications/verify-chain',     [HashVerificationController::class, 'verifyChain']);

        // Admin juga bisa akses laporan dan audit
        Route::get('/reports',                              [ReportController::class, 'index']);
        Route::get('/reports/export-pdf',                   [ReportController::class, 'exportPdf']);
        Route::get('/hash-verifications',                   [HashVerificationController::class, 'index']);
        Route::get('/hash-verifications/{id}',              [HashVerificationController::class, 'show']);
        Route::post('/hash-verifications/verify',           [HashVerificationController::class, 'verify']);
        Route::get('/audit-logs',                           [AuditLogController::class, 'index']);

        // Admin juga bisa lihat koreksi yang diajukan kasir
        Route::get('/correction-logs',                      [CorrectionLogController::class, 'index']);
    });

    // Admin & Kasir
    Route::middleware('role:admin|kasir')->group(function () {
        Route::apiResource('/transactions', TransactionController::class)
            ->only(['index', 'show', 'store']);
        Route::apiResource('/daily-recaps', DailyRecapController::class)
            ->only(['index', 'show', 'store']);

        // FIX: Kasir bisa buat koreksi (store), admin bisa approve (sudah di group admin)
        Route::post('/correction-logs',                     [CorrectionLogController::class, 'store']);
    });

    // FIX: Auditor only — dipisah dan tidak duplikat dengan admin
    // Auditor punya akses read-only ke semua data audit
    Route::middleware('role:auditor')->group(function () {
        Route::get('/transactions',                         [TransactionController::class, 'index']);
        Route::get('/transactions/{id}',                    [TransactionController::class, 'show']);
        Route::get('/daily-recaps',                         [DailyRecapController::class, 'index']);
        Route::get('/daily-recaps/{id}',                    [DailyRecapController::class, 'show']);
        Route::get('/reports',                              [ReportController::class, 'index']);
        Route::get('/hash-verifications',                   [HashVerificationController::class, 'index']);
        Route::get('/hash-verifications/{id}',              [HashVerificationController::class, 'show']);
        Route::post('/hash-verifications/verify',           [HashVerificationController::class, 'verify']);
        Route::get('/audit-logs',                           [AuditLogController::class, 'index']);
        Route::get('/correction-logs',                      [CorrectionLogController::class, 'index']);
    });
});