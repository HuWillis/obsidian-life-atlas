# List Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 所有增长型列表统一筛选与分页，保持汇总准确与返回位置。
**Architecture:** 通用 lists.js 负责状态选择、分页控件；各页面先选取当前归属范围，再统一筛选排序分页。Store/IO 提供实际 mtime，插件提供工作台滚动读写。
**Tech Stack:** CommonJS、Obsidian、node:test、现有 linkedom。
**Spec:** docs/superpowers/specs/2026-11-07-list-management-design.md

## Global Constraints
- 首页每块最多 5 条；子列表每页 20 条。
- 不修改笔记结构、不加依赖；统计以全部匹配记录计算。
- 列表状态仅在当前工作台会话内保留，不承诺跨重启。

## Review Focus
- 同时间记录稳定排序与未知修改时间（Task 1）。
- 日期范围跨月、空结果、筛选后页码超界（Task 1）。
- 原生打开和后台刷新不丢失滚动及搜索焦点（Task 2）。
- 收支、投资、单据统计不能只统计当前页（Task 2）。
- 全部自定义列表必须接入，项目间条件不串联（Task 2）。

### Task 1: 通用列表与修改时间
**Files:** lists.js、tests/lists.test.js、store.js、io.js、tests/fs-io.js、tests/store.test.js、build.js
**Interfaces:** select(rows,state,options) 返回 {items,matched,total,page,pages}；controls(key,state,options) 和 pager(key,result) 返回转义 HTML；state.page 合法收缩。记录提供 _mtime，仅用于显示。
- [ ] 添加分页20条、稳定排序、搜索日期条件、空结果页码收缩以及真实文件mtime测试；运行确认失败。
- [ ] 实现通用选择及控件，扩展IO读取mtime并接入构建。
- [ ] 运行 `node --test tests/lists.test.js tests/store.test.js`，全部通过；提交。

### Task 2: 所有页面接入与交付
**Files:** ui.js、schedule.js、plugin.js、styles.css、tests/ui.test.js、README.md、manifest.json、package.json、main.js
**Interfaces:** 消费 Task 1 的列表模块；api.getScroll()/setScroll(y) 保留工作台滚动。
- [ ] 添加多页日记、知识排序/搜索、首页上限、各页面覆盖、统计全量、末页删除、跨项目及原生返回状态测试；确认旧实现失败。
- [ ] 接入通用列表控件与每个场景默认筛选，保留搜索焦点/滚动，清除筛选时显示全量范围。
- [ ] 运行构建、`node --test tests/*.test.js` 和 `git diff --check`，更新中文说明及 1.3.0。
- [ ] 独立审查、实机验证、备份安装；确认笔记字节未变并同步发布。
