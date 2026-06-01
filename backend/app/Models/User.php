<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;
use App\Models\Outlet;
use App\Models\Transaction;
use App\Models\AuditLog;
use App\Models\CorrectionLog;
use App\Models\DailyRecap;
use App\Models\HashVerification;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'no_telepon',
        'avatar_url',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
        'is_active'         => 'boolean',
    ];

    // JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->getRoleNames()->first(),
        ];
    }

    // Relations
    public function outlets()
    {
        return $this->belongsToMany(Outlet::class, 'admin_outlet');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function correctionLogs()
    {
        return $this->hasMany(CorrectionLog::class, 'corrected_by');
    }

    public function dailyRecaps()
    {
        return $this->hasMany(DailyRecap::class, 'user_id');
    }

    public function approvedDailyRecaps()
    {
        return $this->hasMany(DailyRecap::class, 'approved_by');
    }

    public function verifiedHashes()
    {
        return $this->hasMany(HashVerification::class, 'verified_by');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token, $this->email));
    }
}
