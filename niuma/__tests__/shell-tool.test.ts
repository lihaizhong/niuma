/**
 * Shell 工具测试
 */

import { describe, it, expect } from 'vitest'
import { execTool } from '../agent/tools/shell.js'
import { ToolExecutionError } from '../types/error.js'

describe('ExecTool', () => {
  it('应该成功执行简单命令', async () => {
    const result = await execTool.execute({ command: 'echo', args: ['Hello, World!'] })
    expect(result).toContain('Hello, World!')
  })

  it('应该返回正确的退出码', async () => {
    const result = await execTool.execute({ command: 'echo', args: ['test'] })
    expect(result).toContain('test')
  })

  it('应该处理命令执行失败', async () => {
    const result = await execTool.execute({ command: 'false' })
    expect(result).toContain('命令执行失败')
    expect(result).toContain('退出码')
  })

  it('应该拒绝执行危险命令', async () => {
    await expect(
      execTool.execute({ command: 'rm -rf /' })
    ).rejects.toThrow(ToolExecutionError)
  })

  it('应该拒绝执行 shutdown 命令', async () => {
    await expect(
      execTool.execute({ command: 'shutdown' })
    ).rejects.toThrow(ToolExecutionError)
  })

  it('应该拒绝执行 fork bomb', async () => {
    await expect(
      execTool.execute({ command: ':(){ :|:& };:' })
    ).rejects.toThrow(ToolExecutionError)
  })

  it('应该支持超时控制', async () => {
    // 创建一个会超时的命令
    await expect(
      execTool.execute({
        command: 'sleep',
        args: ['10'],
        timeout: 100,
      })
    ).rejects.toThrow(ToolExecutionError)
  })

  it('应该支持后台执行', async () => {
    const result = await execTool.execute({
      command: 'echo',
      args: ['test'],
      runInBackground: true,
    })
    expect(result).toContain('PID')
  })

  it('应该支持工作目录控制', async () => {
    const result = await execTool.execute({
      command: 'pwd',
      cwd: '/tmp',
    })
    expect(result).toContain('/tmp')
  })

  it('应该支持环境变量控制', async () => {
    const result = await execTool.execute({
      command: 'echo',
      args: ['$TEST_VAR'],
      env: { TEST_VAR: 'test_value' },
    })
    expect(result).toContain('test_value')
  })

  it('应该支持严格模式', async () => {
    await expect(
      execTool.execute({ command: 'false', strict: true })
    ).rejects.toThrow(ToolExecutionError)
  })
})