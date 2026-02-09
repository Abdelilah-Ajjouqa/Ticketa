'use client';

import { useEffect, useState } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { UsersIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ApiUser } from '@/lib/types';

export default function AdminUsersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<ApiUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/user');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setActionLoading(true);
    try {
      await api.delete(`/user/${deleteModal._id}`);
      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-light">Users</h1>
        <p className="text-light-muted mt-1">Manage platform users</p>
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          icon={<UsersIcon className="h-12 w-12 text-light-muted/30" />}
        />
      ) : (
        <div className="bg-dark-secondary rounded-xl border border-border-strong overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-dark-primary/50">
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    User
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 font-medium text-light-muted">
                    Joined
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-light-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-dark-primary/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                          <span className="text-accent text-xs font-bold">
                            {u.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="font-medium text-light">
                          {u.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-light-muted">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge value={u.role} />
                    </td>
                    <td className="px-6 py-4 text-light-muted">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setDeleteModal(u)}
                          className="p-2 text-light-muted bg-dark-primary/50 border border-border-strong rounded-lg hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                          title="Delete User"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete User"
        actions={
          <>
            <button
              onClick={() => setDeleteModal(null)}
              className="px-4 py-2 text-sm font-medium text-light bg-dark-primary border border-border-strong hover:border-light/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <strong className="text-light">{deleteModal?.username}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
