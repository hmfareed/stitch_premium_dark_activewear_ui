'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';

type StaffRole = 'manager' | 'order_staff' | 'fulfillment_staff' | 'customer_service';
type StaffStatus = 'active' | 'inactive' | 'suspended';

interface StaffMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  permissions: {
    viewOrders: boolean;
    manageOrders: boolean;
    viewProducts: boolean;
    manageProducts: boolean;
    viewAnalytics: boolean;
    viewCustomers: boolean;
    manageStaff: boolean;
    viewPayouts: boolean;
  };
  workSchedule: {
    monday: { start: string; end: string; working: boolean };
    tuesday: { start: string; end: string; working: boolean };
    wednesday: { start: string; end: string; working: boolean };
    thursday: { start: string; end: string; working: boolean };
    friday: { start: string; end: string; working: boolean };
    saturday: { start: string; end: string; working: boolean };
    sunday: { start: string; end: string; working: boolean };
  };
  ordersProcessed: number;
  customerRating: number;
  hiredAt: string;
  lastActiveAt?: string;
}

const roleLabels: Record<StaffRole, string> = {
  manager: 'Manager',
  order_staff: 'Order Staff',
  fulfillment_staff: 'Fulfillment Staff',
  customer_service: 'Customer Service',
};

const roleColors: Record<StaffRole, string> = {
  manager: '#a855f7',
  order_staff: '#00e5ff',
  fulfillment_staff: 'var(--lime-400)',
  customer_service: '#f59e0b',
};

const defaultPermissionsByRole: Record<StaffRole, StaffMember['permissions']> = {
  manager: {
    viewOrders: true,
    manageOrders: true,
    viewProducts: true,
    manageProducts: true,
    viewAnalytics: true,
    viewCustomers: true,
    manageStaff: true,
    viewPayouts: true,
  },
  order_staff: {
    viewOrders: true,
    manageOrders: true,
    viewProducts: true,
    manageProducts: false,
    viewAnalytics: false,
    viewCustomers: true,
    manageStaff: false,
    viewPayouts: false,
  },
  fulfillment_staff: {
    viewOrders: true,
    manageOrders: true,
    viewProducts: true,
    manageProducts: false,
    viewAnalytics: false,
    viewCustomers: false,
    manageStaff: false,
    viewPayouts: false,
  },
  customer_service: {
    viewOrders: true,
    manageOrders: false,
    viewProducts: true,
    manageProducts: false,
    viewAnalytics: false,
    viewCustomers: true,
    manageStaff: false,
    viewPayouts: false,
  },
};

export default function VendorStaffManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [filterRole, setFilterRole] = useState<StaffRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<StaffStatus | 'all'>('all');

  // Form state for adding/editing staff
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'order_staff' as StaffRole,
    customPermissions: false,
    permissions: defaultPermissionsByRole.order_staff,
  });

  useEffect(() => {
    loadStaffMembers();
  }, []);

  const loadStaffMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendor-staff');
      if (res.ok) {
        const data = await res.json();
        setStaffMembers(data.staff || []);
      } else {
        showToast('Failed to load staff members', 'error');
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      showToast('Error loading staff members', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStaff = async () => {
    try {
      const res = await fetch('/api/vendor-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: formData.customPermissions ? formData.permissions : defaultPermissionsByRole[formData.role],
        }),
      });

      if (res.ok) {
        showToast('Staff member added successfully', 'success');
        setShowAddModal(false);
        resetForm();
        loadStaffMembers();
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to add staff member', 'error');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      showToast('Error adding staff member', 'error');
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return;

    try {
      const res = await fetch(`/api/vendor-staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          permissions: formData.customPermissions ? formData.permissions : defaultPermissionsByRole[formData.role],
        }),
      });

      if (res.ok) {
        showToast('Staff member updated successfully', 'success');
        setShowEditModal(false);
        setSelectedStaff(null);
        resetForm();
        loadStaffMembers();
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to update staff member', 'error');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showToast('Error updating staff member', 'error');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    try {
      const res = await fetch(`/api/vendor-staff/${staffId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Staff member removed successfully', 'success');
        loadStaffMembers();
      } else {
        showToast('Failed to remove staff member', 'error');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      showToast('Error removing staff member', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      role: 'order_staff',
      customPermissions: false,
      permissions: defaultPermissionsByRole.order_staff,
    });
  };

  const openEditModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      customPermissions: JSON.stringify(staff.permissions) !== JSON.stringify(defaultPermissionsByRole[staff.role]),
      permissions: staff.permissions,
    });
    setShowEditModal(true);
  };

  const filteredStaff = staffMembers.filter(staff => {
    if (filterRole !== 'all' && staff.role !== filterRole) return false;
    if (filterStatus !== 'all' && staff.status !== filterStatus) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '1.75rem' }}>Staff Management</h1>
          <p style={{ margin: 0, color: 'var(--on-surface-variant)' }}>Manage your team members and their permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: 'var(--lime-400)',
            border: 'none',
            borderRadius: 8,
            color: '#000',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span className="material-symbols-outlined">add</span>
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as StaffRole | 'all')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--outline)',
            background: 'var(--surface)',
            color: 'var(--foreground)'
          }}
        >
          <option value="all">All Roles</option>
          <option value="manager">Manager</option>
          <option value="order_staff">Order Staff</option>
          <option value="fulfillment_staff">Fulfillment Staff</option>
          <option value="customer_service">Customer Service</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StaffStatus | 'all')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--outline)',
            background: 'var(--surface)',
            color: 'var(--foreground)'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Staff List */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--surface-container)' }}>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Staff Member</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600 }}>Performance</th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, display: 'block' }}>group_off</span>
                  No staff members found
                </td>
              </tr>
            ) : (
              filteredStaff.map((staff) => (
                <tr key={staff.id} style={{ borderTop: '1px solid var(--outline)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--surface-container-high)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: 'var(--on-surface-variant)'
                      }}>
                        {staff.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 600 }}>{staff.fullName}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{staff.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${roleColors[staff.role]}20`,
                      color: roleColors[staff.role]
                    }}>
                      {roleLabels[staff.role]}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: staff.status === 'active' ? 'rgba(195, 244, 0, 0.2)' : staff.status === 'inactive' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                      color: staff.status === 'active' ? 'var(--lime-400)' : staff.status === 'inactive' ? '#ff9800' : '#f44336'
                    }}>
                      {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
                        {staff.ordersProcessed} orders processed
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f59e0b' }}>star</span>
                        <span style={{ fontSize: '0.75rem' }}>{staff.customerRating.toFixed(1)}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(staff)}
                        style={{
                          padding: '8px',
                          background: 'var(--surface-container)',
                          border: '1px solid var(--outline)',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: 'var(--foreground)'
                        }}
                        title="Edit"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        style={{
                          padding: '8px',
                          background: 'rgba(244, 67, 54, 0.1)',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                          borderRadius: 8,
                          cursor: 'pointer',
                          color: '#f44336'
                        }}
                        title="Delete"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals would go here - Add/Edit staff modals */}
    </div>
  );
}
