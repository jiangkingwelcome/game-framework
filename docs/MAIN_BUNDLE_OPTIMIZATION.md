# 主包体积优化指南

> 创建日期：2025年12月5日
> 适用项目：麻将游戏（基于 Oops Framework）

## 📋 目录

1. [当前问题分析](#当前问题分析)
2. [需要修改的文件](#需要修改的文件)
3. [具体修改方案](#具体修改方案)
4. [后续开发注意事项](#后续开发注意事项)

---

## 当前问题分析

### ❌ 问题1：SingletonModuleComp 直接引用 Battle

**文件位置**：`assets/script/game/common/SingletonModuleComp.ts`

**当前代码**：
```typescript
import { Battle } from "../battle/Battle";

export class SingletonModuleComp extends ecs.Comp {
    battle: Battle = null!;  // ← 这会把 Battle 及其所有依赖打入主包！
}
```

**问题原因**：
- TypeScript 的 import 会在编译时建立依赖关系
- 即使 `battle` 属性运行时是 `null`，Battle 类及其依赖的所有模块都会被打入主包
- Battle 模块可能引用了麻将逻辑、3D模型加载器等大量代码

---

### ❌ 问题2：Main.ts 引用路径不规范

**文件位置**：`assets/script/Main.ts`

**当前代码**：
```typescript
import { oops } from '../../extensions/oops-plugin-framework/assets/core/Oops';
import { Root } from '../../extensions/oops-plugin-framework/assets/core/Root';
import { ecs } from '../../extensions/oops-plugin-framework/assets/libs/ecs/ECS';
```

**建议改为**：
```typescript
import { oops } from 'db://oops-framework/core/Oops';
import { Root } from 'db://oops-framework/core/Root';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
```

**原因**：使用 `db://` 协议是 Cocos Creator 推荐的插件引用方式，更规范且不会因路径变化而出错。

---

## 需要修改的文件

| 文件 | 优先级 | 修改内容 |
|------|--------|----------|
| `SingletonModuleComp.ts` | 🔴 高 | 移除 Battle 的直接 import |
| `Main.ts` | 🟡 中 | 统一使用 db:// 协议引用框架 |
| `GameUIConfig.ts` | 🟢 低 | 拆分主包/分包 UI 配置（可选） |

---

## 具体修改方案

### 方案1：修改 SingletonModuleComp.ts

```typescript
/*
 * @Author: dgflash
 * @Date: 2021-11-18 14:20:46
 * @LastEditors: [你的名字]
 * @LastEditTime: 2025-12-05
 */

import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { Account } from "../account/Account";
import { Initialize } from "../initialize/Initialize";
// ❌ 删除这行：import { Battle } from "../battle/Battle";

/** 游戏单例业务模块 */
@ecs.register('SingletonModule')
export class SingletonModuleComp extends ecs.Comp {
    /** 游戏初始化模块 */
    initialize: Initialize = null!;
    
    /** 游戏账号模块 */
    account: Account = null!;
    
    /** 
     * 游戏战斗模块
     * 使用 any 类型避免编译时依赖，Battle 在 bundle 加载后动态赋值
     * 
     * @example
     * // 在 bundle 加载完成后
     * import { Battle } from "../battle/Battle";
     * smc.battle = ecs.getEntity<Battle>(Battle);
     */
    battle: any = null;

    reset() { }
}

export var smc: SingletonModuleComp = ecs.getSingleton(SingletonModuleComp);
```

---

### 方案2：修改 Main.ts 的 import 路径

```typescript
/*
 * @Author: dgflash
 * @Date: 2021-07-03 16:13:17
 * @LastEditors: [你的名字]
 * @LastEditTime: 2025-12-05
 */
import { _decorator, Camera, Color, director, screen, view } from 'cc';
import { DEBUG } from 'cc/env';

// ✅ 使用 db:// 协议引用框架（推荐）
import { oops } from 'db://oops-framework/core/Oops';
import { Root } from 'db://oops-framework/core/Root';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';

// 游戏模块
import { Account } from './game/account/Account';
import { GlobalMask } from './game/common/GlobalMask';
import { smc } from './game/common/SingletonModuleComp';
import { UIConfigData } from './game/common/config/GameUIConfig';
import { FGUIManager } from './game/FGUIManager';
import { LayerFgui } from './game/gui/LayerFgui';
import { Initialize } from './game/initialize/Initialize';

// ...existing code...
```

---

### 方案3：Battle 模块的正确加载方式

在 bundle 加载完成后（例如 LoadingViewComp.ts 中）初始化 Battle：

```typescript
// 在 LoadingViewComp.ts 或其他合适的位置

import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { smc } from "../common/SingletonModuleComp";

// 动态导入 Battle（仅在需要时）
async function initBattleModule() {
    // 方式1：如果 Battle 在 bundle 中，先加载 bundle
    // await oops.res.loadBundle("bundle_battle");
    
    // 方式2：动态导入
    const { Battle } = await import("../battle/Battle");
    
    // 创建 Battle 实体并赋值给 smc
    smc.battle = ecs.getEntity<Battle>(Battle);
    
    console.log('[LoadingViewComp] Battle module initialized');
}
```

**或者使用同步方式**（如果 Battle 脚本在主包但资源在分包）：

```typescript
// LoadingViewComp.ts
import { Battle } from "../battle/Battle";  // 如果脚本必须在主包

// 在资源加载完成后
private onBundleLoaded() {
    smc.battle = ecs.getEntity<Battle>(Battle);
}
```

---

### 方案4：GameUIConfig.ts 拆分（可选优化）

如果未来有大量 UI 配置，可以考虑拆分：

```typescript
// GameUIConfig.ts - 主包必需的 UI
import { LayerType } from "db://oops-framework/core/gui/layer/LayerEnum";
import { UIConfig } from "db://oops-framework/core/gui/layer/UIConfig";

/** 界面唯一标识 */
export enum UIID {
    // === 主包 UI（启动必需）===
    Alert = 1,
    Confirm = 2,
    Loading = 3,
    
    // === 战斗 UI（分包加载）===
    BattleMain = 100,
    BattleResult = 101,
    BattleChat = 102,
}

/** 主包 UI 配置 */
export var UIConfigData: { [key: number]: UIConfig } = {
    [UIID.Alert]: { layer: LayerType.Dialog, prefab: "common/prefab/alert" },
    [UIID.Confirm]: { layer: LayerType.Dialog, prefab: "common/prefab/confirm" },
};

/** 
 * 战斗 UI 配置 - 在 bundle 加载后注册
 * 调用方式：Object.assign(UIConfigData, BattleUIConfig);
 */
export var BattleUIConfig: { [key: number]: UIConfig } = {
    [UIID.BattleMain]: { layer: LayerType.UI, prefab: "battle/prefab/main", bundle: "bundle_battle" },
    [UIID.BattleResult]: { layer: LayerType.PopUp, prefab: "battle/prefab/result", bundle: "bundle_battle" },
};
```

---

## 后续开发注意事项

### ✅ 应该做的

1. **新模块使用延迟加载模式**
   ```typescript
   // 大模块使用 any 类型声明
   public static room: any = null;
   
   // 在需要时动态加载
   const { Room } = await import("../room/Room");
   smc.room = ecs.getEntity<Room>(Room);
   ```

2. **资源放在正确的 bundle 中**
   - 麻将牌贴图 → `bundle_battle`
   - 3D 模型 → `bundle_battle`
   - 战斗音效 → `bundle_battle`
   - 启动必需资源 → `resources`

3. **使用 bundle 配置指定资源包**
   ```typescript
   { layer: LayerType.UI, prefab: "xxx", bundle: "bundle_battle" }
   ```

4. **定期检查主包体积**
   - 构建后查看 `build/web-mobile/assets/main.js` 大小
   - 使用 Cocos Creator 的「构建报告」功能

### ❌ 不应该做的

1. **不要在主包模块中直接 import 分包模块的类型**
   ```typescript
   // ❌ 错误
   import { MahjongTile } from "../battle/MahjongTile";
   
   // ✅ 正确
   let tile: any = null;
   ```

2. **不要在 SingletonModuleComp 中添加大模块的强类型引用**

3. **不要把大型 JSON 配置放在 resources 根目录**
   ```
   ❌ resources/config/all_cards.json (500KB)
   ✅ bundle_battle/config/all_cards.json
   ```

4. **不要在 Main.ts 中引用战斗相关模块**

---

## 检查清单

在每次发版前，请检查以下项目：

- [ ] `SingletonModuleComp.ts` 没有 import 大模块（Battle、Room 等）
- [ ] `Main.ts` 只引用启动必需的模块
- [ ] 大型资源（图片、音效、模型）都在分包中
- [ ] `GameUIConfig.ts` 中的战斗 UI 指定了正确的 bundle
- [ ] 构建后主包 JS 文件大小在合理范围内（建议 < 500KB）

---

## 参考链接

- [Cocos Creator 资源分包](https://docs.cocos.com/creator/manual/zh/asset/bundle.html)
- [Oops Framework 文档](https://dgflash.gitee.io/oops-plugin-framework-doc/)