# RoleFit 云端唯一数据源同步设计

日期：2026-08-16  
状态：已批准并实施  
方案：A（云端为准 + 本地缓存写穿）

## 1. 目标

登录后，应用内业务数据必须等于 **Supabase 中该用户** 的数据。

- 云端是唯一权威源。
- 本地 `localStorage` 仅作已登录态的缓存，以及未登录演示态的存储。
- 登录时丢弃本机旧业务数据，只拉取云端（云端为空则界面为空）。
- 已登录后的诊断、终稿、版本、投递看板变更，立刻写穿到 Supabase。

非目标（本期不做）：

- 登录前本地数据自动合并上传。
- 多设备实时协作 / Realtime 订阅。
- 完整离线队列与冲突合并 UI。
- 把所有读写改成纯远程、去掉缓存层（方案 B）。

## 2. 已确认决策

| 决策点 | 选择 |
|--------|------|
| 冲突策略 | 云端优先；登录后以云端覆盖本地 |
| 登录前本地数据 | 丢弃，不上传 |
| 同步时机 | 每次诊断/保存等写操作后自动同步 |
| 未登录 | 继续只用 localStorage，不写云端 |

## 3. 数据映射

继续复用并扩展 `src/lib/supabase/import-local.ts` 中的映射。

| 本地概念 | Supabase 表 | 说明 |
|----------|-------------|------|
| HistoryRecord | `resumes` + `job_targets` + `optimization_runs` | 现有映射：三者常用同一 `history.id` |
| ResumeVersion | `resume_versions` | `optimization_run_id` = `historyId` |
| Application | `job_applications` | 看板条目 |
| （可选）状态变更事件 | `application_events` | 若现有导入逻辑已写事件则保持 |
| 用户偏好摘要 | `profiles` | 可用最近一次 current/target role 更新 |

AI 计量（`user_entitlements` / `ai_usage_events`）保持现有服务端逻辑，不在本设计改动范围内。

## 4. 运行时行为

### 4.1 未登录

- 行为与现状一致：读写 `resume-optimizer-history` / `versions` / `applications`。
- 不调用 Supabase 业务表。

### 4.2 登录成功（含页面刷新后 session 恢复）

触发顺序：

1. 检测 `SIGNED_IN` / 已有 session（`onAuthStateChange` + 初次 `getSession`）。
2. **清空**本地三项业务 key（及与业务相关的 draft key，若有）。
3. `loadCloudBackup(client)` 拉取该用户行集。
4. 以 **replace（非 merge）** 写入 localStorage。
5. 广播「数据已从云端就绪」事件，optimizer / versions / applications 页面刷新列表。
6. UI 显示短暂状态：`正在加载云端数据…` → 成功或失败提示。

失败时：本地保持已清空状态，提示「云端加载失败，请重试」，提供重试按钮；**不得**回填登录前的本地数据。

### 4.3 已登录写穿

在现有本地写入成功后，异步（或 await 后）调用同步层：

| 本地操作 | 云端动作 |
|----------|----------|
| `saveDiagnoseDraft` | upsert resume + job_target + optimization_run |
| history `update`（终稿、extras、置顶等） | upsert 对应 run（及必要时 resume/target） |
| history 删除 | delete 对应 run；按 FK/策略处理关联 version/application |
| `saveVersionFromHistory` | upsert `resume_versions` |
| version 删除 | delete 对应 version 行 |
| application create/update/move | upsert `job_applications` |
| application 删除 | delete 对应 application 行 |

同步失败：

- 本地缓存已更新可保留，避免打断当前操作。
- 全局或页面级提示：「已保存到本机，云端同步失败」+ 重试。
- 不在静默失败后假装「已上云」。

### 4.4 登出

1. 清空本地业务 key。
2. 刷新 UI 为空（或回到未登录演示空态）。
3. 避免下一账号看到上一账号缓存。

### 4.5 数据管理弹窗

