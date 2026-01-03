# 项目框架结构分析

> 作者: jiangking
> 日期: 2025-12-10
> 项目: Mjddp 麻将消消乐

---

## 目录

1. [架构概览](#1-架构概览)
2. [ECS 架构实现](#2-ecs-架构实现)
3. [模块组织方式](#3-模块组织方式)
4. [框架核心文件](#4-框架核心文件)
5. [Oops Framework 使用](#5-oops-framework-使用)
6. [GUI 层级系统](#6-gui-层级系统)
7. [FairyGUI 集成](#7-fairygui-集成)
8. [资源加载流程](#8-资源加载流程)
9. [启动流程详解](#9-启动流程详解)
10. [最佳实践](#10-最佳实践)
11. [扩展指南](#11-扩展指南)

---

## 1. 架构概览

项目采用 **ECS (Entity-Component-System) + MVC** 混合架构，基于 **Oops Framework** 构建。

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Cocos Creator | 3.8.7 | 游戏引擎 |
| Oops Framework | - | ECS 框架 |
| FairyGUI | ccc3.0 | UI 框架 |
| TypeScript | - | 开发语言 |

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      Main.ts (启动入口)                       │
├─────────────────────────────────────────────────────────────┤
│                 SingletonModuleComp (全局管理)                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Initialize  │   Account    │    Battle    │   (其他模块)    │
│   (初始化)    │   (账号)     │   (战斗)     │                │
├──────────────┴──────────────┴──────────────┴────────────────┤
│                    Oops Framework                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │   ECS   │ │   GUI   │ │   Res   │ │  Audio  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│                   Cocos Creator 3.8.7                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. ECS 架构实现

### 2.1 核心概念

| 概念 | 说明 | 项目示例 |
|------|------|----------|
| **Entity** | 游戏实体/模块 | Battle, Account, Initialize |
| **Component** | 数据组件 | BattleModelComp, AccountModelComp |
| **System** | 业务逻辑系统 | BattleStartSystem, BattleSelectSystem |

### 2.2 实体定义

```typescript
// assets/script/game/battle/Battle.ts
@ecs.register('Battle')
export class Battle extends CCEntity {
    // 数据组件声明
    BattleModel!: BattleModelComp;

    protected init() {
        // 添加数据组件
        this.addComponents<ecs.Comp>(BattleModelComp);
    }
}
```

### 2.3 数据组件

```typescript
// assets/script/game/battle/model/BattleModelComp.ts
@ecs.register('BattleModel')
export class BattleModelComp extends ecs.Comp {
    // 游戏状态
    gameStatus: GameStatus = GameStatus.Idle;

    // 当前关卡
    currentLevel: number = 0;

    // 对象池
    tileNodePool: NodePool = new NodePool();

    // 重置方法
    reset() {
        this.gameStatus = GameStatus.Idle;
        this.currentLevel = 0;
    }
}
```

### 2.4 业务系统

```typescript
// assets/script/game/battle/bll/BattleStartSystem.ts
@ecs.register('BattleStart')
export class BattleStartSystem extends ecs.ComblockSystem {
    // 系统监控的组件
    filter(): ecs.IMatcher {
        return ecs.allOf(BattleModelComp);
    }

    // 实体进入时触发
    entityEnter(entity: Battle): void {
        // 启动游戏逻辑
    }

    // 每帧更新
    update(entity: Battle): void {
        // 持续更新逻辑
    }
}
```

### 2.5 ECS 工作流程

```
1. Entity 创建
   └── ecs.getEntity<Battle>(Battle)

2. Component 添加
   └── entity.addComponents(BattleModelComp)

3. System 激活
   └── 自动匹配 filter() 条件

4. 生命周期
   └── entityEnter → update → entityRemove
```

---

## 3. 模块组织方式

### 3.1 目录结构

```
assets/script/game/
├── Main.ts                    # 启动入口
├── FGUIManager.ts             # FairyGUI 管理器
│
├── common/                    # 公共模块
│   ├── config/
│   │   ├── GameEvent.ts       # 游戏事件定义
│   │   ├── GameUIConfig.ts    # UI 配置
│   │   └── GameStorageConfig.ts
│   ├── table/                 # Excel 数据表
│   ├── debug/                 # 调试工具
│   ├── examples/              # 示例代码
│   ├── SingletonModuleComp.ts # 全局模块管理
│   └── GlobalMask.ts          # 启动遮罩
│
├── initialize/                # 初始化模块
│   ├── Initialize.ts          # Entity
│   ├── bll/
│   │   └── InitRes.ts         # 资源加载 System
│   └── view/
│       ├── LoadingViewComp.ts # Loading UI
│       └── LoadingViewFGUI.ts # FairyGUI Loading
│
├── account/                   # 账号模块
│   ├── Account.ts             # Entity
│   ├── model/
│   │   └── AccountModelComp.ts
│   └── view/
│       └── DemoViewComp.ts
│
├── battle/                    # 战斗模块
│   ├── Battle.ts              # Entity
│   ├── model/
│   │   └── BattleModelComp.ts # 数据组件
│   ├── bll/                   # 业务系统
│   │   ├── BattleStartSystem.ts
│   │   ├── BattleRoundSystem.ts
│   │   ├── BattleSelectSystem.ts
│   │   ├── BattlePlayerSystem.ts
│   │   └── BattleEndSystem.ts
│   ├── view/                  # UI 视图
│   │   ├── BattleViewComp.ts
│   │   ├── BattleSceneSetup.ts
│   │   ├── BattleInputHandler.ts
│   │   ├── SelectBar3D.ts
│   │   └── ...
│   ├── tile/                  # 麻将牌管理
│   │   ├── TileManager.ts
│   │   ├── TileGroup.ts
│   │   ├── TileMesh.ts
│   │   └── TileSpawner.ts
│   └── config/                # 战斗配置
│       ├── Levels.ts
│       └── TileConfig.ts
│
└── gui/                       # GUI 扩展
    └── LayerFgui.ts           # FairyGUI 专用层
```

### 3.2 模块标准结构

每个游戏模块遵循以下结构：

```
module_name/
├── ModuleName.ts        # Entity 定义
├── model/
│   └── ModuleModelComp.ts   # 数据组件
├── bll/
│   └── ModuleSystem.ts      # 业务系统
└── view/
    └── ModuleViewComp.ts    # UI 视图
```

---

## 4. 框架核心文件

### 4.1 Main.ts - 启动入口

**位置**: `assets/script/Main.ts`

**职责**:
- 继承 Oops Framework 的 Root 类
- 初始化 UICamera 和 GlobalMask
- 注册自定义 GUI 层
- 创建游戏模块实体

```typescript
@ccclass('Main')
export class Main extends Root {
    onLoad() {
        super.onLoad();
        // 注册 FairyGUI 专用层
        oops.gui.registerLayerCls('Fgui', LayerFgui);
        // 初始化 UICamera
        this.initUICamera();
    }

    start() {
        // 启动黑屏遮罩
        GlobalMask.instance.init(true);
        // 初始化 FairyGUI
        FGUIManager.instance.init();
    }

    protected run() {
        // 创建核心模块
        smc.initialize = ecs.getEntity<Initialize>(Initialize);
        smc.account = ecs.getEntity<Account>(Account);
        // Battle 延迟创建（在 Loading 完成后）
    }

    private initUICamera() {
        // UICamera 初始设为 SOLID_COLOR (黑色)
        // Loading 完成后切换为 DEPTH_ONLY
    }
}
```

### 4.2 SingletonModuleComp.ts - 全局模块管理

**位置**: `assets/script/game/common/SingletonModuleComp.ts`

**职责**:
- 管理所有游戏模块的全局访问
- 提供 `smc` 单例对象

```typescript
@ecs.register('SingletonModule')
export class SingletonModuleComp extends ecs.Comp {
    initialize: Initialize = null!;
    account: Account = null!;
    battle: Battle = null!;
}

// 全局单例
export var smc: SingletonModuleComp = ecs.getSingleton(SingletonModuleComp);
```

**使用方式**:

```typescript
import { smc } from "../common/SingletonModuleComp";

// 任意位置访问模块
smc.battle.BattleModel.currentLevel;
smc.account.AccountModel.userId;
```

### 4.3 GlobalMask.ts - 启动遮罩

**位置**: `assets/script/game/common/GlobalMask.ts`

**职责**:
- 启动时显示黑屏遮罩
- 实现场景切换过渡效果
- 避免加载过程中的视觉闪烁

```typescript
// 初始化（显示黑屏）
GlobalMask.instance.init(true);

// 隐藏遮罩
GlobalMask.instance.hide(0);

// 场景切换过渡
GlobalMask.instance.transition(() => {
    // 切换逻辑
}, fadeInDuration, fadeOutDuration);
```

---

## 5. Oops Framework 使用

### 5.1 导入约定

```typescript
// 框架核心（db:// 协议）
import { oops } from "db://oops-framework/core/Oops";
import { ecs } from "db://oops-framework/libs/ecs/ECS";
import { gui } from "db://oops-framework/core/gui/Gui";

// 游戏模块（相对路径）
import { smc } from "../common/SingletonModuleComp";
import { Battle } from "../battle/Battle";
```

### 5.2 核心 API

#### GUI 系统

```typescript
// 初始化
oops.gui.init(UIConfigData);

// 打开 UI
oops.gui.open(UIID.Alert);

// 关闭 UI
oops.gui.close(UIID.Alert);

// 获取 UI 根节点
oops.gui.root;

// 获取游戏根节点（3D 内容）
oops.game.root;
```

#### 资源系统

```typescript
// 加载目录
oops.res.loadDir("common", (err, assets) => {});

// 加载 Bundle
oops.res.loadBundle("bundle", (bundle) => {});

// 获取已加载的 Bundle
const bundle = oops.res.getBundle("bundle");

// 从 Bundle 加载资源
bundle.load("path/to/asset", AssetType, (err, asset) => {});
```

#### 多语言系统

```typescript
// 设置语言
oops.language.setLanguage("zh");

// 获取文本
const text = oops.language.getLangByID("loading_text");
```

#### 存储系统

```typescript
// 保存数据
oops.storage.set("key", value);

// 读取数据
const value = oops.storage.get("key");
```

#### 音频系统

```typescript
// 播放音效
oops.audio.playEffect("sound/click");

// 播放背景音乐
oops.audio.playMusic("music/bgm");
```

---

## 6. GUI 层级系统

### 6.1 层级配置

**配置文件**: `assets/resources/config.json`

```json
{
    "gui": [
        { "name": "LayerGame",   "type": "Game" },
        { "name": "LayerUI",     "type": "UI" },
        { "name": "LayerPopUp",  "type": "PopUp" },
        { "name": "LayerDialog", "type": "Dialog" },
        { "name": "LayerSystem", "type": "Dialog" },
        { "name": "LayerNotify", "type": "Notify" },
        { "name": "LayerGuide",  "type": "Node" },
        { "name": "LayerFgui",   "type": "Fgui" }
    ]
}
```

### 6.2 层级说明

| 层级 | 类型 | 用途 |
|------|------|------|
| LayerGame | Game | 游戏主内容层 |
| LayerUI | UI | 主 UI 界面 |
| LayerPopUp | PopUp | 弹出窗口 |
| LayerDialog | Dialog | 对话框 |
| LayerSystem | Dialog | 系统级对话框 |
| LayerNotify | Notify | 通知消息 |
| LayerGuide | Node | 新手引导 |
| LayerFgui | Fgui | FairyGUI 专用层 |

### 6.3 双相机系统

```
场景结构:
root/
├── Main Light
└── game/                      # 3D 游戏内容
    ├── Camera/
    │   ├── MainCamera         # 3D 相机 (priority=0)
    │   └── Background
    └── World/
└── gui/                       # UI 内容
    ├── UICamera               # UI 相机 (priority=1073741824)
    └── Layer*/                # 各 UI 层
```

**相机配置**:

| 相机 | Priority | ClearFlags | Visibility |
|------|----------|------------|------------|
| MainCamera | 0 | SOLID_COLOR | DEFAULT |
| UICamera | 1073741824 | DEPTH_ONLY | UI_2D |

**渲染流程**:
1. MainCamera 先渲染 3D 场景
2. UICamera 后渲染 UI（DEPTH_ONLY 保留 3D 内容）

---

## 7. FairyGUI 集成

### 7.1 FGUIManager

**位置**: `assets/script/game/FGUIManager.ts`

```typescript
// 获取管理器实例
FGUIManager.instance;

// 初始化
FGUIManager.instance.init();

// 加载 UI 包
await FGUIManager.instance.loadPackageAsync('Battle');

// 创建 UI
const ui = FGUIManager.instance.createUI('Battle', 'BattleView');

// 显示 UI
FGUIManager.instance.showUI(ui);

// 隐藏 UI
FGUIManager.instance.hideUI(ui);
```

### 7.2 资源目录

```
assets/bundle/gui/fgui/
├── Battle/
│   ├── Battle              # FairyGUI 包
│   └── Battle_atlas0       # 图集
├── Loading/
│   └── Loading
└── Common/
    └── Common
```

### 7.3 GRoot 配置

```typescript
// FGUIManager.init() 中
this._groot = new fgui.GRoot();
this._groot.opaque = false;  // 不阻挡 3D 场景点击

// 挂载到 LayerFgui
const layerFgui = uiRoot.getChildByName('LayerFgui');
layerFgui.addChild(this._groot.node);
```

---

## 8. 资源加载流程

### 8.1 资源分类

```
assets/resources/          # 公共资源（启动即加载）
├── common/               # 通用资源
├── language/             # 多语言
└── config/               # 配置

assets/bundle/            # Bundle 资源（按需加载）
├── gui/fgui/            # FairyGUI 包
├── battle/              # 战斗资源
└── game/                # 游戏资源
```

### 8.2 AsyncQueue 异步队列

```typescript
const queue = new AsyncQueue();

// 添加任务
queue.push(async (next: NextFunction) => {
    await loadLanguage();
    next();
});

queue.push(async (next: NextFunction) => {
    await loadCommonRes();
    next();
});

// 完成回调
queue.complete = async () => {
    console.log("All tasks done");
};

// 开始执行
queue.play();
```

### 8.3 加载顺序

```
1. 显示 Loading UI
2. 加载多语言包
3. 加载公共资源 (common/)
4. 加载 Bundle
5. 加载 FairyGUI 包
6. 启动游戏
```

---

## 9. 启动流程详解

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Main.onLoad()                                            │
│    ├─ Root.onLoad() 框架初始化                               │
│    ├─ registerLayerCls('Fgui', LayerFgui)                   │
│    └─ initUICamera() → SOLID_COLOR (黑屏)                   │
├─────────────────────────────────────────────────────────────┤
│ 2. Main.start()                                             │
│    ├─ GlobalMask.init(true) → 显示黑屏遮罩                   │
│    └─ FGUIManager.init()                                    │
├─────────────────────────────────────────────────────────────┤
│ 3. Main.run()                                               │
│    ├─ smc.initialize = ecs.getEntity(Initialize)            │
│    └─ smc.account = ecs.getEntity(Account)                  │
├─────────────────────────────────────────────────────────────┤
│ 4. InitResSystem.entityEnter()                              │
│    ├─ 显示 LoadingViewComp                                  │
│    ├─ GlobalMask.hide() → 隐藏遮罩                          │
│    ├─ 加载多语言包                                          │
│    ├─ 加载公共资源                                          │
│    ├─ 加载 Bundle                                           │
│    ├─ 加载 FairyGUI 包                                      │
│    └─ 移除 InitResComp                                      │
├─────────────────────────────────────────────────────────────┤
│ 5. LoadingViewComp.onCompleteCallback()                     │
│    ├─ smc.battle = ecs.getEntity(Battle) → 延迟创建         │
│    ├─ 添加 BattleViewComp                                   │
│    ├─ 启用 3D Camera                                        │
│    ├─ UICamera.clearFlags = DEPTH_ONLY                      │
│    └─ Loading 界面淡出                                      │
├─────────────────────────────────────────────────────────────┤
│ 6. BattleViewComp.start()                                   │
│    ├─ 初始化 3D 场景                                        │
│    ├─ 启动战斗系统                                          │
│    └─ 游戏开始                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. 最佳实践

### 10.1 设计模式

| 模式 | 用途 | 示例 |
|------|------|------|
| ECS | 游戏逻辑 | Battle, Account |
| MVC | UI 管理 | CCViewVM |
| 单例 | 全局管理 | smc, FGUIManager, GlobalMask |
| 对象池 | 性能优化 | tileNodePool |
| 观察者 | 事件系统 | GameEvent + oops.event |
| 异步队列 | 流程控制 | AsyncQueue |

### 10.2 代码规范

```typescript
/*
 * @Author: jiangking
 * @Date: 2025-12-10 00:00:00
 * @LastEditors: jiangking
 * @LastEditTime: 2025-12-10 00:00:00
 */
/**
 * 组件功能描述
 */
import { _decorator } from "cc";

// 1. 先导入 Cocos 模块
// 2. 再导入框架模块
// 3. 最后导入项目模块
```

### 10.3 性能优化

```typescript
// 1. 延迟加载
// Battle 不在启动时创建
smc.battle = ecs.getEntity<Battle>(Battle);  // Loading 完成后

// 2. 对象池复用
const pool = new NodePool();
let node = pool.get() || createNew();
pool.put(node);

// 3. 异步加载
await FGUIManager.instance.loadPackageAsync('Battle');

// 4. 假进度显示
this.currentProgress = Math.min(
    this.currentProgress + this.fakeProgressSpeed * dt,
    this.fakeProgressMax
);
```

---

## 11. 扩展指南

### 11.1 添加新游戏模块

**步骤**:

1. 创建目录结构：
```
assets/script/game/mahjong/
├── Mahjong.ts
├── model/MahjongModelComp.ts
├── bll/MahjongSystem.ts
└── view/MahjongViewComp.ts
```

2. 定义 Entity：
```typescript
@ecs.register('Mahjong')
export class Mahjong extends CCEntity {
    MahjongModel!: MahjongModelComp;

    protected init() {
        this.addComponents<ecs.Comp>(MahjongModelComp);
    }
}
```

3. 注册到 SingletonModuleComp：
```typescript
export class SingletonModuleComp extends ecs.Comp {
    mahjong: Mahjong = null!;
}
```

4. 在 Main.run() 中初始化：
```typescript
smc.mahjong = ecs.getEntity<Mahjong>(Mahjong);
```

### 11.2 添加新 UI 界面

**步骤**:

1. 添加 UIID：
```typescript
enum UIID {
    MainMenu = 2
}
```

2. 配置 UIConfig：
```typescript
UIConfigData[UIID.MainMenu] = {
    layer: LayerType.UI,
    prefab: "gui/main_menu"
};
```

3. 创建 View 组件：
```typescript
@ccclass('MainMenuViewComp')
export class MainMenuViewComp extends CCViewVM<MainMenuModule> {
    enter() { }
    exit() { }
}
```

4. 打开界面：
```typescript
oops.gui.open(UIID.MainMenu);
```

### 11.3 添加新 System

```typescript
@ecs.register('NewSystem')
export class NewSystem extends ecs.ComblockSystem {
    filter(): ecs.IMatcher {
        return ecs.allOf(BattleModelComp);
    }

    entityEnter(entity: Battle): void {
        // 初始化逻辑
    }

    update(entity: Battle): void {
        // 每帧更新
    }

    entityRemove(entity: Battle): void {
        // 清理逻辑
    }
}
```

---

## 附录

### A. 配置文件

**config.json 完整结构**:

```json
{
    "type": "dev",
    "config": {
        "dev": {
            "httpServer": "http://192.168.0.1/",
            "webSocketServer": "ws://127.0.0.1:8080",
            "stats": false
        },
        "test": { ... },
        "prod": { ... }
    },
    "gui": [ ... ],
    "language": {
        "default": "zh",
        "type": ["zh", "en"],
        "path": {
            "json": "language/json",
            "texture": "language/texture"
        }
    },
    "bundle": {
        "default": "bundle"
    }
}
```

### B. 常用命令

```bash
# 更新 Oops 框架
./update-oops-plugin-framework.bat

# 更新热更新插件
./update-oops-plugin-hot-update.bat

# Excel 转 JSON
./update-oops-plugin-excel-to-json.bat
```

### C. 参考链接

- [Oops Framework 官方文档](https://github.com/dgflash/oops-framework)
- [Cocos Creator 3.x 官方文档](https://docs.cocos.com/creator/3.8/manual/zh/)
- [FairyGUI 官方文档](https://www.fairygui.com/docs/cocos)

---

> 文档最后更新: 2025-12-10
