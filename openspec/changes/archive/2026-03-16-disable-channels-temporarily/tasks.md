## 1. 禁用渠道导出

- [x] 1.1 在 `niuma/channels/index.ts` 中注释掉 Telegram 渠道导出，添加禁用原因注释
- [x] 1.2 在 `niuma/channels/index.ts` 中注释掉 Slack 渠道导出，添加禁用原因注释
- [x] 1.3 在 `niuma/channels/index.ts` 中注释掉 WhatsApp 渠道导出，添加禁用原因注释
- [x] 1.4 在 `niuma/channels/index.ts` 中注释掉 Dingtalk 渠道导出，添加禁用原因注释

## 2. 禁用渠道注册

- [x] 2.1 在 `niuma/channels/registry.ts` 中注释掉 Telegram 渠道导入
- [x] 2.2 在 `niuma/channels/registry.ts` 中注释掉 Slack 渠道导入
- [x] 2.3 在 `niuma/channels/registry.ts` 中注释掉 WhatsApp 渠道导入
- [x] 2.4 在 `niuma/channels/registry.ts` 中注释掉 Dingtalk 渠道导入（已完成）
- [x] 2.5 在 `niuma/channels/registry.ts` 的 `_createChannel` 方法中注释掉四个渠道的 case 分支

## 3. 验证

- [x] 3.1 执行 `pnpm build` 验证构建成功
- [x] 3.2 执行 `niuma --help` 验证 CLI 正常启动