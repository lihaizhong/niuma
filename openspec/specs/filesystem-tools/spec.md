# filesystem-tools Specification

## Purpose
TBD - created by archiving change builtin-tools-implementation. Update Purpose after archive.
## Requirements
### Requirement: read_file 工具读取文件内容

系统 SHALL 提供 read_file 工具，能够读取文件内容并返回给 Agent。

#### Scenario: 读取完整文件
- **WHEN** Agent 调用 read_file 并提供有效文件路径
- **THEN** 系统读取文件内容
- **AND** 返回文件内容的字符串

#### Scenario: 读取指定行数
- **WHEN** Agent 调用 read_file 并提供 offset 和 limit 参数
- **THEN** 系统从指定行开始读取
- **AND** 只读取指定数量的行
- **AND** 返回读取的内容

#### Scenario: 处理大文件
- **WHEN** 文件内容超过 30,000 字符
- **THEN** 系统截断输出
- **AND** 返回截断的内容和 continuation 指令

#### Scenario: 文件不存在
- **WHEN** Agent 读取不存在的文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含文件路径

#### Scenario: 无权限访问
- **WHEN** Agent 读取无权限的文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明权限问题

### Requirement: write_file 工具写入文件

系统 SHALL 提供 write_file 工具，能够创建或覆盖文件。

#### Scenario: 写入新文件
- **WHEN** Agent 调用 write_file 并提供新文件路径
- **THEN** 系统创建新文件
- **AND** 写入指定内容
- **AND** 返回成功确认

#### Scenario: 覆盖现有文件
- **WHEN** Agent 调用 write_file 并提供已存在的文件路径
- **THEN** 系统覆盖现有文件
- **AND** 写入新内容
- **AND** 返回成功确认

#### Scenario: 创建目录
- **WHEN** 目标目录不存在
- **THEN** 系统自动创建目录
- **AND** 写入文件

#### Scenario: 写入失败
- **WHEN** 写入操作失败（磁盘空间不足等）
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含失败原因

### Requirement: edit_file 工具编辑文件

系统 SHALL 提供 edit_file 工具，能够精确修改文件的特定部分。

#### Scenario: 替换指定行
- **WHEN** Agent 调用 edit_file 并提供要替换的行范围和新内容
- **THEN** 系统替换指定行
- **AND** 保留文件其他部分不变
- **AND** 返回修改后的文件

#### Scenario: 替换匹配的内容
- **WHEN** Agent 调用 edit_file 并提供要查找和替换的文本
- **THEN** 系统查找并替换匹配的文本
- **AND** 替换所有匹配项（除非指定只替换第一个）
- **AND** 返回修改后的文件

#### Scenario: 内容未找到
- **WHEN** 要替换的内容在文件中不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明内容未找到

#### Scenario: 多次替换
- **WHEN** Agent 提供多组替换规则
- **THEN** 系统按顺序执行所有替换
- **AND** 返回最终修改后的文件

### Requirement: list_dir 工具列出目录内容

系统 SHALL 提供 list_dir 工具，能够列出目录中的文件和子目录。

#### Scenario: 列出根目录
- **WHEN** Agent 调用 list_dir 并提供目录路径
- **THEN** 系统列出目录中的所有项
- **AND** 区分文件和目录
- **AND** 返回项的名称和类型

#### Scenario: 递归列出
- **WHEN** Agent 设置 recursive 参数为 true
- **THEN** 系统递归列出所有子目录
- **AND** 返回完整的目录树结构

#### Scenario: 过滤文件类型
- **WHEN** Agent 提供过滤模式（如 *.ts）
- **THEN** 系统只返回匹配的文件
- **AND** 忽略不匹配的文件

#### Scenario: 目录不存在
- **WHEN** Agent 列出不存在的目录
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含目录路径

### Requirement: 路径解析

系统 SHALL 正确解析绝对路径和相对路径。

