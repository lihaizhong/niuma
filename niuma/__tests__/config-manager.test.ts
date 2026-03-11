/**
 * ConfigManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { existsSync, unlinkSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { ConfigManager } from '../config/manager'

describe('ConfigManager', () => {
  let testDir: string
  let configPath: string
  let envPath: string
  let manager: ConfigManager

  beforeEach(() => {
    testDir = join(tmpdir(), 'niuma-manager-test-' + Date.now())
    mkdirSync(testDir, { recursive: true })
    configPath = join(testDir, 'niuma.json')
    envPath = join(testDir, '.env')
    manager = new ConfigManager(configPath, envPath)
  })

  afterEach(() => {
    if (existsSync(configPath)) {
      unlinkSync(configPath)
    }
    if (existsSync(envPath)) {
      unlinkSync(envPath)
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('load()', () => {
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

    it('应该解析环境变量引用', () => {
      const envContent = 'TEST_VAR=test-value'
      writeFileSync(envPath, envContent, 'utf-8')

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
    })

    it('应该返回默认配置当文件不存在时', () => {
      const config = manager.load()
      expect(config.workspaceDir).toBe('.niuma')
      expect(config.maxIterations).toBe(40)
    })

    it('应该缓存配置', () => {
      const configContent = '{"maxIterations": 50}'
      writeFileSync(configPath, configContent, 'utf-8')

      const config1 = manager.load()
      const config2 = manager.load()

      expect(config1.maxIterations).toBe(50)
      expect(config2.maxIterations).toBe(50)
      expect(config1).toBe(config2) // 应该是同一个对象
    })

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

    it('应该返回合并后的角色配置', () => {
      const agentConfig = manager.getAgentConfig('test')
      expect(agentConfig.agent?.progressMode).toBe('verbose')
      expect(agentConfig.agent?.showReasoning).toBe(true)
    })

    it('应该继承全局默认配置', () => {
      const agentConfig = manager.getAgentConfig('test')
      expect(agentConfig.maxIterations).toBe(40)
      expect(agentConfig.workspaceDir).toBe('~/.niuma/workspace')
    })

    it('应该抛出错误当角色不存在', () => {
      expect(() => manager.getAgentConfig('nonexistent')).toThrow('角色 nonexistent 不存在')
    })
  })

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

    it('应该返回默认工作区路径', () => {
      const workspaceDir = manager.getAgentWorkspaceDir('test')
      expect(workspaceDir).toContain('.niuma')
      expect(workspaceDir).toContain('agents')
      expect(workspaceDir).toContain('test')
      expect(workspaceDir).toContain('workspace')
    })

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
      const workspaceDir = manager.getAgentWorkspaceDir('test')
      expect(workspaceDir).toBe(customWorkspace)
    })
  })

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

    it('应该返回日志文件路径', () => {
      const logPath = manager.getAgentLogPath('test')
      expect(logPath).toContain('.niuma')
      expect(logPath).toContain('logs')
      expect(logPath).toContain('test.log')
    })
  })

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

    it('应该返回会话存储路径', () => {
      const sessionDir = manager.getAgentSessionDir('test')
      expect(sessionDir).toContain('.niuma')
      expect(sessionDir).toContain('sessions')
      expect(sessionDir).toContain('test')
    })
  })

  describe('listAgents()', () => {
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

  describe('getDefaultAgentId()', () => {
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

    it('应该返回 true 当角色存在时', () => {
      expect(manager.hasAgent('test')).toBe(true)
    })

    it('应该返回 false 当角色不存在时', () => {
      expect(manager.hasAgent('nonexistent')).toBe(false)
    })
  })

  describe('clearCache()', () => {
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