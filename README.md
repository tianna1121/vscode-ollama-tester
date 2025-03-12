# vscode-ollama-tester

# Ollama Code Generator VSCode 插件

这是一个简单的 VSCode 插件，它通过连接到本地 Ollama 服务，让你可以直接在 VSCode 中生成代码并创建对应的文件结构。

## 功能

- 在 VSCode 中通过命令面板输入代码生成需求
- 将需求发送到本地 Ollama 服务
- 自动解析返回的代码并创建相应的文件和目录结构

## 前提条件

1. 已安装并运行 [Ollama](https://ollama.ai/)
2. Ollama 服务已配置并能正常响应

## 安装与配置

### 开发环境设置

1. 克隆此仓库
2. 安装依赖：
   ```bash
   npm install
   ```
3. 按 F5 在开发模式下启动 VSCode 扩展宿主窗口

### 配置插件

在 VSCode 设置中，你可以配置以下选项：

- `ollama-code-generator.serverUrl`: Ollama 服务器的 URL (默认: `http://localhost:11434/api/chat`)
- `ollama-code-generator.model`: 使用的 Ollama 模型名称 (默认: `llama3`)

## 使用方法

1. 使用命令面板 (Ctrl+Shift+P 或 Cmd+Shift+P) 调用命令：`Ollama: 生成代码`
2. 在输入框中描述你需要生成的代码或功能
3. 插件会调用 Ollama 服务，生成代码并自动创建相应的文件

## 打包和分发

要将此插件打包成 `.vsix` 文件以便安装：

```bash
npm install -g vsce  # 安装 VSCE 打包工具
vsce package         # 打包扩展
```

这将生成一个 `.vsix` 文件，可以通过以下方式安装：

- 在 VSCode 中：扩展视图 -> 更多操作（...）-> 从 VSIX 安装
- 或通过命令行：`code --install-extension ollama-code-generator-0.1.0.vsix`

## 发布到 VSCode Marketplace

如果你希望将此插件发布到 VSCode Marketplace：

1. 注册一个 [Azure DevOps 组织](https://dev.azure.com/)
2. 获取个人访问令牌 (PAT)
3. 使用以下命令发布：
   ```bash
   vsce login YourPublisherName
   vsce publish
   ```

## 技术细节

- 使用 TypeScript 开发
- 通过 axios 调用 Ollama API
- 使用 VSCode 插件 API 实现命令和文件操作

## 故障排除

- 确保 Ollama 服务正在运行
- 检查插件设置中的服务器 URL 和模型名称是否正确
- 查看 VSCode 输出面板中的日志信息