- 登录态文案改为：数据以云端为准；本地仅为缓存。
- 「导入到云端」降为次要/隐藏，或改为「强制用当前缓存覆盖云端」（危险操作，需确认）；默认路径不再依赖它。
- 「从云端恢复」可保留为手动重拉（等同再次执行 4.2 的 replace）。
- JSON 导出/导入仍可用于灾难备份；JSON 导入在已登录态应提示「仅改本地缓存，下次登录会被云端覆盖，除非你再触发覆盖云端」。

## 5. 模块设计

新增（建议路径）：

- `src/lib/supabase/sync.ts`（或拆分 `hydrate.ts` + `write-through.ts`）
  - `clearLocalBusinessData()`
  - `hydrateFromCloud(client): Promise<void>`
  - `syncHistoryRecord(client, userId, record)`
  - `syncVersion(client, userId, version)`
  - `syncApplication(client, userId, app)`
  - `deleteCloudHistory(client, userId, id)` 等删除 API
  - 内部复用 `buildCloudImportPayload` / `buildBackupFromCloudRows` / `importBackup(..., { merge: false })`

认证挂钩：

- `src/components/layout/auth-control.tsx`（或独立 `AuthDataGate`）
  - session 变化时调用 hydrate / clear
  - 暴露 `cloudReady` / `cloudError` 给子树（Context 更干净）

存储层挂钩（二选一，推荐 1）：

1. **在 storage 写函数末尾**检测「已登录则调度 sync」（storage 需能拿到 client，注意勿把 supabase 硬耦进纯函数测试；可用可注入的 `getSyncAdapter()`）。
2. **在页面调用点**（optimizer / versions / applications）写完本地后再调 sync。

推荐 1，避免漏掉调用点；adapter 默认 no-op，登录后注册真实实现。

## 6. 会话与安全

- 仅使用用户 JWT + 现有 RLS；客户端只读写 `auth.uid()` 自己的行。
- hydrate / write-through 一律走 `getBrowserSupabaseClient()`；不把 service role 放到前端。
- 服务端 diagnose API **仍不必**写业务表（本期保持客户端写穿，避免双写）；若后续要服务端落库，另开变更。

## 7. UX

- 顶栏或优化页：登录后首次 hydrate 显示加载态。
- 同步失败：非阻塞 toast/Alert + 重试。
- 未登录用户诊断：行为不变；登录后那些记录**不会**自动出现在云端（符合「丢弃本地」）。

## 8. 测试计划

- 单元：payload 单条 upsert 形状；`buildBackupFromCloudRows` replace 后 key 正确。
- 单元：未登录时 sync adapter 不调用 supabase。
- 手工：账号 A 诊断 → Supabase Table Editor 可见行 → 换浏览器/清 localStorage 登录 A → 数据恢复。
- 手工：账号 A 有本地脏数据 → 登录 → 本地被清空且只显示云端。
- 手工：登出后再登录 B → 看不到 A 的数据。
- 手工：断网写穿失败 → 有错误提示；恢复网络后重试成功。

## 9. 实现顺序建议

1. `clearLocalBusinessData` + `hydrateFromCloud`（replace）+ Auth 挂钩。
2. History 写穿（diagnose / update / delete）。
3. Versions / Applications 写穿。
4. 调整数据管理弹窗文案与危险操作。
5. 测试与 README 一句说明「登录后以云端为准」。

## 10. 风险与假设

- 假设 migration `20260816000000_rolefit_core.sql` 已在目标项目执行且 RLS 正确。
- 现有「history / resume / job_target 共用同一 id」约定继续成立；增量同步沿用该约定。
- Fake-IP / 代理导致的网络失败会表现为同步失败提示，不回退到「假装本地即云端」。
- 删除同步需确认 FK：`resume_versions.optimization_run_id`、applications 对 history 的引用；删除 run 前先删子表或依赖 DB cascade（以 migration 实际定义为准）。
