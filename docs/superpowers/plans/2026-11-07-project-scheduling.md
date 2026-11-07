# 项目排期与分工 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有项目中提供持久化的排期分工表和编辑弹窗。
**Architecture:** schema 增加 schedule 类型；Store 延用 Markdown 编码与冲突保护；独立 schedule.js 渲染表格和弹窗，由现有 ui.js 管理状态和保存。
**Tech Stack:** CommonJS、Obsidian、原生 DOM、Node test、linkedom；无新增依赖。
**Spec:** docs/superpowers/specs/2026-11-07-project-scheduling-design.md

## Global Constraints
- 不包含个人内容；不改变旧记录格式；目录最多四层；不新增依赖。
- 需求关联可空，已有失效引用保留并提示；跨项目引用拒绝。

## Review Focus
- 需求被删除后任务仍可读取及编辑：Task 1 覆盖。
- 日期倒置、非法工时与空排期：Task 1 覆盖。
- 弹窗草稿在刷新及失败后保持：Task 2 覆盖。
- 多项目同名任务与筛选组合：Task 2 覆盖。
- 特殊字符显示为文本、键盘焦点与窄屏横向滚动：Task 2/3 覆盖。

### Task 1: 排期数据
**Files:** schema.js, store.js, tests/store.test.js
**Interfaces:** Store.save({kind:'schedule',context:projectId,requirement, title,owner,collaborators,start,end,hours,status,note})；load/remove/restore 延用现有接口。
- [ ] 添加并执行失败测试：空负责人日期可保存、重开还原、跨项目需求拒绝、结束早于开始拒绝、非有限/负工时拒绝、删除需求保留任务、同名任务互不覆盖、删除撤销。
- [ ] 新增 schema 字段；存储位置为 10 工作/01 项目/项目目录/排期与分工/带ID文件名.md。
- [ ] 执行全套测试通过并提交。

### Task 2: 表格与弹窗
**Files:** schedule.js, ui.js, styles.css, build.js, tests/ui.test.js
**Interfaces:** schedule.js 导出 table(rows,requirements,filters), editor(data,requirements,message)；ui.js 负责过滤状态及 Store 调用。
- [ ] 先补失败测试：项目入口、弹窗填写及保存、按三条件筛选、编辑、取消、删除撤销、错误保留、外部刷新、HTML 转义、项目隔离。
- [ ] 表格与弹窗使用单独 data-act 与字段标识；每个项目切换时清空筛选；过滤不影响数据。
- [ ] 使用原生 dialog（有 showModal 时），阻止未保存时自动关闭；取消/ESC 明确放弃；失败保留草稿；保存后关闭；动态需求选项只来自当前项目。
- [ ] 更新 build.js 包含新模块，运行构建和全套测试通过并提交。

### Task 3: 交付
**Files:** README.md, manifest.json, package.json, main.js
- [ ] 更新版本至 1.1.0，中文说明补充排期入口与字段。
- [ ] 全分支审查；完成必要修复；构建、全套测试及 diff 检查。
- [ ] 备份并安装到本机笔记库，补齐新模块的跟踪规则；在真实 Obsidian 验证入口、弹窗和取消。
- [ ] 合并并同步插件源代码及私密库插件文件；提供安装包，确认不包含个人数据。
