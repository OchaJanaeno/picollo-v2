<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop products table to recreate it properly
        Schema::dropIfExists('products');

        // 1. OUTLETS
        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('alamat')->nullable();
            $table->string('kota')->nullable();
            $table->string('kode_outlet')->unique();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();
        });

        // 2. ADMIN_OUTLET (pivot)
        Schema::create('admin_outlet', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->timestamps();
        });

        // 3. PRODUCTS
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->string('nama');
            $table->string('kategori')->nullable();
            $table->decimal('harga', 15, 2)->default(0);
            $table->decimal('modal', 15, 2)->nullable();
            $table->string('satuan')->default('pcs');
            $table->integer('stok')->default(0);
            $table->string('gambar_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. TRANSACTIONS
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code')->unique();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('metode_pembayaran');
            $table->string('payment_reference')->nullable();
            $table->string('status');
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        // 5. TRANSACTION_ITEMS
        Schema::create('transaction_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('nama_produk');
            $table->decimal('harga_satuan', 15, 2)->default(0);
            $table->integer('qty')->default(1);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->timestamps();
        });

        // 6. AUDIT_LOGS
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action');
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });

        // 7. CORRECTION_LOGS
        Schema::create('correction_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('corrected_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('audit_log_id')->nullable()->constrained('audit_logs')->nullOnDelete();
            $table->text('alasan');
            $table->text('old_data');
            $table->text('new_data');
            $table->string('correction_type');
            $table->string('hash_sebelum')->nullable();
            $table->string('hash_sesudah')->nullable();
            $table->string('status');
            $table->timestamps();
        });

        // 8. DAILY_RECAPS
        Schema::create('daily_recaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('tanggal');
            $table->integer('total_transaksi')->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('total_qris', 15, 2)->default(0);
            $table->decimal('total_tunai', 15, 2)->default(0);
            $table->string('hash_rekap')->nullable();
            $table->string('status');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
        });

        // 9. HASH_VERIFICATIONS
        Schema::create('hash_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->string('hash_sha256');
            $table->string('previous_hash')->nullable();
            $table->string('status');
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hash_verifications');
        Schema::dropIfExists('daily_recaps');
        Schema::dropIfExists('correction_logs');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('transaction_items');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('products');
        Schema::dropIfExists('admin_outlet');
        Schema::dropIfExists('outlets');
    }
};
