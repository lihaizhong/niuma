# Interface: HeartbeatConfig

Defined in: [niuma/heartbeat/types.ts:68](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/types.ts#L68)

心跳服务配置

## Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="enabled"></a> `enabled` | `boolean` | 是否启用心跳服务 | [niuma/heartbeat/types.ts:70](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/types.ts#L70) |
| <a id="filepath"></a> `filePath` | `string` | HEARTBEAT.md 文件路径（相对于工作区根目录） | [niuma/heartbeat/types.ts:74](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/types.ts#L74) |
| <a id="interval"></a> `interval` | `string` | 检查间隔（Cron 表达式，默认每 30 分钟） | [niuma/heartbeat/types.ts:72](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/types.ts#L72) |
| <a id="tasktimeout"></a> `taskTimeout` | `number` | 任务执行超时时间（秒，默认 5 分钟） | [niuma/heartbeat/types.ts:76](https://github.com/lihaizhong/niuma/blob/main/niuma/heartbeat/types.ts#L76) |
