#!/usr/bin/env python3
"""
经验库维护脚本

功能：
1. 扫描所有经验文件
2. 计算影响力（考虑使用次数、置信度、关联关系）
3. 更新索引地图
4. 识别低影响力经验
"""

import os
import re
import yaml
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple, Set
from collections import defaultdict

# 配置
VAULT_PATH = os.path.expanduser("~/Exp Vault")
IMPACT_THRESHOLD = 30  # 低影响力阈值
NEW_EXPERIENCE_DAYS = 30  # 新经验保护期（天）
MAX_ITERATIONS = 10  # 最大迭代次数
CONVERGENCE_THRESHOLD = 1  # 收敛阈值


class Experience:
    """经验类"""

    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.id = file_path.stem
        self.type = "unknown"
        self.confidence = 0.5
        self.usage_count = 0
        self.impact_score = 0
        self.backlinks = 0
        self.referenced_weight = 0
        self.created = datetime.now()
        self.updated = datetime.now()
        self.last_impact_update = None
        self.references = []  # 引用的其他经验 ID
        self.tags = []

    def load(self):
        """从文件加载经验数据"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 解析 frontmatter
        frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if frontmatter_match:
            frontmatter_text = frontmatter_match.group(1)
            try:
                frontmatter = yaml.safe_load(frontmatter_text)
                if frontmatter:
                    self.type = frontmatter.get('type', 'unknown')
                    self.confidence = float(frontmatter.get('confidence', 0.5))
                    self.usage_count = int(frontmatter.get('usage_count', 0))
                    self.impact_score = float(frontmatter.get('impact_score', 0))
                    self.backlinks = int(frontmatter.get('backlinks', 0))
                    self.referenced_weight = float(frontmatter.get('referenced_weight', 0))
                    self.tags = frontmatter.get('tags', [])

                    # 解析日期
                    created_str = frontmatter.get('created', '')
                    updated_str = frontmatter.get('updated', '')
                    last_update_str = frontmatter.get('last_impact_update', '')

                    if created_str:
                        try:
                            self.created = datetime.fromisoformat(created_str.replace('Z', '+00:00'))
                        except:
                            pass
                    if updated_str:
                        try:
                            self.updated = datetime.fromisoformat(updated_str.replace('Z', '+00:00'))
                        except:
                            pass
                    if last_update_str:
                        try:
                            self.last_impact_update = datetime.fromisoformat(last_update_str.replace('Z', '+00:00'))
                        except:
                            pass
            except Exception as e:
                print(f"警告：解析 frontmatter 失败 {self.file_path}: {e}")

        # 解析双向链接 [[...]]
        content_without_frontmatter = re.sub(r'^---\n.*?\n---', '', content, flags=re.DOTALL)
        links = re.findall(r'\[\[([^\]]+)\]\]', content_without_frontmatter)
        self.references = [link for link in links if link.startswith('exp_')]

    def calculate_impact(self) -> float:
        """计算影响力（不包括引用权重）"""
        return self.usage_count * 5 + self.confidence * 50 + self.backlinks * 10

    def is_new(self) -> bool:
        """是否为新经验"""
        # 确保时间比较时使用相同的时区
        now = datetime.now()
        if self.created.tzinfo is not None:
            # 如果 created 有时区信息，将 now 转换为 UTC
            now = datetime.utcnow().replace(tzinfo=None)
            # 移除 created 的时区信息，使其与 now 兼容
            created = self.created.replace(tzinfo=None)
        else:
            created = self.created
        return now - created < timedelta(days=NEW_EXPERIENCE_DAYS)


def scan_experiences(vault_path: Path) -> Dict[str, Experience]:
    """扫描所有经验文件"""
    experiences = {}

    # 遍历所有目录
    for exp_dir in vault_path.glob('*/'):
        if exp_dir.name.startswith('.'):
            continue

        for exp_file in exp_dir.glob('exp_*.md'):
            exp = Experience(exp_file)
            exp.load()
            experiences[exp.id] = exp

    return experiences


def build_reference_graph(experiences: Dict[str, Experience]) -> Dict[str, List[str]]:
    """构建引用图：id -> [被引用的 id]"""
    graph = defaultdict(list)
    for exp_id, exp in experiences.items():
        for ref_id in exp.references:
            if ref_id in experiences:
                graph[exp_id].append(ref_id)
    return graph


def build_backlink_graph(experiences: Dict[str, Experience], reference_graph: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """构建反向链接图：id -> [引用自己的 id]"""
    backlink_graph = defaultdict(list)
    for exp_id, refs in reference_graph.items():
        for ref_id in refs:
            backlink_graph[ref_id].append(exp_id)

    # 更新 backlinks 数量
    for exp_id, exp in experiences.items():
        exp.backlinks = len(backlink_graph.get(exp_id, []))

    return backlink_graph


def calculate_impact_scores(experiences: Dict[str, Experience], reference_graph: Dict[str, List[str]]):
    """迭代计算影响力"""
    print("\n开始计算影响力...")

    # 初始计算（不包括引用权重）
    for exp in experiences.values():
        exp.impact_score = exp.calculate_impact()

    # 迭代计算（包括引用权重）
    for iteration in range(MAX_ITERATIONS):
        max_change = 0
        prev_scores = {exp_id: exp.impact_score for exp_id, exp in experiences.items()}

        # 计算每个经验的引用权重
        for exp_id, exp in experiences.items():
            exp.referenced_weight = 0

            # 找到所有引用此经验的经验
            for other_id, other_exp in experiences.items():
                if exp_id in other_exp.references:
                    # 获得此经验影响力的份额
                    if exp.impact_score > 0 and exp.backlinks > 0:
                        share = exp.impact_score / exp.backlinks
                        other_exp.referenced_weight += share

        # 重新计算影响力
        for exp in experiences.values():
            new_score = exp.calculate_impact() + exp.referenced_weight
            max_change = max(max_change, abs(new_score - exp.impact_score))
            exp.impact_score = new_score

        print(f"  迭代 {iteration + 1}: 最大变化 {max_change:.2f}")

        if max_change < CONVERGENCE_THRESHOLD:
            print(f"  收敛！经过 {iteration + 1} 次迭代")
            break

    # 新经验保护：给予最小影响力
    for exp in experiences.values():
        if exp.is_new() and exp.impact_score < IMPACT_THRESHOLD:
            exp.impact_score = IMPACT_THRESHOLD


def update_experience_frontmatter(experiences: Dict[str, Experience]):
    """更新经验文件的 frontmatter"""
    print("\n更新 frontmatter...")
    for exp in experiences.values():
        with open(exp.file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 解析 frontmatter
        frontmatter_match = re.match(r'^(---\n.*?\n---)', content, re.DOTALL)
        if frontmatter_match:
            old_frontmatter = frontmatter_match.group(1)

            # 构建新的 frontmatter
            try:
                frontmatter_data = yaml.safe_load(old_frontmatter.replace('---\n', '').replace('\n---', ''))
                if frontmatter_data is None:
                    frontmatter_data = {}

                frontmatter_data['impact_score'] = round(exp.impact_score, 2)
                frontmatter_data['backlinks'] = exp.backlinks
                frontmatter_data['referenced_weight'] = round(exp.referenced_weight, 2)
                frontmatter_data['last_impact_update'] = datetime.now().isoformat() + 'Z'

                new_frontmatter = '---\n' + yaml.dump(frontmatter_data, default_flow_style=False, allow_unicode=True) + '---'

                # 替换 frontmatter
                new_content = content.replace(old_frontmatter, new_frontmatter, 1)

                with open(exp.file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
            except Exception as e:
                print(f"  警告：更新 frontmatter 失败 {exp.file_path}: {e}")


def categorize_experiences(experiences: Dict[str, Experience]) -> Dict[str, List[Experience]]:
    """分类经验"""
    categories = {
        'skills': [],
        'principles': [],
        'models': [],
    }

    # 这里需要根据经验内容判断类型
    # 简化版：根据标签和类型判断
    for exp in experiences.values():
        if 'skill' in str(exp.tags).lower() or '技巧' in str(exp.tags):
            categories['skills'].append(exp)
        elif 'principle' in str(exp.tags).lower() or '原则' in str(exp.tags):
            categories['principles'].append(exp)
        elif 'model' in str(exp.tags).lower() or '模型' in str(exp.tags):
            categories['models'].append(exp)

    return categories


def generate_index_map(experiences: Dict[str, Experience], categories: Dict[str, List[Experience]]) -> str:
    """生成索引地图内容"""
    now = datetime.now().isoformat() + 'Z'

    # 按影响力排序
    sorted_experiences = sorted(experiences.values(), key=lambda x: x.impact_score, reverse=True)

    # 统计
    total = len(experiences)
    skills = sorted(categories['skills'], key=lambda x: x.impact_score, reverse=True)[:20]
    principles = sorted(categories['principles'], key=lambda x: x.impact_score, reverse=True)[:20]
    models = sorted(categories['models'], key=lambda x: x.impact_score, reverse=True)[:20]

    max_impact = max([exp.impact_score for exp in experiences.values()]) if experiences else 0
    avg_impact = sum([exp.impact_score for exp in experiences.values()]) / total if experiences else 0

    # 生成 Markdown
    md = f"""---
