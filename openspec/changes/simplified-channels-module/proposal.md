## Why

The current niuma/channels/ module is over-engineered with 3,467 lines of code across 10+ channel implementations. Many features are unused or duplicated (e.g., retry logic exists in both BaseChannel and utils/retry.ts). We need a simplified, focused channels module for DeepAgent that supports only the 5 active channels (CLI, Discord, Feishu, Email, QQ) with ~800 lines total - a 77% reduction.

## What Changes

- **Create** `deepagent/channels/` module with 9 files (~800 lines total)
- **Simplify** BaseChannel from 331 → ~200 lines by removing duplicate retry/sleep logic
- **Simplify** ChannelRegistry from 321 → ~150 lines with lazy loading
- **Migrate** 5 active channels: CLI, Discord, Feishu, Email, QQ
- **Remove** paused channels (Telegram, DingTalk, Slack, WhatsApp)
- **Consolidate** error handling - use simple Error instead of ChannelError with 6 types
- **Use** existing `utils/retry.ts` for retry logic instead of duplicating in BaseChannel
- **Use** native `setTimeout` for sleep (no external delay library needed)

## Capabilities

### New Capabilities
- `channel-base`: Abstract BaseChannel class with essential lifecycle methods
- `channel-registry`: Channel registration and lifecycle management
- `channel-cli`: Command-line interface channel
- `channel-discord`: Discord WebSocket integration
- `channel-feishu`: Feishu/Lark WebSocket integration
- `channel-email`: IMAP/SMTP email channel
- `channel-qq`: QQ bot integration

### Modified Capabilities
- None (this is a new module, not modifying existing specs)

## Impact

- **New Module**: `deepagent/channels/` with complete channel infrastructure
- **Dependencies**: Reuses existing `utils/retry.ts`, no new dependencies
- **Breaking**: None (new module, doesn't affect existing code)
- **Migration Path**: Future work can migrate from niuma/channels/ to deepagent/channels/

## Non-Goals

- Not migrating paused channels (Telegram, DingTalk, Slack, WhatsApp)
- Not implementing media/file handling (text-only for simplicity)
- Not adding new channel types beyond the 5 specified
- Not changing niuma/channels/ (this is a new implementation)

## Acceptance Criteria

- [ ] All 9 files created in `deepagent/channels/`
- [ ] Total lines of code ≤ 800
- [ ] BaseChannel ≤ 200 lines
- [ ] ChannelRegistry ≤ 150 lines
- [ ] All 5 channels implement required interface
- [ ] Uses `utils/retry.ts` for retry logic
- [ ] TypeScript compilation passes
- [ ] Exports properly configured in index.ts
