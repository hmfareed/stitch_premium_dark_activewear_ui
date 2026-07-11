'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useStore, useCart, useToast } from '@/context/AppContext';
import Link from 'next/link';

interface CommunityPost {
  _id: string;
  authorEmail: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  taggedProducts: string[];
  images: string[];
  likes: string[];
  comments: Array<{ authorEmail: string; authorName: string; text: string; createdAt: string }>;
  isVerifiedSeller?: boolean;
  createdAt: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

// Sample posts for demonstration when DB is empty
const MOCK_POSTS: CommunityPost[] = [
  {
    _id: 'p1',
    authorEmail: 'kofi@email.com',
    authorName: 'Kofi Mensah',
    content: 'Just received my order from GymShark Pro and I\'m blown away by the quality! 💪 The compression fit is perfect for workouts. Highly recommend the AeroFlex line for anyone training hard this season.',
    taggedProducts: ['prod-1', 'prod-2'],
    images: [],
    likes: ['user1@email.com', 'user2@email.com', 'user3@email.com'],
    comments: [
      { authorEmail: 'ama@email.com', authorName: 'Ama Asante', text: 'Same experience here! The stitching quality is unmatched.', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
      { authorEmail: 'kwame@email.com', authorName: 'Kwame Boateng', text: 'Which size did you get? I\'m between M and L', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
    ],
    isVerifiedSeller: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    _id: 'p2',
    authorEmail: 'nike@email.com',
    authorName: 'Nike Official GH',
    content: '🔥 NEW ARRIVAL ALERT! Our latest AeroFlex Tee is now live on AfriCart. Engineered for Ghana\'s climate — moisture-wicking, UV-resistant, and built for peak performance. Tag a gym partner who needs this! 🏋️',
    taggedProducts: ['prod-3'],
    images: [],
    likes: ['user1@email.com', 'user4@email.com'],
    comments: [
      { authorEmail: 'yaw@email.com', authorName: 'Yaw Darko', text: 'Just added to cart! The UV resistance is perfect for outdoor training in Kumasi.', createdAt: new Date(Date.now() - 1 * 3600000).toISOString() },
    ],
    isVerifiedSeller: true,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    _id: 'p3',
    authorEmail: 'ama@email.com',
    authorName: 'Ama Asante',
    content: 'AfriCart just helped me set up my home gym on a budget! Got everything delivered same day in Accra. The customer support was excellent when I had a question about sizing. 10/10 would recommend to anyone shopping for fitness gear in Ghana 🇬🇭',
    taggedProducts: [],
    images: [],
    likes: ['user2@email.com', 'user3@email.com', 'user5@email.com', 'user6@email.com'],
    comments: [],
    isVerifiedSeller: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export default function CommunityPage() {
  const { user } = useAuth();
  const { allProducts } = useStore();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [taggedProductIds, setTaggedProductIds] = useState<string[]>([]);
  const [postLoading, setPostLoading] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [likingPost, setLikingPost] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/community?limit=20');
      const data = await res.json();
      if (data.success && data.posts?.length > 0) {
        setPosts(data.posts);
      } else {
        setPosts(MOCK_POSTS);
      }
    } catch {
      setPosts(MOCK_POSTS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleLike = async (postId: string) => {
    if (!user) { showToast('Please log in to like posts', 'info'); return; }
    if (likingPost[postId]) return;
    setLikingPost(prev => ({ ...prev, [postId]: true }));

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p._id !== postId) return p;
      const liked = p.likes.includes(user.email);
      return { ...p, likes: liked ? p.likes.filter(e => e !== user.email) : [...p.likes, user.email] };
    }));

    try {
      await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action: 'like', userEmail: user.email }),
      });
    } catch {
      fetchPosts(); // revert on error
    }
    setLikingPost(prev => ({ ...prev, [postId]: false }));
  };

  const handleComment = async (postId: string) => {
    if (!user) { showToast('Please log in to comment', 'info'); return; }
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch('/api/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, action: 'comment', userEmail: user.email, userName: user.name, text }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, comments: [...p.comments, { authorEmail: user.email, authorName: user.name, text, createdAt: new Date().toISOString() }] } : p));
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch {
      showToast('Failed to post comment', 'error');
    }
    setCommentLoading(prev => ({ ...prev, [postId]: false }));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { showToast('Please log in to post', 'info'); return; }
    if (!postContent.trim()) return;
    setPostLoading(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: user.email,
          authorName: user.name,
          content: postContent,
          taggedProducts: taggedProductIds,
          isVerifiedSeller: user.isVerified && user.role === 'vendor',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => [{ ...data.post, likes: [], comments: [], taggedProducts: taggedProductIds, images: [] }, ...prev]);
        setPostContent('');
        setTaggedProductIds([]);
        setTagSearch('');
        setShowCreatePost(false);
        showToast('Post shared with the community!');
      }
    } catch {
      showToast('Failed to create post', 'error');
    }
    setPostLoading(false);
  };

  const taggedProductsSearch = allProducts.filter(p =>
    tagSearch && (p.name.toLowerCase().includes(tagSearch.toLowerCase()) || p.category.toLowerCase().includes(tagSearch.toLowerCase()))
  ).slice(0, 5);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', paddingBottom: 8 }}>
        <h1 className="font-lexend" style={{ fontSize: '2rem', marginBottom: 8, background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AfriCart Community
        </h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem' }}>
          Share your finds, tag products, and connect with fellow shoppers across Ghana.
        </p>
      </div>

      {/* Create Post Button / Form */}
      {!showCreatePost ? (
        <button
          onClick={() => { if (!user) { showToast('Please log in to post', 'info'); return; } setShowCreatePost(true); }}
          style={{
            width: '100%', padding: '16px 20px', borderRadius: 16, border: '2px dashed var(--outline)',
            background: 'var(--surface)', color: 'var(--on-surface-variant)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.95rem', fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lime-400)' }}>
            <span className="material-symbols-outlined">edit</span>
          </div>
          <span>Share something with the community…</span>
        </button>
      ) : (
        <form onSubmit={handleCreatePost} style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
              {user?.name?.substring(0, 1) || '?'}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{user?.name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)', margin: 0 }}>Posting to AfriCart Community</p>
            </div>
          </div>

          <textarea
            placeholder="What's on your mind? Share a find, review, or tip…"
            value={postContent}
            onChange={e => setPostContent(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--outline)',
              background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '1rem',
              resize: 'vertical', fontFamily: 'var(--font-inter)', outline: 'none', boxSizing: 'border-box'
            }}
          />

          {/* Product Tagging */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--on-surface-variant)', marginBottom: 8, display: 'block' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 4 }}>local_offer</span>
              Tag Products (Optional)
            </label>
            <input
              type="text"
              placeholder="Search products to tag…"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.9rem', boxSizing: 'border-box' }}
            />
            {taggedProductsSearch.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {taggedProductsSearch.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!taggedProductIds.includes(p.id)) {
                        setTaggedProductIds(prev => [...prev, p.id]);
                        showToast(`Tagged: ${p.name}`);
                      }
                      setTagSearch('');
                    }}
                    style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-container-high)', cursor: 'pointer' }}
                  >
                    <img src={p.image} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', margin: 0 }}>GH₵{p.price.toFixed(2)}</p>
                    </div>
                    {taggedProductIds.includes(p.id) && <span className="material-symbols-outlined" style={{ marginLeft: 'auto', color: 'var(--lime-400)', fontSize: 18 }}>check_circle</span>}
                  </div>
                ))}
              </div>
            )}
            {taggedProductIds.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {taggedProductIds.map(id => {
                  const p = allProducts.find(x => x.id === id);
                  return p ? (
                    <span key={id} style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--lime-400) 15%, transparent)', color: 'var(--lime-400)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.name}
                      <button type="button" onClick={() => setTaggedProductIds(prev => prev.filter(x => x !== id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lime-400)', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => { setShowCreatePost(false); setPostContent(''); setTaggedProductIds([]); setTagSearch(''); }} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--outline)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={postLoading || !postContent.trim()} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: postLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: postLoading ? 0.7 : 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span>
              {postLoading ? 'Posting…' : 'Share Post'}
            </button>
          </div>
        </form>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
          <p style={{ marginTop: 12 }}>Loading community posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--on-surface-variant)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 60 }}>forum</span>
          <p style={{ marginTop: 12, fontSize: '1rem' }}>Be the first to post in the community!</p>
        </div>
      ) : (
        posts.map(post => {
          const liked = user ? post.likes.includes(user.email) : false;
          const showComments = expandedComments[post._id];
          const taggedProducts = allProducts.filter(p => post.taggedProducts?.includes(p.id));

          return (
            <article key={post._id} style={{ backgroundColor: 'var(--surface)', borderRadius: 20, border: '1px solid var(--outline)', overflow: 'hidden' }}>
              {/* Post Header */}
              <div style={{ padding: '20px 20px 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: post.isVerifiedSeller ? 'linear-gradient(135deg, #00e5ff, var(--lime-400))' : 'color-mix(in srgb, var(--lime-400) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: post.isVerifiedSeller ? '#000' : 'var(--lime-400)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  {post.authorName?.substring(0, 1) || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{post.authorName}</span>
                    {post.isVerifiedSeller && (
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: 'linear-gradient(135deg, #00e5ff, var(--lime-400))', color: '#000', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>verified</span>
                        Verified Seller
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{timeAgo(post.createdAt)}</span>
                </div>
              </div>

              {/* Post Content */}
              <div style={{ padding: '14px 20px' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{post.content}</p>
              </div>

              {/* Tagged Product Cards */}
              {taggedProducts.length > 0 && (
                <div style={{ padding: '0 20px 16px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {taggedProducts.map(p => (
                    <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--outline)', backgroundColor: 'var(--surface-container)', flex: '1 1 200px', maxWidth: '100%' }}>
                      <img src={p.image} alt={p.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.85rem', margin: '0 0 2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--lime-400)', fontWeight: 800, margin: 0 }}>GH₵{p.price.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => { addToCart(p); showToast(`${p.name} added to cart!`); }}
                        style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', flexShrink: 0 }}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Row */}
              <div style={{ padding: '0 20px 16px', display: 'flex', gap: 20, alignItems: 'center', borderTop: '1px solid var(--outline)', paddingTop: 14 }}>
                <button
                  onClick={() => handleLike(post._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: liked ? 'var(--error)' : 'var(--on-surface-variant)', fontWeight: liked ? 700 : 500, fontSize: '0.9rem', transition: 'all 0.2s', padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                  {post.likes.length}
                </button>
                <button
                  onClick={() => setExpandedComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', fontSize: '0.9rem', padding: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat_bubble_outline</span>
                  {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                </button>
              </div>

              {/* Comments */}
              {showComments && (
                <div style={{ borderTop: '1px solid var(--outline)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {post.comments.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'color-mix(in srgb, #00e5ff 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e5ff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                        {c.authorName?.substring(0, 1) || '?'}
                      </div>
                      <div style={{ flex: 1, backgroundColor: 'var(--surface-container)', borderRadius: 12, padding: '10px 14px' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 4px 0' }}>{c.authorName}</p>
                        <p style={{ fontSize: '0.88rem', margin: 0 }}>{c.text}</p>
                      </div>
                    </div>
                  ))}
                  {user && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--lime-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                        {user.name?.substring(0, 1) || '?'}
                      </div>
                      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="Write a comment…"
                          value={commentInputs[post._id] || ''}
                          onChange={e => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(post._id); } }}
                          style={{ flex: 1, padding: '8px 14px', borderRadius: 20, border: '1px solid var(--outline)', background: 'var(--surface-container)', color: 'var(--foreground)', fontSize: '0.88rem', outline: 'none' }}
                        />
                        <button
                          onClick={() => handleComment(post._id)}
                          disabled={commentLoading[post._id] || !commentInputs[post._id]?.trim()}
                          style={{ padding: '8px 14px', borderRadius: 20, border: 'none', background: 'var(--lime-400)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', opacity: commentLoading[post._id] ? 0.6 : 1 }}
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                  {!user && (
                    <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '10px', color: 'var(--lime-400)', fontSize: '0.88rem', fontWeight: 600 }}>
                      Log in to join the conversation →
                    </Link>
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
