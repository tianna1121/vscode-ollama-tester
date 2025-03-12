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
  const baseUrl = config.get<string>("serverUrl") || "http://localhost:11434";
  const model = config.get<string>("model") || "deepseek-r1:32b";

  console.log(`连接到Ollama服务: ${baseUrl}, 使用模型: ${model}`);

  try {
    // 先测试连接
    try {
      await axios.get(`${baseUrl}/api/version`);
      console.log("Ollama服务连接成功");
    } catch (err) {
      console.error(
        `连接验证失败: ${err instanceof Error ? err.message : String(err)}`
      );
      throw new Error(
        `无法连接到Ollama服务 ${baseUrl}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    // 使用/api/generate端点
    console.log("开始生成代码...");
    const generateUrl = `${baseUrl}/api/generate`;
    console.log(`API请求URL: ${generateUrl}`);

    const response = await axios.post(generateUrl, {
      model: model,
      prompt: `你是一位专业的代码生成助手。请提供完整、可执行的代码，包括所需的文件结构。输出应采用以下格式：文件路径后跟\`\`\`语言 代码内容\`\`\`\n\n根据以下需求生成完整的代码和目录结构: ${prompt}`,
      stream: false,
    });

    console.log("生成完成，解析响应...");

    // 检查响应格式并返回
    if (response.data && response.data.response) {
      return response.data.response;
    } else {
      console.error("Ollama API返回的数据格式不正确:", response.data);
      throw new Error("API返回的数据格式不正确");
    }
  } catch (error) {
    console.error("Ollama API调用错误:", error);
    if (axios.isAxiosError(error) && error.response) {
      console.error("API响应状态:", error.response.status);
      console.error("API响应数据:", error.response.data);
    }
    throw error;
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
  console.log(`工作区根目录: ${workspaceRoot}`);

  // 正则表达式匹配文件路径和代码块
  const filePattern = /(?:^|\n)([^`\n]+)\n```(?:\w+)?\n([\s\S]*?)\n```/g;

  let match;
  let filesCreated = 0;

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
    filesCreated++;
  }

  if (filesCreated === 0) {
    console.warn("未从响应中识别到任何文件格式，原始响应:", responseText);
    throw new Error("无法从AI响应中识别文件格式。确保模型生成了正确格式的代码");
  }
}

// 停用插件
export function deactivate() {}
