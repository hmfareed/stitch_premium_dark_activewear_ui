'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface DocumentItem {
  type: 'id_card' | 'license' | 'vehicle_registration' | 'insurance' | 'passport_photo';
  url: string;
  verified: boolean;
  uploadedAt?: string;
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'car' | 'van' | 'walking';
  vehicleModel: string;
  vehicleRegistration: string;
  vehicleYear: string;
  preferredZones: string[];
  momoNumber: string;
  momoNetwork: 'MTN' | 'VODAFONE' | 'AIRTELTIGO';
  documents: DocumentItem[];
}

const GHANA_HUBS = [
  { region: 'Northern Region', zones: [
    { value: 'tamale_central', label: 'Tamale Central' },
    { value: 'tamale_north', label: 'Tamale North' },
    { value: 'tamale_south', label: 'Tamale South' },
    { value: 'sagnarigu', label: 'Sagnarigu' },
    { value: 'kalpohin', label: 'Kalpohin' },
    { value: 'lamashegu', label: 'Lamashegu' },
  ]},
  { region: 'Greater Accra', zones: [
    { value: 'accra_central', label: 'Accra Central' },
    { value: 'east_legon', label: 'East Legon & Spintex' },
    { value: 'osu_cantonments', label: 'Osu & Cantonments' },
    { value: 'tema_industrial', label: 'Tema Hub' },
    { value: 'madina_adenta', label: 'Madina & Adenta' },
  ]},
  { region: 'Ashanti Region', zones: [
    { value: 'kumasi_central', label: 'Kumasi Central Market' },
    { value: 'adum_knust', label: 'Adum & KNUST Campus' },
    { value: 'asokwa_suame', label: 'Asokwa & Suame' },
  ]},
  { region: 'Western & Central', zones: [
    { value: 'takoradi_harbour', label: 'Takoradi Harbour & Market Circle' },
    { value: 'cape_coast', label: 'Cape Coast Central' },
  ]}
];

