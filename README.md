# UNSW IT 课程复习手册

这个仓库用来存放 UNSW IT 相关课程（目前主要是 COMP 课程）的**期末复习手册**。每个科目一个子文件夹，里面是一份可以直接用浏览器打开的交互式手册。

## 手册是什么

- **由 AI 在课件和 tutorial 的基础上生成**，不是官方教材，也不是老师的讲义摘抄。
- **支持交互**：公式用 LaTeX 排版，关键概念做成了可以拖、可以点的动画实验（前向传播、梯度下降、卷积、Softmax、Bellman 迭代、RNN 等）。
- **包含大部分课内例题**：tutorial 的题目、手算过程、答案都在，另外还有分层练习、变种题和模拟卷。
- **正文以中文为主**：面向中文读者，术语给中英对照，答题模板保留英文写法；每份手册末尾附一小段英文说明。

## 版权说明

- 学校的 **lecture slides、tutorial、考试卷等原始教学资料受版权保护，不随仓库上传**。仓库里只有我们自己整理出来的笔记和前端代码。
- 手册是**学习笔记**，用于个人复习，引用课件时只写文件名（见各科 README），不附带原文件。
- 如果版权方对内容有异议，会立即移除相关部分。考试内容请以老师当年的课件与公告为准。

## 目录

| 课程 | 学期 | 手册 | 内容 |
| --- | --- | --- | --- |
| COMP9444 Neural Networks / Deep Learning | 26T3 | [COMP9444/](COMP9444/) | 11 章 + 3 套模拟卷、14 个交互实验 |

> 以后根目录还会加一个 `index.html`，用来链接各科手册；目前直接进子文件夹打开即可。

## 怎么用

- 直接双击对应子文件夹里的 `index.html`，离线也能看（KaTeX 字体和图片都在本地）。
- 页面左侧是目录，右侧有阅读进度；答案默认折叠，点「显示答案」展开；进度记在浏览器 localStorage 里。

## 欢迎一起贡献

- **加新科目**：复制 `COMP9444/` 的结构（`src/` 放章节片段，`build.py` 拼成 `index.html`），改配色和内容即可。
- **更新学期**：如果你拿到了新一年的课件，改 `src/` 里对应章节，跑一遍 `python build.py`，并在该科 README 里更新课件文件名和学期。
- **纠错**：发现算错的数、讲错的概念，直接开 issue 或 PR，写清楚是哪一章哪一题就好。

---

## English

This repository hosts AI-assisted, interactive revision handbooks for UNSW IT courses, one folder per course. Each handbook is generated from the course's lecture slides and tutorials, explains the material from scratch for readers who attended no lectures, and includes most in-class exercises plus extra practice and mock exams. Formulas are typeset with LaTeX; key concepts are interactive canvas experiments you can drag and step through.

The handbooks are written primarily in Chinese (the intended audience), with bilingual terminology and English exam-style answer templates; each ends with a short English note like this one.

Original course materials — lecture slides, tutorials, exam papers — are copyrighted and are **not** included here; only our own notes and front-end code are. Contributions are welcome: add a new course folder, update a handbook for a newer semester, or open an issue for any mistake.
