'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, useToast } from '@/context/AppContext';

export default function TwoFactorSetupPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string; backupCodes: string[] } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa');
      const data = await res.json();
      if (res.ok) {
        setEnabled(data.twoFactorEnabled);
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start 2FA setup');

      setSetupData({
        secret: data.secret,
        qrCodeUrl: data.qrCodeUrl,
        backupCodes: data.backupCodes || [],
      });
      setBackupCodes(data.backupCodes || []);
    } catch (err: any) {
      showToast(err.message || '2FA setup error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (!verifyCode || verifyCode.trim().length !== 6) {
      showToast('Enter 6-digit code from authenticator app', 'error');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setEnabled(true);
      setSetupData(null);
      setVerifyCode('');
      showToast('Two-Factor Authentication enabled successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Verification code failed', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable Two-Factor Authentication?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');

      setEnabled(false);
      setSetupData(null);
      showToast('Two-Factor Authentication has been disabled.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to disable 2FA', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    showToast('Backup codes copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#ffffff', fontFamily: 'var(--font-inter, sans-serif)', padding: '24px 16px' }}>
      
      {/* Header Bar */}
      <div style={{ maxWidth: 640, margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/account/settings" style={{ color: '#c3f400', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          <span>Account Settings</span>
        </Link>
        <div style={{ fontSize: 12, color: '#888' }}>Security Center</div>
      </div>

      {/* Main Container */}
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        backgroundColor: '#0d0f0b',
        border: '1px solid rgba(195, 244, 0, 0.22)',
        borderRadius: 24,
        padding: 32,
        boxSizing: 'border-box',
      }}>
        {/* Title Block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(195, 244, 0, 0.15)', color: '#c3f400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>verified_user</span>
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-lexend, sans-serif)', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>
              Two-Factor Authentication (2FA)
            </h1>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2, margin: 0 }}>
              Protect your AfriCart account with TOTP authenticator code verification.
            </p>
          </div>
        </div>

        {/* Current Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 16,
          backgroundColor: enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: enabled ? '1px solid #10b981' : '1px solid #ef4444',
          marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: enabled ? '#34d399' : '#f87171' }}>
              {enabled ? 'shield_lock' : 'security_update_warning'}
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff' }}>
                Status: {enabled ? 'ENABLED' : 'DISABLED'}
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                {enabled ? 'Your account is fortified with 2FA TOTP verification.' : '2FA is currently not active.'}
              </div>
            </div>
          </div>

          {enabled && (
            <button
              onClick={handleDisable2FA}
              disabled={loading}
              style={{ padding: '8px 14px', borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
            >
              Disable 2FA
            </button>
          )}
        </div>

        {/* Setup Workflow */}
        {!enabled && !setupData && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 13, color: '#ccc', marginBottom: 20 }}>
              Use authenticator apps such as <strong>Google Authenticator</strong>, <strong>Authy</strong>, or 1Password to generate 6-digit TOTP verification codes.
            </p>
            <button
              onClick={handleStartSetup}
              disabled={loading}
              style={{
                padding: '14px 28px',
                backgroundColor: '#c3f400',
                color: '#000000',
                border: 'none',
                borderRadius: 14,
                fontFamily: 'var(--font-lexend, sans-serif)',
                fontWeight: 900,
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {loading ? 'GENERATING QR CODE...' : 'SETUP 2FA AUTHENTICATOR'}
            </button>
          </div>
        )}

        {/* QR Code Scan Step */}
        {!enabled && setupData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c3f400', marginBottom: 12 }}>
                Step 1: Scan QR Code with Authenticator App
              </div>
              <div style={{ width: 180, height: 180, backgroundColor: '#ffffff', padding: 10, borderRadius: 12, margin: '0 auto 14px', position: 'relative' }}>
                <Image src={setupData.qrCodeUrl} alt="2FA QR Code" fill style={{ objectFit: 'contain', padding: 10 }} unoptimized />
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Manual Secret Key Entry:</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: 2, backgroundColor: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8, display: 'inline-block' }}>
                {setupData.secret}
              </div>
            </div>

            {/* Verify Code Input Step */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#c3f400', marginBottom: 12 }}>
                Step 2: Enter 6-Digit Authenticator Code
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value)}
                  maxLength={6}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 16,
                    textAlign: 'center',
                    letterSpacing: 4,
                    padding: 10,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleVerifySetup}
                  disabled={verifying}
                  style={{ padding: '0 20px', backgroundColor: '#c3f400', color: '#000', border: 'none', borderRadius: 10, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}
                >
                  {verifying ? 'VERIFYING...' : 'ENABLE 2FA'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#666' }}>Demo setup code: <code>123456</code></div>
            </div>

            {/* Emergency Recovery Backup Codes */}
            {backupCodes.length > 0 && (
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>Emergency Recovery Backup Codes</div>
                  <button onClick={copyBackupCodes} style={{ background: 'none', border: '1px solid #c3f400', color: '#c3f400', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                    {copied ? 'Copied!' : 'Copy All'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {backupCodes.map((code, idx) => (
                    <div key={idx} style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#a3e635', backgroundColor: 'rgba(0,0,0,0.4)', padding: '6px 10px', borderRadius: 6, textAlign: 'center' }}>
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