export default function RiderApplication() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    nationalId: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    vehicleType: 'motorcycle',
    vehicleModel: '',
    vehicleRegistration: '',
    vehicleYear: '',
    preferredZones: ['tamale_central', 'accra_central'],
    momoNumber: user?.phone || '',
    momoNetwork: 'MTN',
    documents: [],
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        momoNumber: prev.momoNumber || user.phone || '',
      }));
    }
  }, [user]);

  // Fetch existing application if user already applied
  useEffect(() => {
    if (user) {
      fetch('/api/rider/apply')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.hasApplication && data.rider) {
            const r = data.rider;
            setFormData(prev => ({
              ...prev,
              fullName: r.fullName || prev.fullName,
              phone: r.phone || prev.phone,
              email: r.email || prev.email,
              nationalId: r.nationalId || prev.nationalId,
              emergencyContactName: r.emergencyContactName || prev.emergencyContactName,
              emergencyContactPhone: r.emergencyContactPhone || prev.emergencyContactPhone,
              vehicleType: r.vehicleType || prev.vehicleType,
              vehicleModel: r.vehicleModel || prev.vehicleModel,
              vehicleRegistration: r.vehicleRegistration || prev.vehicleRegistration,
              vehicleYear: r.vehicleYear ? String(r.vehicleYear) : prev.vehicleYear,
              preferredZones: r.preferredZones?.length ? r.preferredZones : prev.preferredZones,
              momoNumber: r.momoNumber || prev.momoNumber,
              momoNetwork: r.momoNetwork || prev.momoNetwork,
              documents: r.documents || [],
            }));
            
            if (r.status === 'approved' || r.status === 'pending' || r.status === 'under_review') {
              // Option to redirect to application status page
              showToast(`Application status: ${r.status.toUpperCase()}`, 'info');
            }
          }
        })
        .catch(err => console.error('Error fetching rider profile:', err));
    }
  }, [user, showToast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleZoneToggle = (zoneValue: string) => {
    setFormData(prev => ({
      ...prev,
      preferredZones: prev.preferredZones.includes(zoneValue)
        ? prev.preferredZones.filter(z => z !== zoneValue)
        : [...prev.preferredZones, zoneValue]
    }));
  };

  const handleFileUpload = async (type: DocumentItem['type'], file: File) => {
    setUploadingDoc(type);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, folder: 'africart/riders' }),
        });

        const uploadData = await res.json();
        if (res.ok && uploadData.url) {
          const newDoc: DocumentItem = {
            type,
            url: uploadData.url,
            verified: false,
            uploadedAt: new Date().toISOString(),
          };

          setFormData(prev => ({
            ...prev,
            documents: [
              ...prev.documents.filter(d => d.type !== type),
              newDoc,
            ]
          }));
          showToast(`Document uploaded successfully!`, 'success');
        } else {
          showToast(uploadData.error || 'Failed to upload document', 'error');
        }
        setUploadingDoc(null);
      };
    } catch (err) {
      console.error('File upload error:', err);
      showToast('Error uploading document. Please try again.', 'error');
      setUploadingDoc(null);
    }
  };

  const validateStep = (step: number) => {
    setFormError('');
    if (step === 1) {
      if (!formData.fullName.trim()) return 'Full Name is required';
      if (!formData.phone.trim()) return 'Phone number is required';
      if (!formData.email.trim()) return 'Email address is required';
      if (!formData.nationalId.trim()) return 'Ghana Card / National ID number is required (e.g. GHA-123456789-0)';
    } else if (step === 2) {
      if (['motorcycle', 'car', 'van'].includes(formData.vehicleType)) {
        if (!formData.vehicleRegistration.trim()) return 'Vehicle registration/plate number is required';
      }
      if (formData.preferredZones.length === 0) return 'Select at least one preferred delivery zone';
    } else if (step === 3) {
      const hasIdCard = formData.documents.some(d => d.type === 'id_card');
      if (!hasIdCard) return 'Please upload a photo of your Ghana Card ID';
    } else if (step === 4) {
      if (!formData.momoNumber.trim()) return 'Mobile Money number is required for payouts';
    }
    return '';
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setFormError(error);
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const error = validateStep(4);
    if (error) {
      setFormError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Rider application submitted successfully! 🚀', 'success');
        router.push('/rider/application-status');
      } else {
        setFormError(data.message || 'Failed to submit application');
        showToast(data.message || 'Submission failed', 'error');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid var(--outline)',
    background: 'var(--surface-container)',
    color: 'var(--foreground)',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-lexend)',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--on-surface-variant)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse-glow" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--lime-400)' }} />
      </div>
    );
  }

  const getDoc = (type: DocumentItem['type']) => formData.documents.find(d => d.type === type);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)', paddingBottom: 60 }}>
      {/* Top Header Navigation */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--outline)', padding: '18px 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--lime-400)' }}>two_wheeler</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
                Rider Partner Application
              </h1>
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                Complete your details to start delivering with AfriCart
              </p>
            </div>
          </div>
          <Link href="/rider/application-status" style={{ fontSize: '0.85rem', color: 'var(--lime-400)', textDecoration: 'none', fontWeight: 600 }}>
            Check Application Status →
          </Link>
        </div>
      </header>

      {/* Progress Steps Header */}
      <div style={{ background: 'var(--surface-container-low)', padding: '24px 20px', borderBottom: '1px solid var(--outline)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {[
            { step: 1, label: 'Personal Details', icon: 'person' },
            { step: 2, label: 'Vehicle & Zones', icon: 'two_wheeler' },
            { step: 3, label: 'Verification Docs', icon: 'badge' },
            { step: 4, label: 'Mobile Money Payout', icon: 'payments' },
          ].map(({ step, label, icon }) => (
            <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: currentStep === step ? 'var(--lime-400)' : currentStep > step ? 'rgba(195, 244, 0, 0.2)' : 'var(--surface-container-high)',
                border: currentStep === step ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentStep === step ? '#000' : currentStep > step ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                fontWeight: 700,
                transition: 'all 0.3s ease'
              }}>
                {currentStep > step ? (
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check</span>
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: currentStep >= step ? 600 : 400, color: currentStep >= step ? 'var(--lime-400)' : 'var(--on-surface-variant)', textAlign: 'center' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main style={{ maxWidth: 880, margin: '32px auto 0', padding: '0 20px' }}>
        <div className="glass animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--outline)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>

          {/* Form Error Banner */}
          {formError && (
            <div className="animate-fade-in" style={{ background: 'rgba(255,68,68,0.12)', border: '1px solid var(--error)', borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>error</span>
              <p style={{ margin: 0, color: 'var(--error)', fontSize: '0.875rem' }}>{formError}</p>
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0' }}>Personal & Identity Details</h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '0 0 28px 0' }}>Provide your legal identification details as required for delivery partners in Ghana.</p>

              <div style={{ display: 'grid', gap: 20 }}>
                <div>
                  <label style={labelStyle}>Full Legal Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. Kwame Mensah Appiah" style={inputStyle} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Ghana Phone Number *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0501234567" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="kwame@example.com" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Ghana Card / National ID Number (NIA) *</label>
                  <input type="text" name="nationalId" value={formData.nationalId} onChange={handleInputChange} placeholder="e.g. GHA-712345678-9" style={inputStyle} />
                </div>

                <div style={{ background: 'var(--surface-container-low)', padding: 18, borderRadius: 14, border: '1px solid var(--outline)', display: 'grid', gap: 16 }}>
                  <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--lime-400)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined">health_and_safety</span>
                    Emergency Contact Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Emergency Contact Name</label>
                      <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} placeholder="Next of Kin / Relative Name" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Emergency Contact Phone</label>
                      <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} placeholder="0240000000" style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Vehicle & Operating Zones */}
          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0' }}>Vehicle Specs & Delivery Hubs</h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '0 0 28px 0' }}>Select your primary delivery vehicle and the hub zones where you can fulfill orders.</p>

              <div style={{ display: 'grid', gap: 24 }}>
                {/* Vehicle Selection */}
                <div>
                  <label style={labelStyle}>Primary Vehicle Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 8 }}>
                    {[
                      { type: 'motorcycle', label: 'Motorbike', icon: 'two_wheeler' },
                      { type: 'bicycle', label: 'Bicycle', icon: 'pedal_bike' },
                      { type: 'car', label: 'Car', icon: 'directions_car' },
                      { type: 'van', label: 'Delivery Van', icon: 'airport_shuttle' },
                      { type: 'walking', label: 'Walker', icon: 'directions_walk' },
                    ].map(({ type, label, icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, vehicleType: type as any }))}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 8,
                          padding: '16px 12px',
                          borderRadius: 14,
                          border: formData.vehicleType === type ? '2px solid var(--lime-400)' : '1px solid var(--outline)',
                          background: formData.vehicleType === type ? 'rgba(195, 244, 0, 0.12)' : 'var(--surface-container)',
                          color: formData.vehicleType === type ? 'var(--lime-400)' : 'var(--foreground)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {['motorcycle', 'car', 'van'].includes(formData.vehicleType) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Vehicle Model & Brand</label>
                      <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} placeholder="e.g. Royal motorcycle / Honda Ace" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Registration Plate Number *</label>
                      <input type="text" name="vehicleRegistration" value={formData.vehicleRegistration} onChange={handleInputChange} placeholder="e.g. M-24-NR 4022 / M-21-GT 500" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Manufacturing Year</label>
                      <input type="number" name="vehicleYear" value={formData.vehicleYear} onChange={handleInputChange} placeholder="2021" style={inputStyle} />
                    </div>
                  </div>
                )}

                {/* Operating Hubs */}
                <div>
                  <label style={labelStyle}>Preferred Operating Hub Zones * (Select all that apply)</label>
                  <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
                    {GHANA_HUBS.map(group => (
                      <div key={group.region} style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 14, border: '1px solid var(--outline)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--lime-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group.region}</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                          {group.zones.map(z => {
                            const isSelected = formData.preferredZones.includes(z.value);
                            return (
                              <button
                                key={z.value}
                                type="button"
                                onClick={() => handleZoneToggle(z.value)}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: 20,
                                  border: '1px solid',
                                  borderColor: isSelected ? 'var(--lime-400)' : 'var(--outline)',
                                  background: isSelected ? 'rgba(195, 244, 0, 0.15)' : 'var(--surface-container)',
                                  color: isSelected ? 'var(--lime-400)' : 'var(--on-surface-variant)',
                                  fontSize: '0.85rem',
                                  fontWeight: isSelected ? 600 : 400,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6
                                }}
                              >
                                {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                                {z.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Verification Documents */}
          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0' }}>Verification Document Upload</h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '0 0 28px 0' }}>Upload clear photos of your required identification documents for background compliance checks.</p>

              <div style={{ display: 'grid', gap: 20 }}>

                {/* Ghana Card Photo */}
                <div style={{ background: 'var(--surface-container-low)', padding: 20, borderRadius: 16, border: '1px solid var(--outline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>badge</span>
                        Ghana Card Photo Front *
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                        Clear photo showing full NIA card details and photograph.
                      </p>
                    </div>
                    {getDoc('id_card') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>check_circle</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--lime-400)', fontWeight: 600 }}>Uploaded</span>
                        <a href={getDoc('id_card')?.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textDecoration: 'underline' }}>View</a>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-id-card"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('id_card', e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="upload-id-card" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: uploadingDoc === 'id_card' ? 'var(--outline)' : 'var(--surface-container-high)',
                      border: '1px solid var(--outline)',
                      color: 'var(--foreground)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: uploadingDoc === 'id_card' ? 'wait' : 'pointer'
                    }}>
                      <span className="material-symbols-outlined">upload_file</span>
                      {uploadingDoc === 'id_card' ? 'Uploading...' : getDoc('id_card') ? 'Re-upload Ghana Card' : 'Choose Ghana Card Image'}
                    </label>
                  </div>
                </div>

                {/* Driver's License */}
                {['car', 'van'].includes(formData.vehicleType) && (
                  <div style={{ background: 'var(--surface-container-low)', padding: 20, borderRadius: 16, border: '1px solid var(--outline)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>subtitles</span>
                          Driver's License Photo
                        </h4>
                        <p style={{ fontSize: '0.825rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          Valid DVLA Driver's License matching vehicle category.
                        </p>
                      </div>
                      {getDoc('license') ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>check_circle</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--lime-400)', fontWeight: 600 }}>Uploaded</span>
                          <a href={getDoc('license')?.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textDecoration: 'underline' }}>View</a>
                        </div>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="upload-license"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload('license', e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="upload-license" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 18px',
                        borderRadius: 10,
                        background: uploadingDoc === 'license' ? 'var(--outline)' : 'var(--surface-container-high)',
                        border: '1px solid var(--outline)',
                        color: 'var(--foreground)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: uploadingDoc === 'license' ? 'wait' : 'pointer'
                      }}>
                        <span className="material-symbols-outlined">upload_file</span>
                        {uploadingDoc === 'license' ? 'Uploading...' : getDoc('license') ? 'Re-upload License' : 'Choose License Photo'}
                      </label>
                    </div>
                  </div>
                )}

                {/* Passport Selfie Photo */}
                <div style={{ background: 'var(--surface-container-low)', padding: 20, borderRadius: 16, border: '1px solid var(--outline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h4 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>account_box</span>
                        Headshot / Passport Photograph
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                        Clear face portrait for your rider profile badge.
                      </p>
                    </div>
                    {getDoc('passport_photo') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>check_circle</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--lime-400)', fontWeight: 600 }}>Uploaded</span>
                        <a href={getDoc('passport_photo')?.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', textDecoration: 'underline' }}>View</a>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="upload-passport"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('passport_photo', e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="upload-passport" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: uploadingDoc === 'passport_photo' ? 'var(--outline)' : 'var(--surface-container-high)',
                      border: '1px solid var(--outline)',
                      color: 'var(--foreground)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: uploadingDoc === 'passport_photo' ? 'wait' : 'pointer'
                    }}>
                      <span className="material-symbols-outlined">upload_file</span>
                      {uploadingDoc === 'passport_photo' ? 'Uploading...' : getDoc('passport_photo') ? 'Re-upload Passport Photo' : 'Choose Passport Photo'}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Details */}
          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h2 style={{ fontFamily: 'var(--font-lexend)', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0' }}>Mobile Money Payout Info</h2>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', margin: '0 0 28px 0' }}>Deliveries earnings and tips are paid out directly to your registered Ghana Mobile Money account.</p>

              <div style={{ display: 'grid', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Mobile Money Provider *</label>
                    <select
                      name="momoNetwork"
                      value={formData.momoNetwork}
                      onChange={handleInputChange}
                      style={inputStyle}
                    >
                      <option value="MTN">MTN Mobile Money (MoMo)</option>
                      <option value="VODAFONE">Telecel Cash / Vodafone Cash</option>
                      <option value="AIRTELTIGO">AirtelTigo Money (AT Money)</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Mobile Money Phone Number *</label>
                    <input
                      type="tel"
                      name="momoNumber"
                      value={formData.momoNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 0551234567"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{
                  background: 'rgba(195, 244, 0, 0.08)',
                  border: '1px solid rgba(195, 244, 0, 0.25)',
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--lime-400)' }}>verified_user</span>
                    <h4 style={{ margin: 0, fontFamily: 'var(--font-lexend)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--lime-400)' }}>
                      What happens after submission?
                    </h4>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    <li>Our Super Admin team verifies your Ghana Card & vehicle documents within 24 hours.</li>
                    <li>You will receive an SMS and email notification upon approval.</li>
                    <li>Once approved, log into the Rider Dashboard to accept orders and earn instant payouts.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: 14, marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--outline)' }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => { setFormError(''); setCurrentStep(prev => prev - 1); }}
                style={{
                  padding: '14px 24px',
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline)',
                  borderRadius: 12,
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-lexend)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '16px 24px',
                background: isSubmitting ? 'var(--outline)' : 'var(--lime-400)',
                border: 'none',
                borderRadius: 12,
                color: isSubmitting ? 'var(--on-surface-variant)' : '#000',
                fontFamily: 'var(--font-lexend)',
                fontWeight: 800,
                fontSize: '0.95rem',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(195, 244, 0, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                  Submitting Rider Application...
                </>
              ) : currentStep === 4 ? (
                'Submit Application For Approval'
              ) : (
                'Save & Continue →'
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
