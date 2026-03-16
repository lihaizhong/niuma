## Why

部分第三方渠道 SDK 存在环境兼容性问题（如 dingtalk-sdk 需要钉钉环境），或暂时不需要使用。为了确保 CLI 能够正常启动和运行，需要暂时禁用这些渠道的导入和注册。

## What Changes

- 注释掉 dingtalk、slack、telegram、whatsapp 四个渠道在 `channels/index.ts` 中的导出
- 注释掉这四个渠道在 `channels/registry.ts` 中的导入和注册逻辑
- 保留代码实现，仅禁用导入，便于后续重新启用

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `dingtalk-channel-sdk`: 暂时禁用导入和注册
- `slack-channel-complete`: 暂时禁用导入和注册
- `whatsapp-channel-sdk`: 暂时禁用导入和注册

注：telegram-channel 没有对应的 spec，但代码中存在 `TelegramChannel`，也需要禁用。

## Impact

- **代码变更**: `niuma/channels/index.ts`、`niuma/channels/registry.ts`
- **功能影响**: 这四个渠道将不可用，但不影响 CLI、Discord、Email、Feishu、QQ 等其他渠道
- **构建影响**: 减少构建时的依赖加载，避免 SDK 兼容性问题导致 CLI 无法启动

## Non-goals

- 不删除任何渠道的实现代码
- 不修改渠道的配置 schema
- 不影响其他正常工作的渠道

## Acceptance Criteria

- `niuma --help` 能够正常显示帮助信息
- `pnpm build` 构建成功
- 四个渠道的代码保留但未被导入到运行时