id: exp_index_map
type: index_map
created: {now}
updated: {now}
tags: [index, map, hub]
project: niuma
---

# 经验索引地图

> 这是经验库的中央枢纽，通过反向链接展示所有经验之间的关系。

## 🗺️ 经验库概览

```mermaid
graph TB
    subgraph "经验库结构"
        IM[经验索引地图]
        EL[经验记录]
        PF[用户偏好]
        WF[工作流程]
        SO[解决方案]
        KN[知识点]
        CV[约定规范]
        EX[经验日志]
        OT[其他]

        IM --> EL
        IM --> PF
        IM --> WF
        IM --> SO
        IM --> KN
        IM --> CV
        IM --> EX
        IM --> OT

        EL --> S1[具体技巧]
        EL --> P1[通用原则]
        EL --> M1[思维模型]

        S1 --> SO
        P1 --> WF
        M1 --> KN
    end

    subgraph "核心知识维度"
        S((技巧 Skills))
        P((原则 Principles))
        M((模型 Models))
    end

    S1 --> S
    P1 --> P
    M1 --> M
```

## 🎯 核心知识维度

### 🔧 技巧 (Skills)
**定义**：具体的、可直接应用的技术手段或操作方法

**特点**：
- 操作性强，可以直接执行
- 适用范围相对明确
- 可以组合使用

