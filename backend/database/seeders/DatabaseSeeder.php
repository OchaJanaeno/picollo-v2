<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Outlet;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Buat roles default
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'kasir', 'guard_name' => 'api']);
        Role::firstOrCreate(['name' => 'auditor', 'guard_name' => 'api']);

        // Buat user admin default
        $user = User::factory()->create([
            'name'     => 'Test User',
            'email'    => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $user->assignRole($adminRole);

        // Buat outlet default dan hubungkan ke admin
        $outlet = Outlet::create([
            'nama'        => 'Outlet Utama',
            'alamat'      => 'Jl. Contoh No. 1',
            'kota'        => 'Surabaya',
            'kode_outlet' => 'OT-UTAMA1',
            'status'      => 'aktif',
        ]);

        $user->outlets()->attach($outlet->id);
    }
}
