# 影响力计算逻辑

## 计算公式

```
影响力 = usage_count × 5 + confidence × 50 + backlinks × 10 + referenced_weight
```

**说明：**
- `usage_count × 5` - 使用频率贡献
- `confidence × 50` - 可靠性贡献
- `backlinks × 10` - 被引用程度贡献
- `referenced_weight` - 引用的重要经验的权重总和

其中：
- `backlinks` - 被其他经验引用的次数
- `referenced_weight` - 引用的重要经验的权重总和

## referenced_weight 计算

```
referenced_weight = Σ (被引用经验的影响力 / 被引用经验的引用数)
```

**解释：**
- 如果一条经验引用了另一条经验，会获得被引用经验的影响力份额
- 份额 = 被引用经验的影响力 / 被引用经验被引用的总次数
- 这样可以避免循环引用导致的影响力无限增长

## 迭代计算

由于 `referenced_weight` 依赖于其他经验的影响力，影响力需要迭代计算：

1. **初始计算**：使用基础公式计算初始影响力
2. **迭代更新**：根据新的影响力重新计算 `referenced_weight`
3. **收敛判断**：当所有经验的影响力变化小于阈值（1 分）时停止
4. **最大迭代次数**：10 次

## 应用场景

- **排序和展示**：在索引地图中按影响力降序展示，只展示前 20 条
- **经验清理**：定期清理影响力低于阈值（30 分）的过时经验（新经验 30 天内保护）
- **经验推荐**：优先推荐高影响力的经验给用户

## Frontmatter 字段

```yaml
---
id: exp_preference_20260311_140000_1
type: preference
confidence: 0.8
usage_count: 10
impact_score: 120          # 总影响力
backlinks: 3               # 反向链接数
referenced_weight: 0       # 引用权重
last_impact_update: 2026-03-11T23:00:00Z
---
```