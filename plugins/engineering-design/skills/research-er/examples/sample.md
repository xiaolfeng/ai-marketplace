<!-- 成品样例：复制本文件后替换为你的内容。命名 NNNN-<scope>-<title>.md，落盘 docs/engineering/research/ -->

> 调研日期：2025-06-11（承接 [0001](../draft/0001-build-dist-tracking.md)）

## 背景
草案 0001 卡在一个问题：构建产物到底该不该跟着仓库走。本文只收证据，不拍板。

## 发现
1. **主流惯例是「能从源码确定性重建的不入库」。**
   [github/gitignore](https://github.com/github/gitignore) 的语言模板几乎全部忽略 `build/`、`dist/`；
2. **例外是「作为交付物被直接消费」的产物。** lockfile 入库是共识——
   消费方要的是可复现的结果，不是重建过程；发布型仓库把产物放 Release 而不是主分支；
3. **claude-plugins-official 实测**（2025-06 查看）：marketplace 清单在根目录手写维护，
   无导出产物环节——它没有多平台分发问题；
4. **`npx skills add` 直读 GitHub 仓库路径**，不要求特定目录结构，
   也不校验文件是否由 CI 生成。

## 结论
事实结论：入库与否取决于产物是否被外部工具直接消费，与「是不是构建生成」无关。
倾向：cursor 清单作为交付物入库，dist 其余内容忽略——拍板是 rfc 的事。
开放问题：Cursor 官方市场提交流程是否接受预生成的清单文件，未查到明确文档。

## 参考
- https://github.com/github/gitignore
- https://docs.npmjs.com/cli/v10/commands/npm-ci（lockfile 可复现安装的依据）
