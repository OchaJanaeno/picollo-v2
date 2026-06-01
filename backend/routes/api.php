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

//Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register',        [AuthController::class, 'register']);
    Route::post('/login',           [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',  [AuthController::class, 'resetPassword']);
});

//Protected routes
Route::middleware('auth:api')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::get('/me',       [AuthController::class, 'me']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });

    //Admin only
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard',                                [DashboardController::class, 'adminDashboard']);
        Route::patch('/outlets/{outlet}/toggle-status',         [OutletController::class, 'toggleStatus']);
        Route::patch('/cashiers/{cashier}/toggle-status',       [KasirController::class, 'toggleStatus']);
        Route::apiResource('/outlets',                         OutletController::class);
        Route::apiResource('/cashiers',                        KasirController::class);
        Route::apiResource('/auditors',                        AuditorController::class);
        Route::apiResource('/products',                        ProductController::class);
        Route::patch('/daily-recaps/{id}/approve',              [DailyRecapController::class, 'approve']);
        Route::patch('/correction-logs/{id}/approve',           [CorrectionLogController::class, 'approve']);
        Route::get('/audit-logs',                               [AuditLogController::class, 'index']);
        Route::get('/reports/financial',                        [ReportController::class, 'index']);
        Route::get('/reports/export/pdf',                       [ReportController::class, 'exportPdf']);
        Route::get('/verifications',                            [HashVerificationController::class, 'index']);
        Route::get('/verifications/{id}',                       [HashVerificationController::class, 'show']);
        Route::post('/verifications/verify',                    [HashVerificationController::class, 'verify']);
        Route::post('/verifications/verify-chain',              [HashVerificationController::class, 'verifyChain']);
        
        // Additional admin routes mapped from general group
        Route::get('/transactions',                             [TransactionController::class, 'index']);
        Route::get('/transactions/{id}',                        [TransactionController::class, 'show']);
        Route::get('/correction-logs',                          [CorrectionLogController::class, 'index']);
        Route::get('/correction-logs/{id}',                     [CorrectionLogController::class, 'show']);
    });

    //Admin & Kasir
    Route::middleware('role:admin|kasir')->group(function () {
        Route::apiResource('/transactions',    TransactionController::class)
            ->only(['index', 'show', 'store']);
        Route::apiResource('/daily-recaps',    DailyRecapController::class)
            ->only(['index', 'show', 'store']);
        Route::apiResource('/correction-logs', CorrectionLogController::class)
            ->only(['index', 'store']);
        Route::get('/kasir/products',          [ProductController::class, 'index']);
        Route::post('/kasir/transactions',     [TransactionController::class, 'store']);
    });


    //Auditor only
    Route::middleware('role:auditor')->group(function () {
        Route::get('/transactions',                     [TransactionController::class, 'index']);
        Route::get('/transactions/{id}',                [TransactionController::class, 'show']);
        Route::get('/daily-recaps',                     [DailyRecapController::class, 'index']);
        Route::get('/daily-recaps/{id}',                [DailyRecapController::class, 'show']);
        Route::get('/reports',                          [ReportController::class, 'index']);
        Route::get('/hash-verifications',               [HashVerificationController::class, 'index']);
        Route::get('/hash-verifications/{id}',          [HashVerificationController::class, 'show']);
        Route::post('/hash-verifications/verify',       [HashVerificationController::class, 'verify']);
        Route::get('/audit-logs',                       [AuditLogController::class, 'index']);
        Route::get('/correction-logs',                  [CorrectionLogController::class, 'index']);
    });
});