# Data Terminal - 开发路线图

> 最后更新: 2026-03-28

---

## 已完成 ✅

### Phase 1：基础骨架
- [x] 项目结构初始化 (FastAPI + SQLAlchemy + SQLite)
- [x] 数据库模型 (Asset, PriceData)
- [x] 基础 API (assets, prices)
- [x] Yahoo Finance Fetcher
- [x] 数据流验证

### Phase 2：指标系统
- [x] 指标模型 (IndicatorTemplate, Indicator, IndicatorValue)
- [x] 指标计算引擎 (BaseIndicatorProcessor + 注册表)
- [x] 内置指标实现:
  - [x] BTC 恐慌贪婪指数 (alternative.me)
  - [x] VIX 波动率 (Yahoo Finance)
  - [x] MA200 均线偏离度 (本地计算)
- [x] 指标 API (CRUD + calculate + values)

### Phase 3：数据引擎与自动化
- [x] 历史数据回填 (backfill.py)
- [x] 增量更新机制 (price_scheduler.py)
- [x] 指标计算调度 (indicator_scheduler.py)
- [x] CLI 管理工具 (cli.py)
- [x] 过去一年数据填充 (BTC: 366条, SPY: 251条)

---

### Phase 4：每日自动化调度 ✅ (2026-03-27, PR #1)
- [x] APScheduler BackgroundScheduler 集成到 FastAPI lifespan
- [x] 定时任务:
  - [x] `update_crypto`: 每天 09:00 CST → BTC-USD 价格 + Fear & Greed
  - [x] `update_us_market`: 每天 06:00 CST → SPY 价格 + VIX
- [x] 调度管理 API: `/api/v1/scheduler/` (status/history/run/pause/resume)
- [x] 执行日志持久化: `scheduler_run_logs` 表
- [x] 配置开关: `SCHEDULER_ENABLED` 环境变量

---

## 进行中/待开发 🚧

### Phase 5：多数据源与搜索
- [ ] Fetcher 搜索接口 (search, list_assets)
- [ ] Binance 数据源 (加密货币)
- [ ] AKShare 数据源 (A股)
- [ ] 跨源搜索 API
- [ ] 数据源浏览接口

### Phase 6：前端与可视化
- **分支**: `feature/frontend-ui` 已创建
- **技术栈**: React + TS + Vite + Zustand + Lucide React（沿用 fund-manager 风格）
- **4 页 MVP 设计** (待确认):
  1. **Dashboard** — 市场概览（价格卡片 + 指标仪表盘 + 迷你趋势图 + 调度状态）
  2. **Market** — 资产列表 + 详情（价格图表 + 关联指标）
  3. **Indicators** — 指标卡片 + 详情（历史图表 + 分档说明）
  4. **Scheduler** — 任务列表 + 执行历史 + 操作按钮

### Phase 7：监控与告警
- [ ] 指标档位变化通知
- [ ] 数据更新失败告警
- [ ] 系统健康监控

---

## 代码审查发现的问题 📝

### 技术债务
- [ ] `backfill.py` 直接调 yfinance 没走 fetcher 抽象层（重复逻辑）
- [ ] `indicator_scheduler` 和 `fear_greed_fetcher` 有重复的 upsert 逻辑
- [ ] Fetcher 定义为 async 但实际用 requests (同步)
- [ ] `cli.py` 硬编码了绝对路径
- [ ] 未使用 Alembic 做数据库迁移

---

## 系统当前状态

### 数据状态 (2026-03-27)
| 资产 | 数据量 | 最新日期 | 最新价格 |
|------|--------|---------|---------|
| BTC-USD | 369条 | 2026-03-27 | $66,786 |
| SPY | 254条 | 2026-03-26 | $645.09 |

### 指标状态
| 指标 | 当前值 | 档位 | 数据来源 |
|------|--------|------|---------|
| BTC 恐慌贪婪 | 13 | 极度恐惧 | alternative.me |
| VIX | 29.08 | 波动加剧 | Yahoo Finance |

---

## 使用方式

### CLI 命令
```bash
cd backend
source .venv/bin/activate

# 查看状态
python -m app.cli status

# 回填历史数据
python -m app.cli fill-history

# 增量更新价格
python -m app.cli update-prices

# 重新计算指标
python -m app.cli recalc
```

### HTTP API
```bash
# 启动服务
uvicorn app.main:app --port 8000

# 访问文档
open http://localhost:8000/docs
```

---

## 下一步优先级

1. **Phase 6**: 前端可视化 4 页 MVP (高优先级，待确认方案)
2. **Phase 5**: 添加更多数据源 (中优先级)
3. **技术债务**: 重构代码审查中发现的问题 (中优先级)
4. **Phase 7**: 监控告警 (低优先级)