#### Scenario: 绝对路径
- **WHEN** Agent 提供绝对路径
- **THEN** 系统直接使用该路径
- **AND** 不进行路径转换

#### Scenario: 相对路径
- **WHEN** Agent 提供相对路径
- **THEN** 系统基于工作目录解析
- **AND** 转换为绝对路径

#### Scenario: 路径遍历攻击防护
- **WHEN** 路径包含 `..` 尝试访问父目录
- **THEN** 系统限制在工作目录范围内
- **AND** 拒绝访问工作目录外的文件

### Requirement: 文件编码处理

系统 SHALL 支持多种文件编码格式。

#### Scenario: UTF-8 编码
- **WHEN** 文件是 UTF-8 编码
- **THEN** 系统正确读取和写入
- **AND** 保留所有字符

#### Scenario: 其他编码
- **WHEN** 文件使用其他编码（如 UTF-16、GBK）
- **THEN** 系统尝试自动检测编码
- **AND** 正确读取内容

#### Scenario: 二进制文件
- **WHEN** 文件是二进制文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 建议使用其他工具处理

### Requirement: file_search 工具在文件中搜索内容

系统 SHALL 提供 file_search 工具，能够在文件中使用正则表达式搜索内容。

#### Scenario: 搜索匹配内容
- **WHEN** Agent 调用 file_search 并提供有效的文件路径和正则表达式模式
- **THEN** 系统在文件中搜索匹配的内容
- **AND** 返回所有匹配的行及其行号

#### Scenario: 大小写不敏感搜索
- **WHEN** Agent 设置 caseSensitive 参数为 false
- **THEN** 系统执行大小写不敏感的搜索
- **AND** 返回所有匹配项

#### Scenario: 限制匹配数量
- **WHEN** Agent 设置 maxMatches 参数
- **THEN** 系统只返回指定数量的匹配项
- **AND** 从文件开头开始匹配

#### Scenario: 文件不存在
- **WHEN** Agent 搜索不存在的文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含文件路径

#### Scenario: 文件过大
- **WHEN** 文件大小超过 10MB
- **THEN** 系统拒绝搜索
- **AND** 返回错误信息说明文件过大

#### Scenario: 无匹配结果
- **WHEN** 搜索模式在文件中没有匹配项
- **THEN** 系统返回空结果
- **AND** 不抛出错误

### Requirement: file_move 工具移动文件

系统 SHALL 提供 file_move 工具，能够将文件移动到新位置。

#### Scenario: 移动文件到新目录
- **WHEN** Agent 调用 file_move 并提供有效的源路径和目标路径
- **THEN** 系统移动文件到目标位置
- **AND** 源文件被删除
- **AND** 返回成功确认

#### Scenario: 移动并重命名
- **WHEN** 目标路径包含不同的文件名
- **THEN** 系统移动文件并重命名
- **AND** 返回新文件路径

#### Scenario: 目标目录不存在
- **WHEN** 目标目录不存在
- **THEN** 系统自动创建目标目录
- **AND** 移动文件

#### Scenario: 源文件不存在
- **WHEN** 源文件不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含源路径

#### Scenario: 目标文件已存在
- **WHEN** 目标位置已存在同名文件
- **THEN** 系统覆盖目标文件
- **AND** 返回成功确认

#### Scenario: 跨设备移动失败
- **WHEN** 尝试跨文件系统移动文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明跨设备移动不支持

### Requirement: file_copy 工具复制文件

系统 SHALL 提供 file_copy 工具，能够复制文件到新位置。

#### Scenario: 复制文件到新目录
- **WHEN** Agent 调用 file_copy 并提供有效的源路径和目标路径
- **THEN** 系统复制文件到目标位置
- **AND** 源文件保持不变
- **AND** 返回成功确认

#### Scenario: 复制并重命名
- **WHEN** 目标路径包含不同的文件名
- **THEN** 系统复制文件并重命名
- **AND** 返回新文件路径

