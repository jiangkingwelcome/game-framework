# Cocos Creator MCP Server v1.5.4

## 🚀 安装说明

1. **解压文件**: 解压ZIP文件，得到 `cocos-mcp-server` 文件夹
2. **复制到项目**: 将整个 `cocos-mcp-server` 文件夹复制到您的 Cocos Creator 项目的 `extensions` 目录中
3. **重启编辑器**: 重启 Cocos Creator 或按 Ctrl+R (Windows) / Cmd+R (Mac) 刷新扩展
4. **启用插件**: 在扩展菜单中点击 "Cocos MCP Server"
5. **启动服务**: 在面板中点击"启动服务器"

## 📱 AI客户端配置

### Claude Desktop
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

### Cursor
```json
{
  "mcpServers": {
    "cocos-creator": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

## 🛠️ 技术特性

- **50个强力工具**: 99%编辑器功能覆盖
- **Streamable HTTP协议**: 基于MCP 2025-03-26标准
- **完美AI兼容**: 支持Cursor、Claude等所有MCP客户端
- **版本**: 1.5.4

## 📞 技术支持

- 📧 邮箱: a549623165@gmail.com
- 💬 微信: GM_LiDaDa
- 🐙 GitHub: https://github.com/DaxianLee

---
**构建时间**: 2025/10/22 21:34:31  
**作者**: 李大仙 (LiDaxian)
