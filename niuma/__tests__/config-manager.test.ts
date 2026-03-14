/**
 * ConfigManager 单元测试
 * 
 * 测试范围：
 * - 配置文件加载和解析（支持 JSON5 格式）
 * - 环境变量引用解析
 * - 配置缓存机制
 * - 角色配置合并（全局默认配置 + 角色特定配置）
 * - 角色工作区、日志、会话路径管理
 * - 角色列表和默认角色获取
 * - 缓存清除功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { ConfigManager } from '../config/manager'

describe('ConfigManager', () => {
  /**
   * 测试变量声明
   * - testDir: 测试临时目录路径
   * - configPath: 测试配置文件路径
   * - manager: ConfigManager 实例
   */
  let testDir: string
  let configPath: string
  let manager: ConfigManager

  /**
   * 测试前置钩子：在每个测试用例执行前运行
   * 功能：
   * 1. 创建唯一的临时测试目录（避免并发测试冲突）
   * 2. 初始化配置文件路径
   * 3. 创建 ConfigManager 实例
   */
  beforeEach(() => {
    testDir = join(tmpdir(), 'niuma-manager-test-' + Date.now())
    mkdirSync(testDir, { recursive: true })
    configPath = join(testDir, 'niuma.config.json')
    manager = new ConfigManager(configPath)
  })

  /**
   * 测试后置钩子：在每个测试用例执行后运行
   * 功能：
   * 1. 删除配置文件
   * 2. 递归删除测试目录及其所有内容
   * 目的：确保测试环境清理，避免影响其他测试
   */
  afterEach(() => {
    if (existsSync(configPath)) {
      unlinkSync(configPath)
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  /**
   * load() 方法测试组
   * 功能：加载并解析配置文件
   * 测试场景：
   * - 有效配置文件加载
   * - 环境变量引用解析
   * - 默认配置返回
   * - 配置缓存机制
   * - 强制重新加载
   */
  describe('load()', () => {
    /**
     * 测试目的：验证 ConfigManager 能够正确加载并解析有效的 JSON5 配置文件
     * 测试步骤：
     * 1. 创建包含 JSON5 注释和多层嵌套的配置文件
     * 2. 调用 load() 方法加载配置
     * 3. 验证配置字段被正确解析
     * 验证点：
     * - workspaceDir 字段正确解析
     * - maxIterations 字段正确解析
     * - agents.list 数组正确解析
     * - agents.list[0].id 正确解析
     */
    it('应该加载并解析有效的配置文件', () => {
      const configContent = `
{
  // 单行注释
  "workspaceDir": "~/.niuma/workspace",
  "maxIterations": 40,
  "agents": {
    "defaults": {
      "progressMode": "normal"
    },
    "list": [
      {
        "id": "test",
        "name": "Test Agent"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const config = manager.load()
      expect(config.workspaceDir).toBe('~/.niuma/workspace')
      expect(config.maxIterations).toBe(40)
      expect(config.agents.list).toHaveLength(1)
      expect(config.agents.list[0].id).toBe('test')
    })

    /**
     * 测试目的：验证 ConfigManager 能够正确解析配置中的环境变量引用
     * 测试步骤：
     * 1. 创建 .env 文件，定义环境变量 TEST_VAR
     * 2. 创建配置文件，使用 ${TEST_VAR} 引用环境变量
     * 3. 调用 load() 方法加载配置
     * 4. 验证环境变量被正确解析
     * 验证点：
     * - 配置中的 ${TEST_VAR} 被正确替换为 test-value
     */
    it('应该解析环境变量引用', () => {
      process.env.TEST_VAR = 'test-value'

      const configContent = `
{
  "providers": {
    "openai": {
      "type": "openai",
      "model": "gpt-4o",
      "apiKey": "\${TEST_VAR}"
    }
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const config = manager.load()
      expect(config.providers.openai?.apiKey).toBe('test-value')

      delete process.env.TEST_VAR
    })

    /**
     * 测试目的：验证当配置文件不存在时，返回默认配置
     * 测试步骤：
     * 1. 不创建配置文件
     * 2. 调用 load() 方法
     * 3. 验证返回的默认配置
     * 验证点：
     * - workspaceDir 使用默认值 '.niuma'
     * - maxIterations 使用默认值 40
     */
    it('应该返回默认配置当文件不存在时', () => {
      const config = manager.load()
      expect(config.workspaceDir).toBe('.niuma')
      expect(config.maxIterations).toBe(40)
    })

    /**
     * 测试目的：验证 ConfigManager 的缓存机制
     * 测试步骤：
     * 1. 创建配置文件
     * 2. 第一次调用 load() 获取配置对象
     * 3. 第二次调用 load() 获取配置对象
     * 4. 验证两次返回的是同一个对象引用
     * 验证点：
     * - 两次加载的配置对象完全相等（===）
     * - 证明使用了缓存机制
     */
    it('应该缓存配置', () => {
      const configContent = '{"maxIterations": 50}'
      writeFileSync(configPath, configContent, 'utf-8')

      const config1 = manager.load()
      const config2 = manager.load()

      expect(config1.maxIterations).toBe(50)
      expect(config2.maxIterations).toBe(50)
      expect(config1).toBe(config2) // 应该是同一个对象
    })

    /**
     * 测试目的：验证 force 参数能够强制重新加载配置
     * 测试步骤：
     * 1. 创建初始配置文件（maxIterations: 50）
     * 2. 第一次调用 load() 获取配置
     * 3. 修改配置文件（maxIterations: 60）
     * 4. 调用 load(true) 强制重新加载
     * 5. 验证新配置被加载
     * 验证点：
     * - 第一次加载的 maxIterations 为 50
     * - 第二次强制加载的 maxIterations 为 60
     */
    it('应该强制重新加载当指定 force 参数', () => {
      const configContent = '{"maxIterations": 50}'
      writeFileSync(configPath, configContent, 'utf-8')

      const config1 = manager.load()
      writeFileSync(configPath, '{"maxIterations": 60}', 'utf-8')
      const config2 = manager.load(true)

      expect(config1.maxIterations).toBe(50)
      expect(config2.maxIterations).toBe(60)
    })
  })

  /**
   * getAgentConfig() 方法测试组
   * 功能：获取角色配置（合并全局配置和角色特定配置）
   * 测试场景：
   * - 配置合并验证
   * - 全局配置继承
   * - 角色不存在时的错误处理
   */
  describe('getAgentConfig()', () => {
    beforeEach(() => {
      const configContent = `
{
  "workspaceDir": "~/.niuma/workspace",
  "maxIterations": 40,
  "agent": {
    "progressMode": "normal",
    "showReasoning": false
  },
  "agents": {
    "defaults": {
      "progressMode": "normal"
    },
    "list": [
      {
        "id": "test",
        "name": "Test Agent",
        "agent": {
          "progressMode": "verbose",
          "showReasoning": true
        }
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
    })

    /**
     * 测试目的：验证 getAgentConfig 能够正确合并全局配置和角色特定配置
     * 测试步骤：
     * 1. 配置文件包含全局默认配置和角色特定配置
     * 2. 角色配置覆盖了 progressMode 和 showReasoning
     * 3. 调用 getAgentConfig('test')
     * 4. 验证角色配置被正确合并
     * 验证点：
     * - progressMode 被角色配置覆盖为 'verbose'
     * - showReasoning 被角色配置覆盖为 true
     */
    it('应该返回合并后的角色配置', () => {
      const agentConfig = manager.getAgentConfig('test')
      expect(agentConfig.agent?.progressMode).toBe('verbose')
      expect(agentConfig.agent?.showReasoning).toBe(true)
    })

    /**
     * 测试目的：验证角色配置能够继承全局默认配置
     * 测试步骤：
     * 1. 配置文件包含全局配置（workspaceDir, maxIterations）
     * 2. 角色配置没有覆盖这些字段
     * 3. 调用 getAgentConfig('test')
     * 4. 验证全局配置被继承
     * 验证点：
     * - maxIterations 继承全局值 40
     * - workspaceDir 继承全局值 '~/.niuma/workspace'
     */
    it('应该继承全局默认配置', () => {
      const agentConfig = manager.getAgentConfig('test')
      expect(agentConfig.maxIterations).toBe(40)
      expect(agentConfig.workspaceDir).toBe('~/.niuma/workspace')
    })

    /**
     * 测试目的：验证当角色不存在时抛出错误
     * 测试步骤：
     * 1. 配置文件中只包含 'test' 角色
     * 2. 调用 getAgentConfig('nonexistent')
     * 3. 验证抛出错误
     * 验证点：
     * - 抛出包含 "角色 nonexistent 不存在" 的错误
     */
    it('应该抛出错误当角色不存在', () => {
      expect(() => manager.getAgentConfig('nonexistent')).toThrow('角色 nonexistent 不存在')
    })
  })

  /**
   * getAgentWorkspaceDir() 方法测试组
   * 功能：获取角色工作区目录路径
   * 测试场景：
   * - 默认工作区路径生成
   * - 自定义工作区路径使用
   */
  describe('getAgentWorkspaceDir()', () => {
    beforeEach(() => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "test",
        "name": "Test Agent"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
    })

    /**
     * 测试目的：验证当角色未指定 workspaceDir 时，使用默认路径
     * 测试步骤：
     * 1. 配置文件中角色未定义 workspaceDir
     * 2. 调用 getAgentWorkspaceDir('test')
     * 3. 验证返回的默认路径格式
     * 验证点：
     * - 路径包含 '.niuma'
     * - 路径包含 'agents'
     * - 路径包含角色 ID 'test'
     * - 路径包含 'workspace'
     */
    it('应该返回默认工作区路径', () => {
      const workspaceDir = manager.getAgentWorkspaceDir('test')
      expect(workspaceDir).toContain('.niuma')
      expect(workspaceDir).toContain('agents')
      expect(workspaceDir).toContain('test')
      expect(workspaceDir).toContain('workspace')
    })

    /**
     * 测试目的：验证当角色指定了 workspaceDir 时，使用配置的路径
     * 测试步骤：
     * 1. 创建自定义工作区路径
     * 2. 更新配置文件，为角色指定 workspaceDir
     * 3. 清除缓存并调用 getAgentWorkspaceDir('test')
     * 4. 验证返回的配置路径
     * 验证点：
     * - 返回的路径与配置中指定的完全一致
     */
    it('应该使用配置中指定的 workspaceDir', () => {
      const customWorkspace = join(testDir, 'custom-workspace')
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "test",
        "name": "Test Agent",
        "workspaceDir": "${customWorkspace}"
      }
    ]
  }
}
`.replace('${customWorkspace}', customWorkspace)
      writeFileSync(configPath, configContent, 'utf-8')
      manager.clearCache() // 清除缓存以加载新配置
      const workspaceDir = manager.getAgentWorkspaceDir('test')
      expect(workspaceDir).toBe(customWorkspace)
    })
  })

  /**
   * getAgentLogPath() 方法测试组
   * 功能：获取角色日志文件路径
   * 测试场景：
   * - 日志文件路径生成
   */
  describe('getAgentLogPath()', () => {
    beforeEach(() => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "test",
        "name": "Test Agent"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
    })

    /**
     * 测试目的：验证 getAgentLogPath 能够返回正确的日志文件路径
     * 测试步骤：
     * 1. 配置文件包含一个角色
     * 2. 调用 getAgentLogPath('test')
     * 3. 验证返回的路径格式
     * 验证点：
     * - 路径包含 '.niuma'
     * - 路径包含 'logs'
     * - 路径包含角色 ID 和扩展名 'test.log'
     */
    it('应该返回日志文件路径', () => {
      const logPath = manager.getAgentLogPath('test')
      expect(logPath).toContain('.niuma')
      expect(logPath).toContain('logs')
      expect(logPath).toContain('test.log')
    })
  })

  /**
   * getAgentSessionDir() 方法测试组
   * 功能：获取角色会话存储目录路径
   * 测试场景：
   * - 会话目录路径生成
   */
  describe('getAgentSessionDir()', () => {
    beforeEach(() => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "test",
        "name": "Test Agent"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
    })

    /**
     * 测试目的：验证 getAgentSessionDir 能够返回正确的会话存储路径
     * 测试步骤：
     * 1. 配置文件包含一个角色
     * 2. 调用 getAgentSessionDir('test')
     * 3. 验证返回的路径格式
     * 验证点：
     * - 路径包含 '.niuma'
     * - 路径包含 'sessions'
     * - 路径包含角色 ID 'test'
     */
    it('应该返回会话存储路径', () => {
      const sessionDir = manager.getAgentSessionDir('test')
      expect(sessionDir).toContain('.niuma')
      expect(sessionDir).toContain('sessions')
      expect(sessionDir).toContain('test')
    })
  })

  /**
   * listAgents() 方法测试组
   * 功能：列出所有角色及其配置摘要
   * 测试场景：
   * - 返回所有角色
   * - 空角色列表处理
   * - 配置摘要包含
   */
  describe('listAgents()', () => {
    /**
     * 测试目的：验证 listAgents 能够返回所有角色
     * 测试步骤：
     * 1. 配置文件包含两个角色
     * 2. 调用 listAgents()
     * 3. 验证返回的角色列表
     * 验证点：
     * - 返回数组长度为 2
     * - 第一个角色 ID 为 'agent1'
     * - 第二个角色 ID 为 'agent2'
     */
    it('应该返回所有角色', () => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "agent1",
        "name": "Agent 1",
        "default": true
      },
      {
        "id": "agent2",
        "name": "Agent 2"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const agents = manager.listAgents()
      expect(agents).toHaveLength(2)
      expect(agents[0].id).toBe('agent1')
      expect(agents[1].id).toBe('agent2')
    })

    /**
     * 测试目的：验证当没有角色时返回空数组
     * 测试步骤：
     * 1. 配置文件的 list 为空数组
     * 2. 调用 listAgents()
     * 3. 验证返回空数组
     * 验证点：
     * - 返回数组长度为 0
     */
    it('应该返回空数组当没有角色时', () => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": []
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const agents = manager.listAgents()
      expect(agents).toHaveLength(0)
    })

    /**
     * 测试目的：验证返回的角色信息包含配置摘要
     * 测试步骤：
     * 1. 配置文件包含一个角色，有 agent 覆盖配置
     * 2. 调用 listAgents()
     * 3. 验证配置摘要信息
     * 验证点：
     * - config.agent 为 true（有覆盖）
     * - config.providers 为 false（无覆盖）
     */
    it('应该包含配置摘要', () => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "test",
        "name": "Test Agent",
        "agent": {
          "progressMode": "verbose"
        }
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const agents = manager.listAgents()
      expect(agents[0].config.agent).toBe(true)
      expect(agents[0].config.providers).toBe(false)
    })
  })

  /**
   * getDefaultAgentId() 方法测试组
   * 功能：获取默认角色 ID
   * 测试场景：
   * - 返回标记为默认的角色 ID
   * - 无默认角色时返回第一个角色 ID
   * - 无角色时返回空字符串
   */
  describe('getDefaultAgentId()', () => {
    /**
     * 测试目的：验证能够返回标记为默认的角色 ID
     * 测试步骤：
     * 1. 配置文件包含两个角色，agent2 标记为 default
     * 2. 调用 getDefaultAgentId()
     * 3. 验证返回默认角色 ID
     * 验证点：
     * - 返回 'agent2'（标记为 default 的角色）
     */
    it('应该返回标记为默认的角色 ID', () => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "agent1",
        "name": "Agent 1"
      },
      {
        "id": "agent2",
        "name": "Agent 2",
        "default": true
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const defaultAgentId = manager.getDefaultAgentId()
      expect(defaultAgentId).toBe('agent2')
    })

    /**
     * 测试目的：验证当没有默认角色时，返回第一个角色 ID
     * 测试步骤：
     * 1. 配置文件包含两个角色，都没有标记为 default
     * 2. 调用 getDefaultAgentId()
     * 3. 验证返回第一个角色 ID
     * 验证点：
     * - 返回 'agent1'（列表中的第一个角色）
     */
    it('应该返回第一个角色 ID 当没有默认角色时', () => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "agent1",
        "name": "Agent 1"
      },
      {
        "id": "agent2",
        "name": "Agent 2"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const defaultAgentId = manager.getDefaultAgentId()
      expect(defaultAgentId).toBe('agent1')
    })

    /**
     * 测试目的：验证当没有角色时返回空字符串
     * 测试步骤：
     * 1. 配置文件的 list 为空数组
     * 2. 调用 getDefaultAgentId()
     * 3. 验证返回空字符串
     * 验证点：
     * - 返回空字符串 ''
     */
    it('应该返回空字符串当没有角色时', () => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": []
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
      const defaultAgentId = manager.getDefaultAgentId()
      expect(defaultAgentId).toBe('')
    })
  })

  /**
   * hasAgent() 方法测试组
   * 功能：检查角色是否存在
   * 测试场景：
   * - 角色存在时返回 true
   * - 角色不存在时返回 false
   */
  describe('hasAgent()', () => {
    beforeEach(() => {
      const configContent = `
{
  "agents": {
    "defaults": {},
    "list": [
      {
        "id": "test",
        "name": "Test Agent"
      }
    ]
  }
}
`
      writeFileSync(configPath, configContent, 'utf-8')
    })

    /**
     * 测试目的：验证 hasAgent 能够正确检测角色是否存在
     * 测试步骤：
     * 1. 配置文件包含 'test' 角色
     * 2. 调用 hasAgent('test')
     * 3. 验证返回 true
     * 验证点：
     * - 返回 true（角色存在）
     */
    it('应该返回 true 当角色存在时', () => {
      expect(manager.hasAgent('test')).toBe(true)
    })

    /**
     * 测试目的：验证 hasAgent 能够正确检测角色不存在
     * 测试步骤：
     * 1. 配置文件只包含 'test' 角色
     * 2. 调用 hasAgent('nonexistent')
     * 3. 验证返回 false
     * 验证点：
     * - 返回 false（角色不存在）
     */
    it('应该返回 false 当角色不存在时', () => {
      expect(manager.hasAgent('nonexistent')).toBe(false)
    })
  })

  /**
   * clearCache() 方法测试组
   * 功能：清除配置缓存
   * 测试场景：
   * - 缓存清除后能够加载新配置
   */
  describe('clearCache()', () => {
    /**
     * 测试目的：验证 clearCache 能够清除配置缓存
     * 测试步骤：
     * 1. 创建配置文件（maxIterations: 50）
     * 2. 加载配置（缓存）
     * 3. 调用 clearCache() 清除缓存
     * 4. 修改配置文件（maxIterations: 60）
     * 5. 强制重新加载并验证新配置
     * 验证点：
     * - 清除缓存后，能够加载新的配置值
     * - maxIterations 从 50 变为 60
     */
    it('应该清除配置缓存', () => {
      const configContent = '{"maxIterations": 50}'
      writeFileSync(configPath, configContent, 'utf-8')

      manager.load()
      manager.clearCache()

      // 修改配置文件
      writeFileSync(configPath, '{"maxIterations": 60}', 'utf-8')

      // 重新加载应该获取新配置
      const config = manager.load(true)
      expect(config.maxIterations).toBe(60)
    })
  })
})