#### Scenario: 目标目录不存在
- **WHEN** 目标目录不存在
- **THEN** 系统自动创建目标目录
- **AND** 复制文件

#### Scenario: 源文件不存在
- **WHEN** 源文件不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含源路径

#### Scenario: 目标文件已存在
- **WHEN** 目标位置已存在同名文件
- **THEN** 系统覆盖目标文件
- **AND** 返回成功确认

### Requirement: file_delete 工具删除文件

系统 SHALL 提供 file_delete 工具，能够安全地删除文件。

#### Scenario: 删除文件（已确认）
- **WHEN** Agent 调用 file_delete 并设置 confirm 参数为 true
- **THEN** 系统删除指定文件
- **AND** 返回成功确认

#### Scenario: 未确认拒绝删除
- **WHEN** Agent 未设置 confirm 参数或设置为 false
- **THEN** 系统拒绝删除
- **AND** 抛出 ToolExecutionError
- **AND** 错误信息说明需要确认

#### Scenario: 文件不存在
- **WHEN** 文件不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含文件路径

#### Scenario: 删除目录失败
- **WHEN** 路径指向目录而非文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明路径是目录

#### Scenario: 权限不足
- **WHEN** 无权限删除文件
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明权限问题

### Requirement: file_info 工具获取文件信息

系统 SHALL 提供 file_info 工具，能够获取文件的详细信息。

#### Scenario: 获取文件信息
- **WHEN** Agent 调用 file_info 并提供有效的文件路径
- **THEN** 系统返回文件详细信息
- **AND** 包括文件大小、修改时间、访问时间、创建时间、权限模式

#### Scenario: 识别文件类型
- **WHEN** 路径指向文件
- **THEN** 系统设置 isFile 为 true
- **AND** isDirectory 为 false

#### Scenario: 识别目录
- **WHEN** 路径指向目录
- **THEN** 系统设置 isDirectory 为 true
- **AND** isFile 为 false

#### Scenario: 路径不存在
- **WHEN** 路径不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含路径

### Requirement: dir_create 工具创建目录

系统 SHALL 提供 dir_create 工具，能够创建目录。

#### Scenario: 创建单层目录
- **WHEN** Agent 调用 dir_create 并设置 recursive 为 false
- **THEN** 系统创建单层目录
- **AND** 返回成功确认

#### Scenario: 递归创建目录
- **WHEN** Agent 设置 recursive 为 true（默认）
- **THEN** 系统递归创建所有父目录
- **AND** 返回成功确认

#### Scenario: 目录已存在
- **WHEN** 目录已存在
- **THEN** 系统不抛出错误
- **AND** 返回成功确认

#### Scenario: 权限不足
- **WHEN** 无权限创建目录
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明权限问题

### Requirement: dir_delete 工具删除目录

系统 SHALL 提供 dir_delete 工具，能够安全地删除目录。

#### Scenario: 删除空目录（已确认）
- **WHEN** Agent 调用 dir_delete，confirm 为 true，recursive 为 false
- **THEN** 系统删除空目录
- **AND** 返回成功确认

#### Scenario: 递归删除目录（已确认）
- **WHEN** Agent 设置 recursive 为 true，confirm 为 true
- **THEN** 系统递归删除目录及其所有内容
- **AND** 返回成功确认

#### Scenario: 未确认拒绝删除
- **WHEN** confirm 参数未设置或为 false
- **THEN** 系统拒绝删除
- **AND** 抛出 ToolExecutionError
- **AND** 错误信息说明需要确认

#### Scenario: 删除非空目录失败
- **WHEN** recursive 为 false 且目录不为空
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明目录不为空

#### Scenario: 目录不存在
- **WHEN** 目录不存在
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息包含目录路径

#### Scenario: 删除文件失败
- **WHEN** 路径指向文件而非目录
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明路径是文件

#### Scenario: 权限不足
- **WHEN** 无权限删除目录
- **THEN** 系统抛出 ToolExecutionError
- **AND** 错误信息说明权限问题

