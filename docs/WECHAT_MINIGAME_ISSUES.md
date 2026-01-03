# 微信小游戏适配问题分析报告

> 创建日期：2025年12月6日
> 项目：麻将游戏（基于 Oops Framework + Cocos Creator 3.8.7）
> 分析范围：主包分包、资源加载、性能优化、微信平台兼容性

---

## 📊 项目概况

### 资源分布统计

| 目录 | 大小 | 说明 |
|------|------|------|
| `assets/bundle/` | 9.4 MB | **分包资源** - 战斗场景、UI、配置 |
| `assets/resources/` | 3.1 MB | **主包资源** - 启动必需资源 |
| `assets/script/` | 531 KB | **脚本代码** - 游戏逻辑 |

### 现有配置

- **微信小游戏配置**: `build-templates/wechatgame/game.json`
- **分包配置**: `subpackages: []` ⚠️ **当前为空数组**
- **Bundle 配置**: `assets/bundle/` 已按模块划分（battle、common、config、gui、game）

---

## 🚨 严重问题（必须修复）

### ❌ 问题1：主包代码依赖泄漏（已记录）

**文件**: `assets/script/game/common/SingletonModuleComp.ts:10`

```typescript
import { Battle } from "../battle/Battle";  // ← 这会把整个 Battle 模块打入主包！

export class SingletonModuleComp extends ecs.Comp {
    battle: Battle = null!;  // 强类型引用
}
```

**影响**:
- Battle 及其所有依赖（19个文件，包括 5 个 System、8 个 View、4 个 Tile 管理器）全部被打入主包
- 估计增加主包体积 **200-300 KB**（编译后）
- 违反了分包设计原则

**解决方案**: 已在 `MAIN_BUNDLE_OPTIMIZATION.md` 中详细说明

---

### ❌ 问题2：微信小游戏分包配置缺失

**文件**: `build-templates/wechatgame/game.json:10`

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": { ... },
  "subpackages": []  // ← 空数组，分包未生效！
}
```

**后果**:
- 尽管 Cocos Creator 项目中已配置 bundle，但微信小游戏发布时**没有真正分包**
- 所有资源仍在主包中，导致首次加载时间过长
- 超过 4MB 主包限制（微信小游戏推荐主包 < 4MB）

**正确配置**（需要在 Cocos Creator 构建发布面板中配置）:

```json
{
  "deviceOrientation": "portrait",
  "showStatusBar": false,
  "networkTimeout": {
    "request": 10000,
    "connectSocket": 10000,
    "uploadFile": 10000,
    "downloadFile": 10000
  },
  "subpackages": [
    {
      "name": "bundle",
      "root": "bundle/"
    }
  ]
}
```

---

### ❌ 问题3：resources 文件夹资源过大

**资源清单**:
- `assets/resources/` = 3.1 MB（会全部打入主包）
- `assets/resources/loading_bg.jpg` - 启动背景图（大小未知，建议检查）
- `assets/resources/config.json` - 配置文件（3KB，可接受）

**问题分析**:
- `resources/` 中的资源**全部强制打入主包**，无法分包
- 如果 `loading_bg.jpg` 过大（> 500KB），会严重影响启动速度
- 微信小游戏主包限制 **2MB**（代码） + **4MB**（资源），当前可能接近或超标

**建议优化**:
1. 检查 `loading_bg.jpg` 大小，如果 > 200KB，考虑：
   - 压缩图片质量（JPEG 质量 70-80）
   - 缩小分辨率（按屏幕 DPI 计算最小尺寸）
   - 使用渐进式 JPEG
2. 将非启动必需资源移到 `bundle/` 中
3. 使用纯色背景 + 简单 Logo，延迟加载精美背景

---

## ⚠️ 重要问题（建议修复）

### ⚠️ 问题4：框架引用路径不规范

**文件**: `assets/script/Main.ts:9-11`

```typescript
// ❌ 使用相对路径引用插件
import { oops } from '../../extensions/oops-plugin-framework/assets/core/Oops';
import { Root } from '../../extensions/oops-plugin-framework/assets/core/Root';
import { ecs } from '../../extensions/oops-plugin-framework/assets/libs/ecs/ECS';
```

**问题**:
- 相对路径可能因目录结构变化而失效
- 不符合 Cocos Creator 插件引用规范

**建议改为**:

```typescript
// ✅ 使用 db:// 协议（Cocos Creator 推荐）
import { oops } from 'db://oops-framework/core/Oops';
import { Root } from 'db://oops-framework/core/Root';
import { ecs } from 'db://oops-framework/libs/ecs/ECS';
```

---

### ⚠️ 问题5：Battle 模块在 Loading 阶段被加载

**文件**: `assets/script/game/initialize/view/LoadingViewComp.ts:13-14`

```typescript
import { BattleViewComp } from "../../battle/view/BattleViewComp";
import { Battle } from "../../battle/Battle";
```

**影响**:
- `LoadingViewComp` 是启动界面，会在游戏开始时立即加载
- 这导致 Battle 模块被提前引入，增加主包体积
- 即使后续在 `enter()` 中才创建 Battle 实体，import 本身已建立依赖关系

**解决方案**:

```typescript
// 方案1：动态导入（推荐）
async function loadBattleModule() {
    const { Battle } = await import("../../battle/Battle");
    smc.battle = ecs.getEntity<Battle>(Battle);
}

