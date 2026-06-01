<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Outlet extends Model
{
    protected $fillable = [
        'nama',
        'alamat',
        'kota',
        'kode_outlet',
        'status',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'admin_outlet');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function dailyRecaps()
    {
        return $this->hasMany(DailyRecap::class);
    }

    public function correctionLogs()
    {
        return $this->hasMany(CorrectionLog::class);
    }
}