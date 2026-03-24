# 数据终端 - 开发计划

## 开发策略
自底向上：先跑通数据流，再完善架构。

---

## Phase 1：基础骨架（当前）

### 目标
建立基础项目结构，实现核心数据流：添加标的 → 拉取价格 → 存储 → 查询

### 任务清单

- [x] 1.1 项目结构初始化
  - [x] 创建基础目录结构
  - [x] pyproject.toml 配置
  - [x] 数据库连接配置

- [x] 1.2 数据库模型
  - [x] Asset（标的）
  - [x] PriceData（价格数据）
  - [ ] Watchlist（关注列表，简化版）
  - [ ] 数据库迁移脚本

- [x] 1.3 基础 API
  - [x] POST /api/v1/assets - 添加标的 ✅
  - [x] GET /api/v1/assets - 列示标的 ✅
  - [x] GET /api/v1/assets/{id} - 获取单个标的 ✅
  - [x] GET /api/v1/prices - 查询价格 ✅
  - [x] GET /api/v1/prices/latest - 最新价格 ✅
  - [x] POST /api/v1/update - 触发更新 ✅

- [x] 1.4 Yahoo Finance Fetcher
  - [x] 基础采集类
  - [x] 拉取历史数据
  - [x] 存储到数据库 ✅

- [x] 1.5 验证数据流
  - [x] 手动测试：添加 BTC → 更新 → 查询价格 ✅
  - [x] 添加 SPY → 更新 → 查询价格 ✅

---

## Phase 2：指标系统

### 目标
实现指标模板系统，支持 MA200 计算

### 任务清单

- [ ] 2.1 指标模型
  - [ ] IndicatorTemplate（模板定义）
  - [ ] Indicator（指标实例）
  - [ ] IndicatorValue（指标数值）

- [ ] 2.2 指标计算引擎
  - [ ] 指标基类
  - [ ] MA200 指标实现
  - [ ] 分档计算

- [ ] 2.3 指标 API
  - [ ] POST /api/v1/indicators - 创建指标
  - [ ] GET /api/v1/indicators/{id}/values - 查询指标值
  - [ ] POST /api/v1/indicators/{id}/calculate - 手动计算

---

## Phase 3：关注列表与自动化

### 目标
实现关注列表管理和定时更新

### 任务清单

- [ ] 3.1 关注列表功能
  - [ ] Watchlist 完整模型
  - [ ] 添加/移除标的
  - [ ] 获取关注列表价格

- [ ] 3.2 定时任务
  - [ ] APScheduler 集成
  - [ ] 每日自动更新
  - [ ] 更新日志记录

---

## Phase 4：搜索与多数据源

### 目标
支持多数据源搜索和浏览

### 任务清单

- [ ] 4.1 Fetcher 增强
  - [ ] search() 搜索接口
  - [ ] list_assets() 浏览接口
  - [ ] Binance Fetcher
  - [ ] AKShare Fetcher

- [ ] 4.2 搜索 API
  - [ ] GET /api/v1/search?q=keyword
  - [ ] GET /api/v1/datasources

---

## Phase 5：前端与图表

### 目标
TradingView 集成和基础前端

### 任务清单

- [ ] 5.1 TradingView 接口
  - [ ] /tv/config
  - [ ] /tv/symbols
  - [ ] /tv/history

- [ ] 5.2 前端页面
  - [ ] 标的搜索页
  - [ ] 价格图表页
  - [ ] 关注列表页
  - [ ] 指标展示页

---

## 当前进度

**Phase 1 - 基础骨架**

```
[░░░░░░░░░░░░░░░░░░] 0%
```

下一步：创建数据库模型