// 方案2：使用类型注释而非 import
// battle: any = null;  // 在 SingletonModuleComp 中
```

---

### ⚠️ 问题6：bundle 加载逻辑缺失验证

**分析**:
- 项目配置了 `config.json` 中的 `bundle.default = "bundle"`
- `assets/bundle/` 目录结构完整，包含 battle、common、config、gui 等子包
- 但未在代码中找到显式的 bundle 加载逻辑验证

**建议验证点**:
1. 在 `InitRes.ts` 中是否正确调用了 `oops.res.loadBundle("bundle")`？
2. Battle 模块的资源是否指定了正确的 bundle 路径？
3. GameUIConfig 中的 UI 配置是否声明了 bundle 参数？

**示例代码**（需要在 InitRes 中添加）:

```typescript
// InitRes.ts
async loadBundleResources() {
    // 加载 bundle 分包
    await oops.res.loadBundle("bundle");
    console.log("[InitRes] Bundle loaded");

    // 从 bundle 中加载资源
    const prefab = await oops.res.loadAsync("battle/prefabs/Cube", Prefab, "bundle");
}
```

---

## 💡 性能优化建议

### 优化1：资源压缩配置

**微信小游戏要求**:
- 主包 < 4MB（建议 < 2MB）
- 分包总大小 < 20MB
- 单个分包 < 4MB

**当前风险**:
- `assets/bundle/` = 9.4 MB，需要拆分为多个分包
- 建议按功能模块拆分：
  - `bundle-battle` (战斗场景) ~ 5 MB
  - `bundle-ui` (UI 资源) ~ 2 MB
  - `bundle-common` (公共资源) ~ 2 MB

**Cocos Creator 构建配置**:

```
构建发布 → 微信小游戏
├─ 初始场景分包: 是
├─ 资源服务器地址: [可选，用于远程加载]
└─ 分包配置:
   ├─ bundle-battle (assets/bundle/battle)
   ├─ bundle-ui (assets/bundle/gui)
   └─ bundle-common (assets/bundle/common)
```

---

### 优化2：纹理压缩

**检查项**:
- `assets/bundle/battle/textures/mahjong.jpg` - 麻将贴图（建议使用压缩纹理格式）
- `assets/bundle/battle/textures/bg_battle.png` - 背景图（建议使用 ASTC 或 ETC2）

**微信小游戏推荐格式**:
- iOS: ASTC 4x4 或 PVRTC 4bpp
- Android: ETC2 或 ASTC 4x4
- Fallback: PNG8（256 色）或 JPEG（有损压缩）

**配置方式**:
Cocos Creator → 资源管理器 → 选择图片 → 属性检查器 → 纹理压缩

---

### 优化3：代码分割和延迟加载

**当前问题**:
- 所有脚本在启动时加载
- Battle 模块 19 个文件全部在主包中

**建议策略**:

```typescript
// 按需加载模块
class GameModuleLoader {
    private static loadedModules = new Set<string>();

    static async loadBattleModule() {
        if (this.loadedModules.has('battle')) return;

        // 1. 加载 bundle
        await oops.res.loadBundle("bundle-battle");

        // 2. 动态导入代码
        const { Battle } = await import("../battle/Battle");
        smc.battle = ecs.getEntity<Battle>(Battle);

        this.loadedModules.add('battle');
        console.log('[GameModuleLoader] Battle module loaded');
    }
}
```

---

## 🔍 兼容性检查

### 检查1：WebSocket 配置

**当前配置**（`config.json`）:
```json
"webSocketServer": "ws://127.0.0.1:8080"  // dev
"webSocketServer": "wss://127.0.0.1:8081"  // test
"webSocketServer": "wss://127.0.0.1:8082"  // prod
```

**微信小游戏要求**:
- ✅ 生产环境必须使用 `wss://`（已满足）
- ⚠️ 域名必须在微信公众平台配置白名单
- ⚠️ 开发环境的 `ws://` 可能在真机调试时无法使用

