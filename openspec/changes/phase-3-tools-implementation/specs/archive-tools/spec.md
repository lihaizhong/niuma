## ADDED Requirements

### Requirement: Archive 压缩工具
系统 MUST 提供 Archive 工具，允许用户压缩文件或目录为多种格式。

#### Scenario: 成功压缩单个文件为 ZIP
- **WHEN** 用户调用 archive 工具，指定 source 为文件路径，destination 为 zip 文件路径，format 为 "zip"
- **THEN** 系统创建 zip 压缩文件，包含指定的源文件
- **AND** 返回压缩成功消息，包含压缩文件路径和大小

#### Scenario: 成功压缩目录为 tar.gz
- **WHEN** 用户调用 archive 工具，指定 source 为目录路径，destination 为 tar.gz 文件路径，format 为 "tar.gz"
- **THEN** 系统创建 tar.gz 压缩文件，递归包含目录中的所有文件
- **AND** 返回压缩成功消息，包含压缩文件路径和大小

#### Scenario: 压缩文件超过大小限制
- **WHEN** 用户尝试压缩超过 100MB 的文件
- **THEN** 系统拒绝压缩操作
- **AND** 返回错误消息，说明文件大小超过限制

#### Scenario: 源文件不存在
- **WHEN** 用户调用 archive 工具，指定的 source 路径不存在
- **THEN** 系统拒绝压缩操作
- **AND** 返回错误消息，说明源文件或目录不存在

### Requirement: Extract 解压工具
系统 MUST 提供 Extract 工具，允许用户解压多种格式的压缩文件。

#### Scenario: 成功解压 ZIP 文件
- **WHEN** 用户调用 extract 工具，指定 source 为 zip 文件路径，destination 为目标目录
- **THEN** 系统解压 zip 文件到指定目录
- **AND** 返回解压成功消息，包含解压的文件列表

#### Scenario: 成功解压 tar.gz 文件
- **WHEN** 用户调用 extract 工具，指定 source 为 tar.gz 文件路径，destination 为目标目录
- **THEN** 系统解压 tar.gz 文件到指定目录
- **AND** 返回解压成功消息，包含解压的文件列表

#### Scenario: 解压文件超过大小限制
- **WHEN** 用户尝试解压超过 100MB 的压缩文件
- **THEN** 系统拒绝解压操作
- **AND** 返回错误消息，说明文件大小超过限制

#### Scenario: 压缩文件损坏
- **WHEN** 用户调用 extract 工具，指定的压缩文件损坏或格式不正确
- **THEN** 系统拒绝解压操作
- **AND** 返回错误消息，说明压缩文件损坏

#### Scenario: 压缩文件不存在
- **WHEN** 用户调用 extract 工具，指定的 source 路径不存在
- **THEN** 系统拒绝解压操作
- **AND** 返回错误消息，说明压缩文件不存在