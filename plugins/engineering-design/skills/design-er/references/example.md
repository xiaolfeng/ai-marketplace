# 设计稿好坏对照

同一主题：「从源清单导出 Cursor 清单」。对比重点是实施者能否定位修改位置、处理失败并判断结果。

## 坏例

```markdown
## 工作方式
读取源清单后生成 Cursor 清单，并保证效率与兼容性。

## 数据与接口
清单格式保持一致，遇到问题给出友好提示。

## 验证
充分测试正常和异常情况。
```

「格式保持一致」没有说哪些字段保留；「友好提示」没有失败条件；「充分测试」无法判定设计是否落地。照此实现仍需重新做一遍设计。

## 好例

```markdown
## 工作方式
`npm run build` 调用 `scripts/build-cursor-manifest.mjs`，读取
`.claude-plugin/marketplace.json`，将每个插件条目的允许字段透传后，写入
`dist/cursor/.cursor-plugin/marketplace.json`。

## 数据与接口
根级保留 `name`、`owner`；插件条目只透传脚本的
`PASSTHROUGH_FIELDS`。`--check` 对生成的 JSON 字符串与磁盘产物做逐字比较。

## 异常与兼容
源清单缺少 `name`、`owner` 或 `plugins` 时抛出错误并停止；
`--check` 遇到产物缺失或内容不同则退出码为 1，并提示重新构建。

## 验证
- 运行 `npm run build && npm run check`：检查通过；
- 修改源清单中会透传的字段后运行 `npm run check`：检查失败；
- 恢复并重新构建：检查通过。
```

好例给出了脚本位置、字段边界、可观察的失败结果和能复现的验收步骤。实际写稿时还须核对仓库代码和承接文档，避免把示例当作现状。
