import { useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Watchlist() {
  const hasWatchlist = false;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
          }}
        >
          关注列表
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          管理你关注的标的
        </p>
      </div>

      {/* Watchlist Content */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '60px',
        }}
      >
        {!hasWatchlist ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Star size={32} color="var(--text-muted)" />
            </div>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              暂无关注标的
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              添加你感兴趣的标的到关注列表
            </p>
            <Link
              to="/assets"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              }}
            >
              <Plus size={18} />
              去添加标的
            </Link>
          </div>
        ) : (
          <div>关注列表内容</div>
        )}
      </div>
    </div>
  );
}
