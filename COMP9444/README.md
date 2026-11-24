# COMP9444 复习手册（26T3）

COMP9444 *Neural Networks / Deep Learning* 的期末复习手册。正文从零讲起：先讲「为什么需要这个概念」，再给直觉、公式、手算，最后是课内原题、分层练习、变种题和三套模拟卷。全部公式用 LaTeX 排版，14 个关键概念做成了可以拖、可以点的交互实验。

打开方式：双击本文件夹里的 `index.html` 即可，无需安装、无需联网。

## 基于哪些材料

本手册是在下列课件与 tutorial 的基础上整理的。**只列文件名，原文件不随仓库上传**（版权原因）。

### Lecture slides

| 周 | 文件名 |
| --- | --- |
| 1 | `1a_Overview.pdf`、`1b_Neuroanatomy.pdf`、`1c_Perceptrons.pdf`、`1d_Backprop.pdf` |
| 2 | `2a_Probability.pdf`、`2b_Generalization.pdf`、`2c_PyTorch.pdf` |
| 3 | `3a_Variations.pdf`、`3b_Dynamics.pdf` |
| 4 | `4a_Convolution.pdf`、`4b_Image.pdf` |
| 5 | `5a_Autoencoders.pdf`、`5b_Adversarial.pdf`、`5c_WordVectors.pdf` |
| 6 | `Reinforcement_Learning.pdf` |
| 7 | `Sequence_Modelling_1.pdf`、`Sequence_Modelling_2.pdf` |

每个文件另有一份 `*_4up.pdf` 讲义版（内容相同，只是排版密度不同），整理时用的是完整版。

### Tutorials

`COMP9444_Week2_Questions.html` / `COMP9444_Week2_Solutions.html`（Week 3、4、5、7、8、9 同理成对出现），以及第一周的 `Tut1.html`。
手册里的课内例题、共现矩阵数值、MDP 报酬、SRN 状态表等都直接取自这些 tutorial 与解答。

### 章节与课件的对应

章节编号是**按理解顺序重排**的，和课件编号不强对应，方便协作时定位：

| 章节 | 主要依据 |
| --- | --- |
| 1 神经元与网络的基本零件 | `1a_Overview`、`1b_Neuroanatomy`、`1c_Perceptrons` |
| 2 感知机与学习算法 | `1c_Perceptrons`、Tutorial 1–2 |
| 3 反向传播 | `1d_Backprop`、`2c_PyTorch`、`3a_Variations`、`3b_Dynamics` |
| 4 概率、熵与 KL 散度 | `2a_Probability`、Tutorial 3 |
| 5 泛化与正则化 | `2b_Generalization`、`3b_Dynamics` |
| 6 隐藏层、线性塌缩与表示 | `1b_Neuroanatomy`、`1d_Backprop`、Tutorial 4 |
| 7 Softmax 与交叉熵 | `2a_Probability`、`2b_Generalization` |
| 8 卷积网络 | `4a_Convolution`、`4b_Image`、Tutorial 5 |
| 9 自编码器、对抗样本、词向量 | `5a_Autoencoders`、`5b_Adversarial`、`5c_WordVectors`、Tutorial 7 |
| 10 强化学习与 Q-Learning | `Reinforcement_Learning`、Tutorial 8 |
| 11 序列建模：RNN / LSTM / 注意力 | `Sequence_Modelling_1`、`Sequence_Modelling_2`、Tutorial 9 |
| 模拟卷 1–3 | 自编，覆盖上面全部知识点 |

`img/` 里的 6 张示意图取自 tutorial（如 `wk1_NN_logic.jpg`、`wk4_encoder.jpg`、`wk9_reber_srn2.jpg`）。

## 语言

- 正文以**中文**为主，面向中文读者；专业术语第一次出现时给「中文（English）」对照，术语表在每章末尾。
- 论述题的**答题模板保留英文**（考试要写英文），可以直接背。
- 本 README 末尾附一小段英文说明，只是方便不看中文的人快速了解这是什么。

## 学期说明（26T3）

本手册对应 **26T3** 的课件与 tutorial。

如果你拿到了更新学期的课件（例如 27T0），非常欢迎把手册更新到新版本：

1. 对照新课件改 `src/` 下对应的章节片段（`02-ch01.html` … `12-ch11.html`，模拟卷是 `13`–`15`）。
2. 跑 `python build.py` 重新生成 `index.html`（缺片段会直接报错，不会静默出错）。
3. 顺手检查一下数值题：课件的例子换了，手算过程也要跟着换。
4. 更新这个 README 里的**文件名列表**和**学期**，方便后面的人知道你基于哪一版。

如果只是补几道新例题，也可以只改一章，不必全套重做。

## 目录结构

```
COMP9444/
  index.html        构建产物（不要手改）
  src/00-shell.html 页面骨架、侧栏
  src/01-howto.html 使用说明
  src/02-ch01.html … 12-ch11.html   11 章正文
  src/13-mock1.html … 15-mock3.html 三套模拟卷
  build.py          把 src/*.html 拼成 index.html
  css/style.css     全部样式
  js/app.js         公式渲染、答案折叠、进度、搜索、目录高亮
  js/viz1.js        act / params / pta / gd / backprop 五个实验
  js/viz2.js        entropy / gauss / overfit / rank / softmax / conv / wordvec / bellman / rnn
  vendor/           KaTeX（含字体，离线可用）
  img/              tutorial 示意图
```

改内容：编辑 `src/*.html` → `python build.py`。样式在 `css/style.css`，交互在 `js/` 里，两者都不需要构建步骤。

## English

This is a Chinese-language, AI-assisted revision handbook for COMP9444 *Neural Networks / Deep Learning* (UNSW, 26T3). It is built on the course's lecture slides and tutorials (file names listed above; the originals are copyrighted and not included). Each chapter explains a concept from scratch, then works through the in-class exercises, layered practice problems and variants; three mock exams close the handbook. Formulas are typeset in LaTeX and fourteen key ideas are interactive canvas experiments.

The text is intentionally Chinese-first, with bilingual terminology and English answer templates for exam writing. If you have a newer semester's slides, contributions updating the handbook are very welcome — edit the chapter fragments in `src/`, run `python build.py`, and update the file list and semester in this README.