---

### 检查2：本地存储加密

**当前配置**（`config.json`）:
```json
"localDataKey": "oops",
"localDataIv": "framework"
```

**风险**:
- 密钥过于简单，容易被破解
- 微信小游戏的 `wx.setStorage` 有 10MB 限制

**建议**:
- 使用更复杂的密钥（至少 16 位随机字符串）
- 敏感数据（用户 Token、支付信息）额外加密

---

### 检查3：屏幕适配

**当前实现**（`Main.ts:97-118`）:
```typescript
private setPortraitOrientation() {
    // 强制竖屏
    if (winSize.width > winSize.height) {
        view.setOrientation(0); // PORTRAIT = 0
    }
}
```

**微信小游戏注意事项**:
- ✅ `game.json` 已设置 `"deviceOrientation": "portrait"`（正确）
- ⚠️ 需要处理刘海屏和安全区域（`mobileSafeArea: false`）

**建议启用安全区域**:
```json
// config.json
"mobileSafeArea": true  // 改为 true
```

---

## 📋 修复优先级清单

### 🔴 高优先级（必须修复）

- [ ] **修复 SingletonModuleComp.ts** - 移除 Battle 的直接 import（见 `MAIN_BUNDLE_OPTIMIZATION.md`）
- [ ] **配置微信小游戏分包** - 在 Cocos Creator 构建发布时配置 subpackages
- [ ] **优化 resources 目录** - 检查并压缩 `loading_bg.jpg`
- [ ] **添加 bundle 加载逻辑验证** - 确保分包资源正确加载

### 🟡 中优先级（建议修复）

- [ ] **修改 Main.ts 引用路径** - 使用 `db://` 协议
- [ ] **修复 LoadingViewComp.ts** - 延迟加载 Battle 模块
- [ ] **拆分 bundle** - 将 9.4MB 的 bundle 拆分为多个分包（每个 < 4MB）
- [ ] **启用移动端安全区域** - `mobileSafeArea: true`

### 🟢 低优先级（性能优化）

- [ ] **纹理压缩** - 所有图片启用压缩格式（ASTC/ETC2）
- [ ] **更换加密密钥** - 使用更安全的 localDataKey/Iv
- [ ] **代码分割** - 实现模块动态加载机制
- [ ] **资源预加载策略** - 优化 Loading 界面的资源加载顺序

---

## 🛠️ 测试验证步骤

### 1. 主包体积检查

```bash
# 构建后检查主包大小
cd build/wechatgame
du -sh game.js         # 主包代码
du -sh assets/         # 主包资源
du -sh subpackages/    # 分包资源
```

**标准**:
- `game.js` < 2 MB
- `assets/` < 2 MB
- 总主包 < 4 MB

---

### 2. 分包加载测试

在微信开发者工具中：
1. 打开"调试器" → "Network"
2. 刷新游戏
3. 观察资源加载顺序：
   - 主包资源应立即加载
   - 分包资源应在 Loading 界面显示后加载
   - Battle 场景资源应在进入战斗时加载

---

### 3. 性能测试

在真机调试模式下：
- [ ] 启动时间 < 3 秒（从点击图标到显示 Loading）
- [ ] Loading 时间 < 5 秒（主包 + 首个分包加载完成）
- [ ] 内存占用 < 150 MB（iOS）/ < 200 MB（Android）
- [ ] FPS ≥ 30（战斗场景，中低端机型）

---

## 📚 参考资料

- [微信小游戏分包加载](https://developers.weixin.qq.com/minigame/dev/guide/base-ability/sub-packages.html)
- [Cocos Creator 资源分包](https://docs.cocos.com/creator/manual/zh/asset/bundle.html)
- [Cocos Creator 纹理压缩](https://docs.cocos.com/creator/manual/zh/asset/compress-texture.html)
- [Oops Framework 文档](https://dgflash.gitee.io/oops-plugin-framework-doc/)

---

## 📝 修改记录

| 日期 | 修改人 | 修改内容 |
|------|--------|----------|
| 2025-12-06 | Claude | 创建文档，完成初步分析 |

