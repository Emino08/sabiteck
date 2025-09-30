<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Database\Connection;

class UserRepository
{
    private Connection $db;

    public function __construct(Connection $db)
    {
        $this->db = $db;
    }

    public function findById(int $id): ?array
    {
        $result = $this->db->table('users')
            ->select([
                'users.*',
                'roles.name as role_name',
                'institutions.name as institution_name'
            ])
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->leftJoin('institutions', 'users.institution_id', '=', 'institutions.id')
            ->where('users.id', $id)
            ->first();

        return $result ? (array)$result : null;
    }

    public function findByEmail(string $email): ?array
    {
        $result = $this->db->table('users')
            ->select([
                'users.*',
                'roles.name as role_name',
                'institutions.name as institution_name'
            ])
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->leftJoin('institutions', 'users.institution_id', '=', 'institutions.id')
            ->where('users.email', $email)
            ->first();

        return $result ? (array)$result : null;
    }

    public function findByUuid(string $uuid): ?array
    {
        $result = $this->db->table('users')
            ->select([
                'users.*',
                'roles.name as role_name',
                'institutions.name as institution_name'
            ])
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->leftJoin('institutions', 'users.institution_id', '=', 'institutions.id')
            ->where('users.uuid', $uuid)
            ->first();

        return $result ? (array)$result : null;
    }

    public function create(array $data): int
    {
        $data['created_at'] = now();
        $data['updated_at'] = now();

        return $this->db->table('users')->insertGetId($data);
    }

    public function update(int $id, array $data): bool
    {
        $data['updated_at'] = now();

        return $this->db->table('users')
            ->where('id', $id)
            ->update($data) > 0;
    }

    public function delete(int $id): bool
    {
        return $this->db->table('users')
            ->where('id', $id)
            ->delete() > 0;
    }

    public function updateLastLogin(int $id): void
    {
        $this->db->table('users')
            ->where('id', $id)
            ->update(['last_login_at' => now()]);
    }

    public function updatePassword(int $id, string $passwordHash): bool
    {
        return $this->db->table('users')
            ->where('id', $id)
            ->update([
                'password_hash' => $passwordHash,
                'updated_at' => now()
            ]) > 0;
    }

    public function getRoleIdByName(string $roleName): ?int
    {
        $result = $this->db->table('roles')
            ->where('name', $roleName)
            ->value('id');

        return $result ? (int)$result : null;
    }

    public function getUserPermissions(int $userId): array
    {
        $permissions = $this->db->table('users')
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('users.id', $userId)
            ->pluck('permissions.name')
            ->toArray();

        return $permissions;
    }

    public function paginate(array $filters = [], array $options = []): array
    {
        $page = $options['page'] ?? 1;
        $perPage = $options['per_page'] ?? 20;
        $offset = ($page - 1) * $perPage;

        $query = $this->db->table('users')
            ->select([
                'users.*',
                'roles.name as role_name',
                'institutions.name as institution_name'
            ])
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->leftJoin('institutions', 'users.institution_id', '=', 'institutions.id');

        // Apply filters
        if (!empty($filters['role_id'])) {
            $query->where('users.role_id', $filters['role_id']);
        }

        if (!empty($filters['institution_id'])) {
            $query->where('users.institution_id', $filters['institution_id']);
        }

        if (!empty($filters['is_active'])) {
            $query->where('users.is_active', $filters['is_active']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('users.full_name', 'like', $search)
                  ->orWhere('users.email', 'like', $search);
            });
        }

        // Get total count
        $total = $query->count();

        // Get paginated results
        $data = $query
            ->orderBy('users.created_at', 'desc')
            ->offset($offset)
            ->limit($perPage)
            ->get()
            ->toArray();

        return [
            'data' => array_map(function ($item) {
                $item = (array)$item;
                unset($item['password_hash'], $item['two_factor_secret']);
                return $item;
            }, $data),
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage)
        ];
    }

    public function getInvestigators(int $institutionId = null): array
    {
        $query = $this->db->table('users')
            ->select(['users.id', 'users.full_name', 'users.email'])
            ->join('roles', 'users.role_id', '=', 'roles.id')
            ->where('roles.name', 'investigator')
            ->where('users.is_active', true);

        if ($institutionId) {
            $query->where('users.institution_id', $institutionId);
        }

        return $query->get()->toArray();
    }
}