import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Activity, Database, Star } from 'lucide-react';
import axios from 'axios';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string;
  currency: string;
  is_active: boolean;
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  crypto: {
    label: '加密货币',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.1)',
    icon: TrendingUp,
  },
  stock: {
    label: '股票',
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.1)',
    icon: Activity,
  },
  etf: {
    label: 'ETF',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    icon: Database,
  },
  commodity: {
    label: '大宗商品',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    icon: Star,
  },
  fund: {
    label: '基金',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
    icon: Database,
  },
};

export default function Assets() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/v1/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          标的列表
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
          管理所有跟踪的标的资产
        </p>
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            flex: 1,
            maxWidth: '400px',
          }}
        >
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="搜索标的代码或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Assets Table */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
            加载中...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
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
              <Search size={32} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              {searchQuery ? '未找到匹配的标的' : '暂无标的'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    标的
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    类型
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    交易所
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    货币
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'center',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    状态
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset, index) => {
                  const config = typeConfig[asset.asset_type] || {
                    label: asset.asset_type,
                    color: '#6366f1',
                    bg: 'rgba(99, 102, 241, 0.1)',
                    icon: Database,
                  };
                  const Icon = config.icon;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      style={{
                        borderBottom:
                          index < filteredAssets.length - 1
                            ? '1px solid var(--border-color)'
                            : 'none',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: config.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: config.color,
                            }}
                          >
                            <Icon size={20} />
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: '0 0 2px 0',
                              }}
                            >
                              {asset.symbol}
                            </p>
                            <p
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                margin: 0,
                              }}
                            >
                              {asset.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: config.bg,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {asset.exchange || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span
                          style={{
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {asset.currency}
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            background: asset.is_active
                              ? 'rgba(34, 197, 94, 0.1)'
                              : 'var(--bg-tertiary)',
                            color: asset.is_active ? '#22c55e' : 'var(--text-muted)',
                          }}
                        >
                          {asset.is_active ? '活跃' : '暂停'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
