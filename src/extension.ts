// extension.ts - 主入口文件
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";

// 激活插件
export function activate(context: vscode.ExtensionContext) {
  console.log("Ollama Code Generator 插件已激活");

  // 注册命令
  let disposable = vscode.commands.registerCommand(
    "ollama-code-generator.generateCode",
    async () => {
      // 获取用户的prompt
      const prompt = await vscode.window.showInputBox({
        placeHolder: "请输入代码生成需求...",
        prompt: "描述你想要生成的代码或功能",
      });

      if (!prompt) {
        vscode.window.showInformationMessage("未提供代码生成需求");
        return;
      }

      try {
        vscode.window.showInformationMessage("正在生成代码...");

        // 调用Ollama API
        const response = await generateCodeFromOllama(prompt);

        // 解析并创建文件
        await createFilesFromResponse(response);

        vscode.window.showInformationMessage("代码已成功生成!");
      } catch (error) {
        console.error("代码生成错误:", error);
        vscode.window.showErrorMessage(
          `生成代码时出错: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// 调用Ollama API来生成代码
async function generateCodeFromOllama(prompt: string): Promise<string> {
  // 从设置中获取Ollama服务器URL
  const config = vscode.workspace.getConfiguration("ollama-code-generator");
  const ollamaUrl =
    config.get<string>("serverUrl") || "http://localhost:11434/api/chat";
  const model = config.get<string>("model") || "llama3";

  try {
    const response = await axios.post(ollamaUrl, {
      model: model,
      messages: [
        {
          role: "system",
          content:
            "你是一位专业的代码生成助手。请提供完整、可执行的代码，包括所需的文件结构。输出应采用以下格式：文件路径后跟```语言 代码内容```",
        },
        {
          role: "user",
          content: `根据以下需求生成完整的代码和目录结构: ${prompt}`,
        },
      ],
      stream: false,
    });

    // 返回生成的内容
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Ollama API调用错误:", error);
    throw new Error("无法连接到Ollama服务");
  }
}

// 从生成的响应中创建文件和目录
async function createFilesFromResponse(responseText: string): Promise<void> {
  // 获取当前工作区
  if (
    !vscode.workspace.workspaceFolders ||
    vscode.workspace.workspaceFolders.length === 0
  ) {
    throw new Error("没有打开的工作区");
  }

  const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;

  // 正则表达式匹配文件路径和代码块
  const filePattern = /(?:^|\n)([^`\n]+)\n```(?:\w+)?\n([\s\S]*?)\n```/g;

  let match;
  while ((match = filePattern.exec(responseText)) !== null) {
    const filePath = match[1].trim();
    const codeContent = match[2];

    // 创建完整的文件路径
    const fullPath = path.join(workspaceRoot, filePath);

    // 确保目录存在
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // 写入文件内容
    fs.writeFileSync(fullPath, codeContent);

    console.log(`已创建文件: ${fullPath}`);
  }
}

// 停用插件
export function deactivate() {}
