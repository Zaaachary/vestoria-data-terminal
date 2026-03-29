import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { ArrowLeft, Activity, AlertCircle, TrendingUp, Gauge, Database } from 'lucide-react';
import dayjs from 'dayjs';

interface Indicator {
  id: number;
  name: string;
  indicator_type: string;
  asset_id?: string;
  description?: string;
  template?: {
    id: string;
    indicator_type: string;
  };
}

interface IndicatorValue {
  id: number;
  date: string;
  value: number;
  value_text?: string;
  grade?: string;
  grade_label?: string;
  extra_data?: {
    ma_value?: number;
    current_price?: number;
  };
}

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  fear_greed: { label: '恐慌贪婪', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', icon: AlertCircle },
  vix: { label: 'VIX', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: Gauge },
  ma200: { label: 'MA200', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', icon: TrendingUp },
  pe: { label: '市盈率', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', icon: Activity },
  metric: { label: '技术指标', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', icon: Database },
  sentiment: { label: '情绪指标', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)', icon: Activity },
};

const gradeConfig: Record<string, { label: string; color: string; bg: string }> = {
  extreme_fear: { label: '极度恐惧', color: '#7f1d1d', bg: 'rgba(127, 29, 29, 0.15)' },
  fear: { label: '恐惧', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
  neutral: { label: '中性', color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.15)' },
  greed: { label: '贪婪', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)' },
  extreme_greed: { label: '极度贪婪', color: '#14532d', bg: 'rgba(20, 83, 45, 0.15)' },
  very_low: { label: '极度低估', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)' },
  low: { label: '低估', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  medium_low: { label: '偏低', color: '#84cc16', bg: 'rgba(132, 204, 22, 0.15)' },
  medium: { label: '合理', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' },
  medium_high: { label: '偏高', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  high: { label: '高估', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  very_high: { label: '极度高估', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)' },
};

// Get grade based on fear/greed value
const getFearGreedGrade = (value: number): { label: string; color: string } => {
  if (value <= 20) return { label: '极度恐慌', color: '#7f1d1d' };
  if (value <= 40) return { label: '恐慌', color: '#dc2626' };
  if (value <= 60) return { label: '中性', color: '#ca8a04' };
  if (value <= 80) return { label: '贪婪', color: '#16a34a' };
  return { label: '极度贪婪', color: '#14532d' };
};

export default function IndicatorDetail() {
  const { id } = useParams<{ id: string }>();
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [values, setValues] = useState<IndicatorValue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchIndicator(parseInt(id));
      fetchValues(parseInt(id));
    }
  }, [id]);

  const fetchIndicator = async (indicatorId: number) => {
    try {
      const response = await axios.get(`/api/v1/indicators/${indicatorId}`);
      setIndicator(response.data);
    } catch (error) {
      console.error('Failed to fetch indicator:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchValues = async (indicatorId: number) => {
    try {
      const response = await axios.get(`/api/v1/indicators/${indicatorId}/values?limit=500`);
      const sorted = response.data.sort((a: IndicatorValue, b: IndicatorValue) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setValues(sorted);
    } catch (error) {
      console.error('Failed to fetch values:', error);
    }
  };

  const isFearGreed = indicator?.template?.indicator_type === 'fear_greed' || indicator?.template?.id === 'BTC_FEAR_GREED';

  const chartData = useMemo(() => {
    return values.map(v => ({
      date: v.date,
      dateStr: dayjs(v.date).format('MM-DD'),
      value: v.value,
      grade: v.grade,
      gradeLabel: v.grade_label,
      valueText: v.value_text,
      extraData: v.extra_data,
    }));
  }, [values]);

  const stats = useMemo(() => {
    if (values.length === 0) return null;
    const latest = values[values.length - 1];
    const allValues = values.map(v => v.value);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const avg = allValues.reduce((a, b) => a + b, 0) / allValues.length;
    
    return {
      latest: latest.value,
      latestGrade: latest.grade,
      latestLabel: latest.grade_label,
      max,
      min,
      avg: avg.toFixed(2),
      count: values.length,
    };
  }, [values]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        加载中...
      </div>
    );
  }

  if (!indicator) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>指标未找到</p>
        <Link to="/indicators" style={{ color: 'var(--primary-color)' }}>返回指标列表</Link>
      </div>
    );
  }

  const config = typeConfig[indicator.indicator_type] || typeConfig['metric'];
  const Icon = config.icon;
  const latestGrade = stats?.latestGrade ? gradeConfig[stats.latestGrade] : null;
  const latestFearGreed = isFearGreed && stats ? getFearGreedGrade(stats.latest) : null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link
          to="/indicators"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} />
          返回指标列表
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: config.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.color,
                }}
              >
                <Icon size={26} />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                  {indicator.name}
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {indicator.asset_id || '全局指标'}
                </p>
              </div>
            </div>
          </div>

          {stats && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.latest.toFixed(1)}
              </div>
              {latestFearGreed ? (
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: `${latestFearGreed.color}20`,
                    color: latestFearGreed.color,
                    display: 'inline-block',
                    marginTop: '8px',
                  }}
                >
                  {latestFearGreed.label}
                </div>
              ) : latestGrade ? (
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: latestGrade.bg,
                    color: latestGrade.color,
                    display: 'inline-block',
                    marginTop: '8px',
                  }}
                >
                  {latestGrade.label}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {[
            { label: '最大值', value: stats.max.toFixed(1), color: '#22c55e' },
            { label: '最小值', value: stats.min.toFixed(1), color: '#ef4444' },
            { label: '平均值', value: stats.avg, color: '#6366f1' },
            { label: '数据点数', value: `${stats.count} 天`, color: '#f59e0b' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'var(--bg-primary)',
                borderRadius: '16px',
                padding: '16px 20px',
                border: '1px solid var(--border-color)',
              }}
            >
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: stat.color, margin: 0 }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>
          历史走势
        </h3>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="dateStr" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={12} 
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [value.toFixed(2), '数值']}
                labelFormatter={(label) => label}
              />
              <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: '350px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            暂无历史数据
          </div>
        )}
      </div>

      {/* Recent Values Table */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>
          近期数据
        </h3>

        {values.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    日期
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    数值
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    档位
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    说明
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...values].reverse().slice(0, 10).map((v, index) => {
                  const grade = v.grade ? gradeConfig[v.grade] : null;
                  const fearGreedGrade = isFearGreed ? getFearGreedGrade(v.value) : null;
                  const displayGrade = isFearGreed ? fearGreedGrade : grade;
                  
                  return (
                    <tr
                      key={v.id}
                      style={{
                        borderBottom: index < 9 ? '1px solid var(--border-color)' : 'none',
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-primary)' }}>
                        {v.date}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {v.value.toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {displayGrade ? (
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: `${displayGrade.color}20`,
                              color: displayGrade.color,
                            }}
                          >
                            {displayGrade.label}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {v.value_text || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>暂无数据</div>
        )}
      </div>
    </div>
  );
}
