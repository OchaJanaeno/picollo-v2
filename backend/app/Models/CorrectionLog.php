<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CorrectionLog extends Model
{
    protected $fillable = [
        'transaction_id',
        'corrected_by',
        'outlet_id',
        'audit_log_id',
        'alasan',
        'old_data',
        'new_data',
        'correction_type',
        'hash_sebelum',
        'hash_sesudah',
        'status',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function correctedBy()
    {
        return $this->belongsTo(User::class, 'corrected_by');
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
    }

    public function auditLog()
    {
        return $this->belongsTo(AuditLog::class);
    }
}
