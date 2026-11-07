# Native Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 标题创建后进入原生编辑器，兼容旧笔记和首页汇总。
**Architecture:** 文档类型采用自由正文，Store 新增创建接口；UI 仅收集标题，插件适配层明确切换到 Markdown 编辑模式。
**Tech Stack:** CommonJS、Obsidian API、node:test、现有 linkedom。
**Spec:** docs/superpowers/specs/2026-11-07-native-notes-design.md

## Global Constraints
- 不批量迁移旧笔记；不新增依赖；目录不超过四层。
- 私密笔记不进入公开插件仓库；结构化记录继续使用现有校验。

## Review Focus
- 旧正文删除字段标记后仍能读取且内容不丢失（Task 1）。
- 原生重命名、CRLF 和空正文仍能显示（Task 1）。
- 保存成功但打开失败不会重复创建，提供重试入口（Task 2）。
- 收件箱转笔记保留全文，正文恶意 HTML 在汇总中只作文本（Task 2）。
- 打开新标签后编辑模式正确，原工作台仍可返回（Task 2，API 适配测试与实机）。

### Task 1: 自由正文及旧文件兼容
**Files:** schema.js、store.js、tests/store.test.js
**Interfaces:** 提供 Store.createDocument({kind,title,context,body?}) → 已保存记录；读取文档返回 _body，原有字段读取兼容。
- [ ] 添加标题创建、原生自由编辑/重命名、旧标记删除、空标题/同名/孤立项目拒绝测试并确认失败。
- [ ] 实现文档分类、自由正文序列化和兼容解析；不改变结构化记录校验。
- [ ] 运行 `node --test tests/store.test.js`，全部通过；提交。

### Task 2: 原生编辑入口与交付
**Files:** ui.js、plugin.js、tests/ui.test.js、tests/bundle.test.js、README.md、manifest.json、package.json、main.js
**Interfaces:** 消费 Task 1 的 createDocument 与 _body；api.open(path,{edit:true}) 由插件实现。
- [ ] 运行并按新契约更新受影响 UI 测试，增加失败重试、原生入口、正文摘要、收件箱全文及 API 编辑模式测试；先确认失败。
- [ ] 新建仅显示标题；文档按钮直接打开原生编辑器；保存失败保留输入，打开失败可重试；汇总提取正文文本。
- [ ] 构建后运行 `node --test tests/*.test.js` 与 `git diff --check`，全部通过；更新中文说明及版本 1.2.0。
- [ ] 代码审查，备份后安装，核对笔记未变、原生编辑器交互；合并发布与私密仓库同步。