**相关经验**：见下方[[#技巧列表]]

---

### 📜 原则 (Principles)
**定义**：指导决策和行为的通用准则或理念

**特点**：
- 抽象性强，适用范围广
- 需要结合具体场景理解
- 可以推导出多个具体技巧

**相关经验**：见下方[[#原则列表]]

---

### 🧠 模型 (Models)
**定义**：用于理解和解决问题的思维框架或概念模型

**特点**：
- 提供认知框架
- 帮助系统化思考
- 可用于预测和解释

**相关经验**：见下方[[#模型列表]]

---

## 📋 技巧列表

> 展示影响力最大的前 20 条技巧，按使用次数、置信度、关联关系综合排序

| 排名 | 技巧名称 | 来源 | 应用场景 | 影响力 | 使用次数 | 置信度 | 反向链接 |
|------|---------|------|---------|--------|---------|--------|---------|
"""

    for i, exp in enumerate(skills, 1):
        md += f"| {i} | `{exp.id}` | [[{exp.id}]] | {exp.type} | {exp.impact_score:.1f} | {exp.usage_count} | {exp.confidence:.1f} | {exp.backlinks} |\n"

    md += """
**影响力计算公式**：`usage_count * 5 + confidence * 50 + backlinks * 10 + referenced_weight`

*此表只展示影响力最大的前 20 条，新增经验时请根据影响力更新排名*

---

## 📜 原则列表

> 展示影响力最大的前 20 条原则，按使用次数、置信度、关联关系综合排序

| 排名 | 原则名称 | 来源 | 适用范围 | 影响力 | 使用次数 | 置信度 | 反向链接 |
|------|---------|------|---------|--------|---------|--------|---------|
"""

    for i, exp in enumerate(principles, 1):
        md += f"| {i} | `{exp.id}` | [[{exp.id}]] | {exp.type} | {exp.impact_score:.1f} | {exp.usage_count} | {exp.confidence:.1f} | {exp.backlinks} |\n"

    md += """
**影响力计算公式**：`usage_count * 5 + confidence * 50 + backlinks * 10 + referenced_weight`

*此表只展示影响力最大的前 20 条，新增经验时请根据影响力更新排名*

---

## 🧠 模型列表

> 展示影响力最大的前 20 条模型，按使用次数、置信度、关联关系综合排序

| 排名 | 模型名称 | 来源 | 适用场景 | 影响力 | 使用次数 | 置信度 | 反向链接 |
|------|---------|------|---------|--------|---------|--------|---------|
"""

    for i, exp in enumerate(models, 1):
        md += f"| {i} | `{exp.id}` | [[{exp.id}]] | {exp.type} | {exp.impact_score:.1f} | {exp.usage_count} | {exp.confidence:.1f} | {exp.backlinks} |\n"

    md += """
**影响力计算公式**：`usage_count * 5 + confidence * 50 + backlinks * 10 + referenced_weight`

*此表只展示影响力最大的前 20 条，新增经验时请根据影响力更新排名*

---

## 🔗 知识网络

### 技巧 → 原则 → 模型 层次结构

```
技巧层 (可执行操作)
    ↓ 推导
原则层 (指导准则)
    ↓ 抽象
模型层 (思维框架)
```

**示例关系**：
- `Obsidian MCP 工具使用` (技巧) → `清晰组织，便于管理` (原则) → `迭代优化模型` (模型)
- `自然语言命令设计` (技巧) → `降低使用门槛，提升用户体验` (原则) → `用户中心模型` (模型)
- `从简单开始的设计方法` (技巧) → `从简单开始，逐步完善` (原则) → `迭代优化模型` (模型)

---

## 🔄 更新记录

- {now_date}: 自动更新影响力计算，{total} 条经验

---

## 💡 使用指南

### 如何使用此地图

1. **查找相关经验**
   - 使用 Obsidian 的"反向链接"面板
   - 查看"链接到此文件的笔记"

2. **发现新的关系**
   - 浏览三个核心维度的列表
   - 通过表格发现技巧、原则、模型之间的关联

3. **更新索引**
   - 创建新的经验时，更新对应表格
   - 发现新的关系时，添加到"知识网络"部分

### 如何维护此地图

- **新增经验**：
  - 计算影响力：`usage_count * 5 + confidence * 50 + backlinks * 10 + referenced_weight`
  - 插入到对应表格的正确位置（按影响力降序）
  - 如果表格已有 20 条，移除影响力最低的一条

- **更新经验**：
  - 当经验被使用时，增加 `usage_count`
  - 重新计算影响力并调整排名

- **定期审查**：
  - 检查过时或不再适用的条目
  - 根据实际使用情况调整排名
  - 考虑删除低影响力的过时经验

- **自动化维护**：
  - 运行 `python3 scripts/maintain-experience-vault.py` 自动更新影响力
  - 建议每周运行一次

---

## 📊 统计信息

- **总经验数**：{total}
- **技巧数**：{skills_count}（展示前 20）
- **原则数**：{principles_count}（展示前 20）
- **模型数**：{models_count}（展示前 20）
- **经验日志**：{experience_logs_count}
- **其他类型**：{others_count}（未分类经验）
- **最高影响力**：{max_impact}
- **平均影响力**：{avg_impact}
- **最近更新**：{now_date}

---

## 🏷️ 标签导航

- [[#技巧]] - 所有技巧相关经验
- [[#原则]] - 所有原则相关经验
- [[#模型]] - 所有模型相关经验
- [[#经验记录]] - 完整的经验记录
- [[#解决方案]] - 解决方案经验
- [[#工作流程]] - 工作流程经验
"""

    # 替换所有占位符
    now_date = now[:10]
    skills_count = len(skills)
    principles_count = len(principles)
    models_count = len(models)
    
        # 计算其他类型的经验数量
    experience_logs_count = sum(1 for exp in experiences.values() if exp.type == 'experience_log')
    others_count = sum(1 for exp in experiences.values() 
                      if exp.type not in ['preference', 'workflow', 'solution', 'knowledge', 'convention', 'style', 'experience_log'])
    
    return md.format(
        now=now,
        now_date=now_date,
        total=total,
        skills_count=skills_count,
        principles_count=principles_count,
        models_count=models_count,
        experience_logs_count=experience_logs_count,
        others_count=others_count,
        max_impact=f"{max_impact:.1f}",
        avg_impact=f"{avg_impact:.1f}"
    )


def identify_low_impact_experiences(experiences: Dict[str, Experience]) -> List[Experience]:
    """识别低影响力经验"""
    low_impact = []
    for exp in experiences.values():
        if not exp.is_new() and exp.impact_score < IMPACT_THRESHOLD:
            low_impact.append(exp)
    return sorted(low_impact, key=lambda x: x.impact_score)


def main():
    """主函数"""
    vault_path = Path(VAULT_PATH)

    print("=" * 60)
    print("经验库维护脚本")
    print("=" * 60)
    print(f"Vault 路径: {vault_path}")
    print(f"影响力阈值: {IMPACT_THRESHOLD}")
    print(f"新经验保护期: {NEW_EXPERIENCE_DAYS} 天")
    print()

    # 扫描经验
    print("扫描经验文件...")
    experiences = scan_experiences(vault_path)
    print(f"找到 {len(experiences)} 条经验")

    # 构建引用图
    print("\n构建引用关系...")
    reference_graph = build_reference_graph(experiences)
    backlink_graph = build_backlink_graph(experiences, reference_graph)
    print(f"引用关系: {sum(len(refs) for refs in reference_graph.values())} 个")

    # 计算影响力
    calculate_impact_scores(experiences, reference_graph)

    # 更新 frontmatter
    update_experience_frontmatter(experiences)

    # 分类经验
    categories = categorize_experiences(experiences)

    # 生成索引地图
    print("\n生成索引地图...")
    index_map_content = generate_index_map(experiences, categories)
    index_map_path = vault_path / "经验索引地图.md"
    with open(index_map_path, 'w', encoding='utf-8') as f:
        f.write(index_map_content)
    print(f"已更新: {index_map_path}")

    # 识别低影响力经验
    print("\n识别低影响力经验...")
    low_impact = identify_low_impact_experiences(experiences)
    if low_impact:
        print(f"发现 {len(low_impact)} 条低影响力经验:")
        for exp in low_impact[:10]:  # 只显示前 10 条
            print(f"  - {exp.id}: {exp.impact_score:.1f} ({exp.type})")
        if len(low_impact) > 10:
            print(f"  ... 还有 {len(low_impact) - 10} 条")
    else:
        print("没有发现低影响力经验")

    # 输出统计
    print("\n" + "=" * 60)
    print("统计信息")
    print("=" * 60)
    print(f"总经验数: {len(experiences)}")
    print(f"技巧: {len(categories['skills'])}")
    print(f"原则: {len(categories['principles'])}")
    print(f"模型: {len(categories['models'])}")
    print(f"最高影响力: {max([exp.impact_score for exp in experiences.values()]):.1f}" if experiences else "N/A")
    print(f"平均影响力: {sum([exp.impact_score for exp in experiences.values()]) / len(experiences):.1f}" if experiences else "N/A")
    print(f"低影响力经验: {len(low_impact)}")
    print()
    print("完成！")


if __name__ == "__main__":
    main()