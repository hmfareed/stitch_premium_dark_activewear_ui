'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
  icon: string;
  badge: string;
}

const SUGGESTED_ITEMS = [
  { label: 'Pending Vendor Approvals', icon: 'how_to_reg', link: '/admin/vendors' },
  { label: 'Recent Customer Orders', icon: 'shopping_bag', link: '/admin/orders' },
  { label: 'Low Stock Inventory Alerts', icon: 'warning', link: '/admin/inventory' },
  { label: 'Vendor Payout Requests', icon: 'account_balance', link: '/admin/payouts' },
  { label: 'Active Subscriptions', icon: 'card_membership', link: '/admin/subscriptions' },
  { label: 'Open Support Tickets', icon: 'support_agent', link: '/admin/tickets' },
];

export default function AdminHeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query fetch
  const fetchSearchResults = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/header-search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Header search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchResults(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, fetchSearchResults]);

  const handleSelectResult = (link: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const list = query.trim().length >= 2 ? results : SUGGESTED_ITEMS;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < list.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < list.length) {
        const target = list[selectedIndex];
        handleSelectResult('link' in target ? target.link : (target as SearchResult).link);
      } else if (query.trim()) {
        handleSelectResult(`/admin/orders?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden md:flex">
      {/* Input Box */}
      <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, fontSize: 18, color: '#94a3b8', pointerEvents: 'none' }}>
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search anything..."
        style={{
          padding: '7px 32px 7px 34px',
          backgroundColor: '#f1f5f9',
          border: isOpen ? '1px solid #16a34a' : '1px solid #e2e8f0',
          borderRadius: 20,
          fontSize: 13,
          color: '#1e293b',
          outline: 'none',
          width: 240,
          boxShadow: isOpen ? '0 0 0 3px rgba(22, 163, 74, 0.12)' : 'none',
          transition: 'all 0.15s ease',
        }}
      />
      <span style={{ position: 'absolute', right: 10, fontSize: 10, color: '#94a3b8', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4, fontWeight: 700, pointerEvents: 'none' }}>
        ⌘K
      </span>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '110%',
          left: 0,
          width: 360,
          maxHeight: 420,
          backgroundColor: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15), 0 2px 6px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          overflowY: 'auto',
          zIndex: 100,
          padding: '8px 0',
        }}>
          {loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 16, border: '2px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>Searching real system data...</span>
            </div>
          )}

          {/* Suggested Predictions when empty */}
          {!loading && query.trim().length < 2 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Suggested & Predictive Searches
              </div>
              {SUGGESTED_ITEMS.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={item.label}
                    onClick={() => handleSelectResult(item.link)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                      color: isSelected ? '#15803d' : '#334155',
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      transition: 'background-color 0.1s ease',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: isSelected ? '#16a34a' : '#64748b' }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Results matching query */}
          {!loading && query.trim().length >= 2 && (
            <div>
              {results.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  No exact matches found for &quot;{query}&quot;. Press Enter to view all.
                </div>
              ) : (
                <div>
                  <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Matching System Results ({results.length})
                  </div>
                  {results.map((res, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={res.id}
                        onClick={() => handleSelectResult(res.link)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                          borderBottom: '1px solid #f8fafc',
                          transition: 'background-color 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: isSelected ? '#16a34a' : '#64748b', flexShrink: 0 }}>
                            {res.icon}
                          </span>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {res.title}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {res.subtitle}
                            </div>
                          </div>
                        </div>

                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 10,
                          backgroundColor: res.type === 'order' ? '#ffedd5' : res.type === 'product' ? '#e0e7ff' : res.type === 'store' ? '#dcfce7' : '#f3e8ff',
                          color: res.type === 'order' ? '#c2410c' : res.type === 'product' ? '#4338ca' : res.type === 'store' ? '#15803d' : '#7e22ce',
                          flexShrink: 0,
                        }}>
                          {res.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
