# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Game Framework Template** built on **Oops Framework** using **Cocos Creator 3.8.7**. The project provides a production-ready game infrastructure with:
- ECS (Entity-Component-System) architecture with MVC patterns
- Multi-language support (Chinese/English)
- Network multiplayer capabilities (WebSocket)
- Hot update system
- Excel-driven game data configuration
- WeChat Mini Game support

## Version Control

**This project uses Git.**

- Use standard `git` commands
- Ignore rules are configured via `.gitignore`

**Git Ignored Files/Folders:**
```
.claude          # Claude Code config
.creator         # Cocos Creator editor cache
.vscode          # VS Code personal config
temp             # Temporary files
library          # Build cache
build            # Build output
node_modules     # npm dependencies
profiles         # Editor personal config
local            # Local config
*.stackdump      # Crash dumps
```

## Build and Development

**No npm scripts** - This is a Cocos Creator project using the editor's build system:
- Open project in Cocos Creator 3.8.7
- Build via: File > Build Manager in editor
- Preview via: Editor's play button or browser preview

**Plugin Updates** (run from project root):
```bash
# Windows
update-oops-plugin-framework.bat
update-oops-plugin-hot-update.bat
update-oops-plugin-excel-to-json.bat

# macOS/Linux
./update-oops-plugin-framework.sh
./update-oops-plugin-hot-update.sh
./update-oops-plugin-excel-to-json.sh
```

**Data Generation**: Excel files in `excel/` are converted to TypeScript tables via oops-plugin-excel-to-json.

## Architecture

### ECS + MVC Pattern
- **Entities**: Game modules (`Initialize`, `Account`) in `assets/script/game/`
- **Components**: Data (`*ModelComp`) and behavior (`*Comp`) components
- **Systems**: Business logic processors (`*System`)
- **Views**: UI components (`*ViewComp`)

```typescript
// Entity registration
@ecs.register('Account')
export class Account extends ecs.Entity {
    AccountModelComp: AccountModelComp;  // Model
}

// Global module access via singleton
import { smc } from "./common/SingletonModuleComp";
smc.account  // Access Account entity
smc.initialize  // Access Initialize entity
```

### Core Entry Point
[Main.ts](assets/script/Main.ts) extends Root and initializes:
1. GUI layer system
2. Core game entities (Initialize, Account)

### GUI Layer System
Seven-layer hierarchy defined in [config.json](assets/resources/config.json):
- LayerGame (Game content)
- LayerUI (Main UI)
- LayerPopUp (Popups)
- LayerDialog (Dialogs)
- LayerSystem (System dialogs)
- LayerNotify (Notifications)
- LayerGuide (Tutorial overlays)

UI configuration maps UIID enums to prefabs and layers in [GameUIConfig.ts](assets/script/game/common/config/GameUIConfig.ts).

### Initialization Flow
[InitRes.ts](assets/script/game/initialize/bll/InitRes.ts) orchestrates:
1. Load language packs
2. Load common resources
3. Show loading UI with progress
4. Load game content
5. Launch first game view

## Key Directories

```
assets/
├── script/game/          # Game source code
│   ├── common/          # Common modules (config, singletons, tables)
│   ├── initialize/      # Initialization module
│   └── account/         # Account module (example)
├── resources/           # Runtime-loaded assets
│   ├── config/         # Configuration files
│   ├── loading/        # Loading UI
│   └── gui/            # UI prefabs
├── libs/               # Third-party libraries
│   ├── bundle/         # Asset bundles
│   └── seedrandom/     # Random number generator
├── scene/              # Scene files
└── bundle/             # Asset bundles

extensions/
├── oops-plugin-framework/      # Oops core framework plugin
├── oops-plugin-excel-to-json-custom/  # Excel to JSON plugin
└── cocos-mcp-server/          # MCP AI assistant plugin

build-templates/
└── wechatgame/         # WeChat Mini Game template

excel/                  # Source Excel files for data generation
docs/                   # Project documentation
settings/               # Cocos Creator project settings
```

## Configuration

