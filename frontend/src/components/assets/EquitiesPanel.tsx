import { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import {
  GicsSector,
  YFinanceSearchResult,
  YFinanceSearchParams,
  SECTOR_CONFIG,
  SORT_OPTIONS,
} from '@/types/assets';

export default function EquitiesPanel() {
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<YFinanceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 筛选状态
  const [selectedSector, setSelectedSector] = useState<GicsSector | ''>('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);

  // 排序状态
  const [sortBy, setSortBy] = useState<YFinanceSearchParams['sortBy']>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 加载 Industries（根据 Sector 筛选）
  useEffect(() => {
    // 这里后续可以从后端加载 industries
    // 暂时根据 sector 返回一些常见 industry
    if (selectedSector) {
      const sectorIndustries = getIndustriesBySector(selectedSector);
      setIndustries(sectorIndustries);
      setSelectedIndustry(''); // 清空已选 industry
    } else {
      setIndustries([]);
      setSelectedIndustry('');
    }
  }, [selectedSector]);

  // 搜索函数
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await axios.get('/api/v1/assets/search/yfinance', {
        params: {
          q: searchQuery,
          sector: selectedSector || undefined,
          industry: selectedIndustry || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          limit: 50,
        },
      });
      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      // 如果后端还没实现，先用模拟数据
      setResults(getMockResults());
    } finally {
      setLoading(false);
    }
  };

  // 格式化市值
  const formatMarketCap = (value?: number) => {
    if (!value) return '-';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  // 获取 sector 颜色
  const getSectorConfig = (sector?: string) => {
    return SECTOR_CONFIG.find((s) => s.key === sector) || {
      label: sector || 'Unknown',
      labelZh: sector || '未知',
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
    };
  };

  return (
    <div>
      {/* 搜索和筛选栏 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px',
          background: 'var(--bg-secondary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* 搜索框 */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <Search size={20} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="搜索股票代码或名称 (如: AAPL, Apple)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '15px',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--primary-color)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            搜索
          </button>
        </div>

        {/* 筛选器 */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Sector 筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as GicsSector | '')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="">所有板块</option>
              {SECTOR_CONFIG.map((sector) => (
                <option key={sector.key} value={sector.key}>
                  {sector.labelZh}
                </option>
              ))}
            </select>
          </div>

          {/* Industry 筛选 */}
          {selectedSector && (
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <option value="">所有行业</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          )}

          {/* 排序 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <ArrowUpDown size={16} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as YFinanceSearchParams['sortBy'])}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.labelZh}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* 搜索结果 */}
      {hasSearched && (
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} style={{ marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
              <p>搜索中...</p>
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>未找到匹配的股票</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)' }}>
                    <th style={thStyle}>股票</th>
                    <th style={thStyle}>板块</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>市值</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>市盈率 (PE)</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>价格</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((stock, index) => {
                    const sectorConfig = getSectorConfig(stock.sector);
                    return (
                      <tr
                        key={stock.symbol}
                        style={{
                          borderBottom:
                            index < results.length - 1 ? '1px solid var(--border-color)' : 'none',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: sectorConfig.bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: sectorConfig.color,
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {stock.symbol.slice(0, 2)}
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
                                {stock.symbol}
                              </p>
                              <p
                                style={{
                                  fontSize: '13px',
                                  color: 'var(--text-muted)',
                                  margin: 0,
                                }}
                              >
                                {stock.name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              background: sectorConfig.bg,
                              color: sectorConfig.color,
                            }}
                          >
                            {sectorConfig.labelZh}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span
                            style={{ fontSize: '14px', color: 'var(--text-primary)' }}
                          >
                            {formatMarketCap(stock.marketCap)}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                            {stock.trailingPE?.toFixed(2) || '-'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                            ${stock.price?.toFixed(2) || '-'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'var(--primary-color)',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            <Plus size={14} />
                            添加
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 样式常量
const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
};

// 根据 sector 获取 industries（临时实现）
function getIndustriesBySector(sector: GicsSector): string[] {
  const map: Record<GicsSector, string[]> = {
    'Technology': ['Software', 'Semiconductors', 'IT Services', 'Hardware', 'Electronic Components'],
    'Financials': ['Banks', 'Insurance', 'Asset Management', 'Investment Banking', 'Consumer Finance'],
    'Health Care': ['Pharmaceuticals', 'Biotechnology', 'Medical Devices', 'Health Care Providers'],
    'Consumer Discretionary': ['Internet Retail', 'Auto Manufacturers', 'Hotels & Resorts', 'Apparel Retail'],
    'Communication Services': ['Interactive Media', 'Entertainment', 'Telecom', 'Publishing'],
    'Industrials': ['Aerospace & Defense', 'Machinery', 'Airlines', 'Railroads', 'Construction'],
    'Consumer Staples': ['Beverages', 'Food Products', 'Household Products', 'Personal Products'],
    'Energy': ['Oil & Gas Integrated', 'Oil & Gas E&P', 'Oil & Gas Equipment', 'Renewables'],
    'Utilities': ['Electric Utilities', 'Gas Utilities', 'Water Utilities', 'Multi-Utilities'],
    'Real Estate': ['REITs', 'Real Estate Services', 'Real Estate Development'],
    'Materials': ['Chemicals', 'Metals & Mining', 'Paper & Forest', 'Construction Materials'],
  };
  return map[sector] || [];
}

// 模拟数据（后端实现前使用）
function getMockResults(): YFinanceSearchResult[] {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', industry: 'Hardware', marketCap: 3500000000000, trailingPE: 32.5, price: 189.52 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software', marketCap: 3200000000000, trailingPE: 36.2, price: 430.12 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors', marketCap: 2800000000000, trailingPE: 72.8, price: 890.15 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services', industry: 'Interactive Media', marketCap: 2100000000000, trailingPE: 25.3, price: 168.42 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', industry: 'Internet Retail', marketCap: 1900000000000, trailingPE: 58.6, price: 178.25 },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services', industry: 'Interactive Media', marketCap: 1400000000000, trailingPE: 28.4, price: 512.35 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', industry: 'Banks', marketCap: 580000000000, trailingPE: 12.1, price: 195.42 },
    { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Health Care', industry: 'Pharmaceuticals', marketCap: 720000000000, trailingPE: 128.5, price: 765.18 },
  ];
}
