'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AppContext';
import BrandLogo from '@/components/BrandLogo';

interface RiderApplicationData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  onlineStatus: string;
  vehicleType: string;
  vehicleModel?: string;
  vehicleRegistration?: string;
  vehicleYear?: number;
  preferredZones: string[];
  momoNumber?: string;
  momoNetwork?: string;
  documents: Array<{ type: string; url: string; verified: boolean }>;
  rejectionReason?: string;
  applicationSubmittedAt?: string;
  approvedAt?: string;
}

export default function RiderApplicationStatusPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [loadingApp, setLoadingApp] = useState(true);
  const [riderData, setRiderData] = useState<RiderApplicationData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchApplicationStatus();
  }, []);

  const fetchApplicationStatus = async () => {
    setLoadingApp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/rider/apply');
      const data = await res.json();

      if (res.ok && data.hasApplication && data.rider) {
        setRiderData(data.rider);
      } else {
        setRiderData(null);
        if (!res.ok && res.status !== 404) {
          setErrorMsg(data.message || 'Unable to load application status');
        }
      }
    } catch (err) {
      console.error('Error fetching application status:', err);
      setErrorMsg('Network error checking application status.');
    } finally {
      setLoadingApp(false);
    }
  };

  if (isLoading || loadingApp) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--lime-400)', marginBottom: 16 }} />
        <p style={{ fontFamily: 'var(--font-inter)', color: 'var(--on-surface-variant)', fontSize: 14 }}>Fetching rider application status…</p>
      </div>
    );
  }

  // Helper for status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return { bg: 'rgba(195, 244, 0, 0.15)', color: 'var(--lime-400)', border: '1px solid var(--lime-400)', label: 'Approved & Active' };
      case 'rejected':
        return { bg: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', border: '1px solid #ff4444', label: 'Application Rejected' };
      case 'under_review':
        return { bg: 'rgba(255, 170, 0, 0.15)', color: '#ffaa00', border: '1px solid #ffaa00', label: 'Under Review' };
      case 'suspended':
        return { bg: 'rgba(255, 68, 68, 0.15)', color: '#ff4444', border: '1px solid #ff4444', label: 'Account Suspended' };
      default:
        return { bg: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: '1px solid #00e5ff', label: 'Pending Review' };
    }
  };

  const badge = riderData ? getStatusBadge(riderData.status) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)', padding: '32px 20px 60px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        
        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <BrandLogo size={48} />
          </Link>

          <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: 28, fontWeight: 900, marginTop: 16, color: 'var(--foreground)' }}>
            Rider Application Status
          </h1>
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: 'var(--on-surface-variant)', marginTop: 4 }}>
            AfriCart Nationwide Delivery Fleet
          </p>
        </div>

        {/* Card Content */}
        {!riderData ? (
          <div className="glass animate-fade-in-up" style={{ borderRadius: 20, padding: '40px 32px', textAlign: 'center', border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--on-surface-variant)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>description</span>
            </div>

            <h3 style={{ fontFamily: 'var(--font-lexend)', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No Active Application Found</h3>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: 14, color: 'var(--on-surface-variant)', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
              You haven't submitted a rider application yet. Start your registration today to earn money delivering orders across Ghana.
            </p>

            <Link href="/rider/apply" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 32px',
              borderRadius: 12,
              background: 'var(--lime-400)',
              color: '#000',
              fontFamily: 'var(--font-lexend)',
              fontWeight: 800,
              fontSize: 14,
              textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(195, 244, 0, 0.3)'
            }}>
              Start Rider Application →
            </Link>
          </div>
        ) : (
          <div className="glass animate-fade-in-up" style={{ borderRadius: 20, padding: '36px 32px', border: '1px solid var(--outline)', background: 'var(--surface)' }}>
            
            {/* Status Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingBottom: 24, borderBottom: '1px solid var(--outline)' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-lexend)', textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em' }}>
                  Applicant Name
                </span>
                <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: 22, fontWeight: 800, margin: '4px 0 0 0' }}>
                  {riderData.fullName}
                </h2>
              </div>

              {badge && (
                <div style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  background: badge.bg,
                  color: badge.color,
                  border: badge.border,
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 800,
                  fontSize: 13,
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {riderData.status === 'approved' ? 'check_circle' : riderData.status === 'rejected' ? 'cancel' : 'pending'}
                  </span>
                  {badge.label}
                </div>
              )}
            </div>

            {/* Rejection Alert Banner */}
            {riderData.status === 'rejected' && (
              <div style={{ marginTop: 24, background: 'rgba(255,68,68,0.12)', border: '1px solid var(--error)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--error)', marginBottom: 8 }}>
                  <span className="material-symbols-outlined">error</span>
                  <h4 style={{ margin: 0, fontFamily: 'var(--font-lexend)', fontWeight: 700 }}>Application Feedback</h4>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--foreground)', lineHeight: 1.5 }}>
                  {riderData.rejectionReason || 'Your application did not meet our verification guidelines.'}
                </p>
                <Link href="/rider/apply" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  background: 'var(--error)',
                  color: '#fff',
                  borderRadius: 8,
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none'
                }}>
                  Update & Re-submit Application
                </Link>
              </div>
            )}

            {/* Success Approved Banner */}
            {riderData.status === 'approved' && (
              <div style={{ marginTop: 24, background: 'rgba(195, 244, 0, 0.12)', border: '1px solid var(--lime-400)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--lime-400)', marginBottom: 8 }}>
                  <span className="material-symbols-outlined">verified</span>
                  <h4 style={{ margin: 0, fontFamily: 'var(--font-lexend)', fontWeight: 800 }}>Welcome to the Delivery Fleet!</h4>
                </div>
                <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--foreground)', lineHeight: 1.5 }}>
                  Your application has been verified. You can now access your rider portal to start accepting nearby deliveries and earn payouts.
                </p>
                <Link href="/rider" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: 'var(--lime-400)',
                  color: '#000',
                  borderRadius: 10,
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none'
                }}>
                  Go to Rider Dashboard →
                </Link>
              </div>
            )}

            {/* Timeline Progress Tracker */}
            <div style={{ marginTop: 32 }}>
              <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em', marginBottom: 16 }}>
                Application Process
              </h4>

              <div style={{ display: 'grid', gap: 16, background: 'var(--surface-container-low)', padding: 20, borderRadius: 16, border: '1px solid var(--outline)' }}>
                {/* Step 1 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--lime-400)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>Application Submitted</h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      Submitted on {riderData.applicationSubmittedAt ? new Date(riderData.applicationSubmittedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: ['under_review', 'approved', 'rejected'].includes(riderData.status) ? 'var(--lime-400)' : 'var(--surface-container-high)',
                    color: ['under_review', 'approved', 'rejected'].includes(riderData.status) ? '#000' : 'var(--on-surface-variant)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {['under_review', 'approved', 'rejected'].includes(riderData.status) ? 'check' : 'hourglass_empty'}
                    </span>
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>Document Audit & Background Verification</h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      Super Admin compliance check for Ghana Card & Vehicle details.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: riderData.status === 'approved' ? 'var(--lime-400)' : riderData.status === 'rejected' ? 'var(--error)' : 'var(--surface-container-high)',
                    color: ['approved', 'rejected'].includes(riderData.status) ? '#fff' : 'var(--on-surface-variant)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {riderData.status === 'approved' ? 'verified' : riderData.status === 'rejected' ? 'close' : 'task_alt'}
                    </span>
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-lexend)' }}>
                      {riderData.status === 'approved' ? 'Account Activated' : riderData.status === 'rejected' ? 'Decision Delivered' : 'Final Activation'}
                    </h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      {riderData.status === 'approved' ? `Approved on ${new Date(riderData.approvedAt || Date.now()).toLocaleDateString()}` : 'Receive your delivery kit & start accepting orders.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Summary Card */}
            <div style={{ marginTop: 32 }}>
              <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', letterSpacing: '0.05em', marginBottom: 16 }}>
                Submitted Application Summary
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 12, border: '1px solid var(--outline)' }}>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Vehicle Type</span>
                  <span style={{ fontWeight: 700, fontSize: 15, textTransform: 'capitalize' }}>{riderData.vehicleType}</span>
                  {riderData.vehicleRegistration && (
                    <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'block', marginTop: 2 }}>Plate: {riderData.vehicleRegistration}</span>
                  )}
                </div>

                <div style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 12, border: '1px solid var(--outline)' }}>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Ghana Card ID</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{riderData.nationalId || 'Provided'}</span>
                </div>

                <div style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 12, border: '1px solid var(--outline)' }}>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Mobile Money Payout</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{riderData.momoNetwork} ({riderData.momoNumber})</span>
                </div>

                <div style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 12, border: '1px solid var(--outline)' }}>
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 4 }}>Uploaded Documents</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{riderData.documents.length} document(s) uploaded</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/rider/apply" style={{
                padding: '12px 20px',
                borderRadius: 10,
                background: 'var(--surface-container-high)',
                border: '1px solid var(--outline)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-lexend)',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none'
              }}>
                Edit / Update Application
              </Link>

              <button
                onClick={fetchApplicationStatus}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid var(--outline)',
                  color: 'var(--on-surface-variant)',
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                Refresh Status
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