**Environment configs** in [config.json](assets/resources/config.json):
- `dev` - Development environment
- `test` - Testing environment
- `prod` - Production environment

**Multi-language system**:
- Default language: Chinese (`zh`)
- Supported languages: `zh` (Chinese), `en` (English)
- Language resource paths:
  - JSON files: `language/json`
  - Textures: `language/texture`

## TypeScript Guidelines

- Strict mode enabled in [tsconfig.json](tsconfig.json)
- Use `@ecs.register()` decorator for entity/component registration
- Use `@ccclass()` decorator for Cocos Creator components
- Access framework via `oops` namespace (oops.gui, oops.res, oops.audio)
- Game events defined in [GameEvent.ts](assets/script/game/common/config/GameEvent.ts)

**Framework import paths**:
- Core framework uses Cocos Creator database protocol: `db://oops-framework/`
- ECS system: `import { ecs } from "db://oops-framework/libs/ecs/ECS"`
- Core modules: `import { oops } from "db://oops-framework/core/Oops"`

## Dependencies

- `crypto-es` - Encryption library
- Cocos Creator 3.8.7 engine modules (2D, 3D, Spine 3.8, DragonBones, WebSocket, etc.)

## Cocos MCP Server Integration

This project includes **Cocos MCP Server** extension in `extensions/cocos-mcp-server/` which provides AI-powered development assistance with 50+ tools for Cocos Creator operations.

### MCP Server Configuration

**Server URL**: `http://127.0.0.1:3000/mcp`

**Claude Desktop Configuration** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "cocos-creator": {
      "type": "http",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

### Using MCP Server

1. **Start the server**: Open Cocos Creator > Menu > Extension > Cocos MCP Server > Click "Start Server"
2. **Verify connection**: Server runs on port 3000 by default
3. **Common workflows**:
   - Always use `node_query` first to get node UUIDs before modifications
   - Use `component_query` to inspect component types before setting properties
   - Use `scene_management.save` before switching scenes

## Quick Start

### Adding a New Game Module

1. Create a new folder in `assets/script/game/` (e.g., `mymodule/`)
2. Create Entity class:
```typescript
import { ecs } from "db://oops-framework/libs/ecs/ECS";

@ecs.register('MyModule')
export class MyModule extends ecs.Entity {
    // Add components here
}
```

3. Register in `SingletonModuleComp.ts`:
```typescript
export class SingletonModuleComp extends ecs.Comp {
    mymodule: MyModule = null!;
    // ...
}
```

4. Initialize in `Main.ts`:
```typescript
protected run() {
    smc.mymodule = ecs.getEntity<MyModule>(MyModule);
    // ...
}
```

### Using Excel Data Tables

1. Create Excel file in `excel/` directory
2. Run update script: `update-oops-plugin-excel-to-json.bat`
3. Generated TypeScript classes appear in `assets/script/game/common/table/`
4. Access data in code:
```typescript
import { TableXXX } from "../common/table/TableXXX";
const data = TableXXX.get(id);
```

### Building for WeChat Mini Game

1. Run `build-wechat.bat` or use editor Build Manager
2. WeChat templates are in `build-templates/wechatgame/`
3. Project config in `project.config.json`

## FAQ

### How to add a new UI screen?
1. Create prefab in `assets/resources/gui/`
2. Add UIID enum in `GameUIConfig.ts`
3. Register prefab path and layer
4. Show UI: `oops.gui.open(UIID.MyScreen)`

### How to handle game events?
```typescript
// Define event
export class GameEvent {
    static MY_EVENT = "MY_EVENT";
}

// Listen
oops.message.on(GameEvent.MY_EVENT, this.onMyEvent, this);

// Dispatch
oops.message.dispatchEvent(GameEvent.MY_EVENT, data);
```

### How to load resources?
```typescript
// Load single asset
oops.res.load("path/to/asset", SpriteFrame, (err, asset) => {});

// Load directory
oops.res.loadDir("path/to/dir", this.onProgress, this.onComplete);

// Load bundle
await oops.res.loadBundle('bundleName');
```
