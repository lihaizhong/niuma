#!/usr/bin/env python3
"""
经验库维护脚本

功能：
1. 扫描所有经验文件
2. 计算影响力（usage_count × 5 + confidence × 50 + backlinks × 10 + referenced_weight）
3. 更新索引地图
4. 识别低影响力经验

用法：
  python3 maintain-experience-vault.py                    # 默认运行
  python3 maintain-experience-vault.py --dry-run          # 预览变更
  python3 maintain-experience-vault.py --backup           # 修改前备份
  python3 maintain-experience-vault.py --vault-path ~/MyVault  # 指定路径
"""

import os
import re
import sys
import argparse
import shutil
import yaml
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from dataclasses import dataclass, field


# ============== 配置 ==============
@dataclass
class Config:
    """配置类"""
    vault_path: str = os.path.expanduser("~/Exp Vault")
    impact_threshold: float = 30.0
    new_experience_days: int = 30
    max_iterations: int = 10
    convergence_threshold: float = 1.0
    # 影响力计算权重
    usage_weight: float = 5.0
    confidence_weight: float = 50.0
    backlink_weight: float = 10.0
    # 运行模式
    dry_run: bool = False
    backup: bool = False


def parse_args() -> argparse.Namespace:
    """解析命令行参数"""
    parser = argparse.ArgumentParser(
        description='经验库维护脚本 - 计算影响力、更新索引地图',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
示例:
  %(prog)s                          # 默认运行
  %(prog)s --dry-run                # 预览变更，不实际修改
  %(prog)s --backup                 # 修改前备份到 .backup/
  %(prog)s --vault-path ~/MyVault   # 指定 Vault 路径
'''
    )
    parser.add_argument(
        '--vault-path',
        type=str,
        default=os.path.expanduser('~/Exp Vault'),
        help='Vault 路径 (默认: ~/Exp Vault)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='预览模式：只显示变更，不实际修改文件'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='修改前备份到 <vault>/.backup/ 目录'
    )
    return parser.parse_args()


CONFIG = Config()


# ============== 数据结构 ==============
@dataclass
class Experience:
    """经验类"""
    file_path: Path
    id: str = field(init=False)
    type: str = "unknown"
    confidence: float = 0.5
    usage_count: int = 0
    impact_score: float = 0.0
    backlinks: int = 0
    referenced_weight: float = 0.0
    created: datetime = field(default_factory=datetime.now)
    updated: datetime = field(default_factory=datetime.now)
    last_impact_update: Optional[datetime] = None
    references: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)

    def __post_init__(self):
        """初始化后处理"""
        self.id = self.file_path.stem

    @staticmethod
    def _parse_datetime(date_str: str) -> Optional[datetime]:
        if not date_str:
            return None
        
        date_str = str(date_str).strip()
        
        formats = [
            '%Y-%m-%d %H:%M:%S%z',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S%z',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%S.%f%z',
            '%Y-%m-%dT%H:%M:%S.%f',
            '%Y-%m-%dT%H:%M:%S.%fZ',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%d',
        ]
        
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            pass
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None

    def load(self):
        """从文件加载经验数据"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 解析 frontmatter
        frontmatter_match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
        if not frontmatter_match:
            return

        frontmatter_text = frontmatter_match.group(1)
        try:
            frontmatter = yaml.safe_load(frontmatter_text) or {}
        except yaml.YAMLError as e:
            print(f"警告：解析 frontmatter 失败 {self.file_path}: {e}")
            return

        self.type = frontmatter.get('type', 'unknown')
        self.confidence = float(frontmatter.get('confidence', 0.5))
        self.usage_count = int(frontmatter.get('usage_count', 0))
        self.impact_score = float(frontmatter.get('impact_score', 0))
        self.backlinks = int(frontmatter.get('backlinks', 0))
        self.referenced_weight = float(frontmatter.get('referenced_weight', 0))
        self.tags = frontmatter.get('tags', [])

        self.created = self._parse_datetime(frontmatter.get('created', '')) or self.created
        self.updated = self._parse_datetime(frontmatter.get('updated', '')) or self.updated
        self.last_impact_update = self._parse_datetime(frontmatter.get('last_impact_update', ''))
        content_without_frontmatter = re.sub(r'^---\n.*?\n---', '', content, flags=re.DOTALL)
        self.references = [
            link for link in re.findall(r'\[\[([^\]]+)\]\]', content_without_frontmatter)
            if link.startswith('exp_')
        ]

    def calculate_base_impact(self) -> float:
        """计算基础影响力（不包括引用权重）"""
        return (
            self.usage_count * CONFIG.usage_weight +
            self.confidence * CONFIG.confidence_weight +
            self.backlinks * CONFIG.backlink_weight
        )

    def is_new(self) -> bool:
        """是否为新经验"""
        now = datetime.now()
        created = self.created.replace(tzinfo=None) if self.created.tzinfo else self.created
        return (now - created) < timedelta(days=CONFIG.new_experience_days)


# ============== 核心功能 ==============
def scan_experiences(vault_path: Path) -> Dict[str, Experience]:
    """扫描所有经验文件"""
    experiences = {}

    for exp_dir in vault_path.glob('*/'):
        # 跳过隐藏目录和 Poetry 目录
        if exp_dir.name.startswith('.') or exp_dir.name == 'Poetry':
            continue

        for exp_file in exp_dir.glob('exp_*.md'):
            exp = Experience(exp_file)
            exp.load()
            experiences[exp.id] = exp

    return experiences


def build_graphs(experiences: Dict[str, Experience]) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    reference_graph = defaultdict(list)
    backlink_graph = defaultdict(list)

    for exp_id, exp in experiences.items():
        for ref_id in exp.references:
            if ref_id in experiences:
                reference_graph[exp_id].append(ref_id)

    for exp_id, refs in reference_graph.items():
        for ref_id in refs:
            backlink_graph[ref_id].append(exp_id)
    for exp_id, exp in experiences.items():
        exp.backlinks = len(backlink_graph.get(exp_id, []))

    return reference_graph, backlink_graph


def calculate_impact_scores(experiences: Dict[str, Experience], reference_graph: Dict[str, List[str]]):
    print("\n开始计算影响力...")

    for exp in experiences.values():
        exp.impact_score = exp.calculate_base_impact()

    for iteration in range(CONFIG.max_iterations):
        max_change = 0.0
        for exp in experiences.values():
            exp.referenced_weight = 0.0

        # 计算引用权重（优化：避免重复计算）
        for exp_id, exp in experiences.items():
            if exp.impact_score <= 0 or exp.backlinks == 0:
                continue

            share = exp.impact_score / exp.backlinks
            for other_id in reference_graph.keys():
                if exp_id in experiences[other_id].references:
                    experiences[other_id].referenced_weight += share

        # 重新计算影响力
        for exp in experiences.values():
            new_score = exp.calculate_base_impact() + exp.referenced_weight
            max_change = max(max_change, abs(new_score - exp.impact_score))
            exp.impact_score = new_score

        print(f"  迭代 {iteration + 1}: 最大变化 {max_change:.2f}")

        if max_change < CONFIG.convergence_threshold:
            print(f"  收敛！经过 {iteration + 1} 次迭代")
            break

    for exp in experiences.values():
        if exp.is_new() and exp.impact_score < CONFIG.impact_threshold:
            exp.impact_score = CONFIG.impact_threshold


def backup_vault(vault_path: Path) -> Optional[Path]:
    """备份 Vault 目录"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = vault_path / '.backup' / f'backup_{timestamp}'
    
    try:
        backup_dir.parent.mkdir(parents=True, exist_ok=True)
        # 只备份经验文件，不备份 .backup 目录
        for exp_dir in vault_path.glob('*/'):
            if exp_dir.name.startswith('.') or exp_dir.name == 'Poetry':
                continue
            dest_dir = backup_dir / exp_dir.name
            shutil.copytree(exp_dir, dest_dir)
        print(f"已备份到: {backup_dir}")
        return backup_dir
    except Exception as e:
        print(f"警告：备份失败: {e}")
        return None


def update_experience_frontmatter(experiences: Dict[str, Experience]):
    """更新经验文件的 frontmatter"""
    if CONFIG.dry_run:
        print("\n[DRY-RUN] 将更新以下 frontmatter:")
    else:
        print("\n更新 frontmatter...")
    
    now = datetime.now().isoformat() + 'Z'
    updated_count = 0

    for exp in experiences.values():
        try:
            with open(exp.file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            frontmatter_match = re.match(r'^(---\n.*?\n---)', content, re.DOTALL)
            if not frontmatter_match:
                continue

            old_frontmatter = frontmatter_match.group(1)
            frontmatter_data = yaml.safe_load(old_frontmatter.replace('---\n', '').replace('\n---', '')) or {}

            old_score = frontmatter_data.get('impact_score', 0)
            if abs(old_score - exp.impact_score) < 0.01 and frontmatter_data.get('backlinks') == exp.backlinks:
                continue  # 无变化，跳过

            frontmatter_data['impact_score'] = round(exp.impact_score, 2)
            frontmatter_data['backlinks'] = exp.backlinks
            frontmatter_data['referenced_weight'] = round(exp.referenced_weight, 2)
            frontmatter_data['last_impact_update'] = now

            new_frontmatter = '---\n' + yaml.dump(frontmatter_data, default_flow_style=False, allow_unicode=True) + '---'
            new_content = content.replace(old_frontmatter, new_frontmatter, 1)

            if CONFIG.dry_run:
                print(f"  - {exp.id}: impact {old_score:.1f} -> {exp.impact_score:.1f}")
            else:
                with open(exp.file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                updated_count += 1

        except Exception as e:
            print(f"  警告：更新 frontmatter 失败 {exp.file_path}: {e}")

    if not CONFIG.dry_run:
        print(f"已更新 {updated_count} 个文件")


def categorize_experiences(experiences: Dict[str, Experience]) -> Dict[str, List[Experience]]:
    """分类经验"""
    categories = {
        'skills': [],
        'principles': [],
        'models': [],
    }

    for exp in experiences.values():
        tags_str = ' '.join(exp.tags).lower()
        if 'skill' in tags_str or '技巧' in tags_str:
            categories['skills'].append(exp)
        elif 'principle' in tags_str or '原则' in tags_str:
            categories['principles'].append(exp)
        elif 'model' in tags_str or '模型' in tags_str:
            categories['models'].append(exp)

    return categories


def generate_index_map(experiences: Dict[str, Experience], categories: Dict[str, List[Experience]]) -> str:
    """生成索引地图内容"""
    now = datetime.now().isoformat() + 'Z'
    now_date = now[:10]

    skills = sorted(categories['skills'], key=lambda x: x.impact_score, reverse=True)[:20]
    principles = sorted(categories['principles'], key=lambda x: x.impact_score, reverse=True)[:20]
    models = sorted(categories['models'], key=lambda x: x.impact_score, reverse=True)[:20]

    total = len(experiences)
    max_impact = max([exp.impact_score for exp in experiences.values()]) if experiences else 0
    avg_impact = sum([exp.impact_score for exp in experiences.values()]) / total if experiences else 0

    experiences_count = sum(1 for exp in experiences.values() if exp.type == 'experience')
    others_count = sum(1 for exp in experiences.values()
                      if exp.type not in ['preference', 'workflow', 'solution', 'knowledge', 'convention', 'style', 'experience'])
    def generate_table(exps: List[Experience]) -> str:
        """生成表格内容"""
        if not exps:
            return "| - | - | - | - | - | - | - | - |\n"
        return "\n".join([
            f"| {i} | `{exp.id}` | [[{exp.id}]] | {exp.type} | {exp.impact_score:.1f} | {exp.usage_count} | {exp.confidence:.1f} | {exp.backlinks} |"
            for i, exp in enumerate(exps, 1)
        ]) + "\n"

    # 生成 Markdown（使用模板）
    return f"""---
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

        IM --> EL
        IM --> PF
        IM --> WF
        IM --> SO
        IM --> KN
        IM --> CV

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

> 展示影响力最大的前 20 条技巧

| 排名 | 技巧名称 | 来源 | 应用场景 | 影响力 | 使用次数 | 置信度 | 反向链接 |
|------|---------|------|---------|--------|---------|--------|---------|
{generate_table(skills)}
**影响力计算公式**：`usage_count * {CONFIG.usage_weight} + confidence * {CONFIG.confidence_weight} + backlinks * {CONFIG.backlink_weight} + referenced_weight`

---

## 📜 原则列表

> 展示影响力最大的前 20 条原则

| 排名 | 原则名称 | 来源 | 适用范围 | 影响力 | 使用次数 | 置信度 | 反向链接 |
|------|---------|------|---------|--------|---------|--------|---------|
{generate_table(principles)}
**影响力计算公式**：`usage_count * {CONFIG.usage_weight} + confidence * {CONFIG.confidence_weight} + backlinks * {CONFIG.backlink_weight} + referenced_weight`

---

## 🧠 模型列表

> 展示影响力最大的前 20 条模型

| 排名 | 模型名称 | 来源 | 适用场景 | 影响力 | 使用次数 | 置信度 | 反向链接 |
|------|---------|------|---------|--------|---------|--------|---------|
{generate_table(models)}
**影响力计算公式**：`usage_count * {CONFIG.usage_weight} + confidence * {CONFIG.confidence_weight} + backlinks * {CONFIG.backlink_weight} + referenced_weight`

---

## 🔄 更新记录

- {now_date}: 自动更新影响力计算，{total} 条经验

---

## 📊 统计信息

- **总经验数**：{total}
- **技巧数**：{len(skills)}（展示前 20）
- **原则数**：{len(principles)}（展示前 20）
- **模型数**：{len(models)}（展示前 20）
- **经验日志**：{experiences_count}
- **其他类型**：{others_count}
- **最高影响力**：{max_impact:.1f}
- **平均影响力**：{avg_impact:.1f}
- **最近更新**：{now_date}

---

## 💡 使用指南

### 如何使用此地图
1. 使用 Obsidian 的"反向链接"面板查找相关经验
2. 浏览三个核心维度的列表发现新的关系
3. 创建新经验时更新对应表格

### 如何维护此地图
- 运行 `python3 scripts/maintain-experience-vault.py` 自动更新影响力
- 建议每周运行一次
"""


def identify_low_impact_experiences(experiences: Dict[str, Experience]) -> List[Experience]:
    """识别低影响力经验"""
    return sorted(
        [exp for exp in experiences.values() if not exp.is_new() and exp.impact_score < CONFIG.impact_threshold],
        key=lambda x: x.impact_score
    )


def print_statistics(experiences: Dict[str, Experience], categories: Dict[str, List[Experience]], low_impact: List[Experience]):
    """打印统计信息"""
    print("\n" + "=" * 60)
    print("统计信息")
    print("=" * 60)
    print(f"总经验数: {len(experiences)}")
    print(f"技巧: {len(categories['skills'])}")
    print(f"原则: {len(categories['principles'])}")
    print(f"模型: {len(categories['models'])}")

    if experiences:
        impacts = [exp.impact_score for exp in experiences.values()]
        print(f"最高影响力: {max(impacts):.1f}")
        print(f"平均影响力: {sum(impacts) / len(impacts):.1f}")

    print(f"低影响力经验: {len(low_impact)}")
    print()


def main():
    # 解析命令行参数
    args = parse_args()
    
    # 更新配置
    CONFIG.vault_path = args.vault_path
    CONFIG.dry_run = args.dry_run
    CONFIG.backup = args.backup

    vault_path = Path(CONFIG.vault_path)

    if not vault_path.exists():
        print(f"错误：Vault 路径不存在: {vault_path}")
        sys.exit(1)

    print("=" * 60)
    print("经验库维护脚本")
    print("=" * 60)
    print(f"Vault 路径: {vault_path}")
    print(f"影响力阈值: {CONFIG.impact_threshold}")
    print(f"新经验保护期: {CONFIG.new_experience_days} 天")
    if CONFIG.dry_run:
        print("模式: [DRY-RUN] 预览变更，不实际修改")
    if CONFIG.backup and not CONFIG.dry_run:
        print("模式: [BACKUP] 修改前备份")
    print()

    # 备份
    if CONFIG.backup and not CONFIG.dry_run:
        backup_vault(vault_path)

    print("扫描经验文件...")
    experiences = scan_experiences(vault_path)
    print(f"找到 {len(experiences)} 条经验")

    if not experiences:
        print("没有找到经验文件，退出")
        return

    print("\n构建引用关系...")
    reference_graph, backlink_graph = build_graphs(experiences)
    print(f"引用关系: {sum(len(refs) for refs in reference_graph.values())} 个")

    calculate_impact_scores(experiences, reference_graph)
    update_experience_frontmatter(experiences)
    categories = categorize_experiences(experiences)

    print("\n生成索引地图...")
    index_map_content = generate_index_map(experiences, categories)
    index_map_path = vault_path / "经验索引地图.md"
    
    if CONFIG.dry_run:
        print(f"[DRY-RUN] 将写入: {index_map_path}")
    else:
        with open(index_map_path, 'w', encoding='utf-8') as f:
            f.write(index_map_content)
        print(f"已更新: {index_map_path}")

    print("\n识别低影响力经验...")
    low_impact = identify_low_impact_experiences(experiences)
    if low_impact:
        print(f"发现 {len(low_impact)} 条低影响力经验:")
        for exp in low_impact[:10]:
            print(f"  - {exp.id}: {exp.impact_score:.1f} ({exp.type})")
        if len(low_impact) > 10:
            print(f"  ... 还有 {len(low_impact) - 10} 条")
    else:
        print("没有发现低影响力经验")

    print_statistics(experiences, categories, low_impact)
    
    if CONFIG.dry_run:
        print("\n[DRY-RUN] 完成！未实际修改任何文件。")
        print("移除 --dry-run 参数以实际执行变更。")
    else:
        print("完成！")


if __name__ == "__main__":
    main()