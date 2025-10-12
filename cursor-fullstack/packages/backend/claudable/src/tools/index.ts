import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

const execAsync = promisify(exec);

// Tool schemas for validation
export const ToolSchemas = {
  fileRead: z.object({
    filePath: z.string(),
  }),
  fileWrite: z.object({
    filePath: z.string(),
    content: z.string(),
  }),
  fileList: z.object({
    directory: z.string().optional(),
  }),
  terminalCommand: z.object({
    command: z.string(),
    cwd: z.string().optional(),
  }),
  gitStatus: z.object({
    cwd: z.string().optional(),
  }),
  gitCommit: z.object({
    message: z.string(),
    cwd: z.string().optional(),
  }),
  gitPush: z.object({
    remote: z.string().optional(),
    branch: z.string().optional(),
    cwd: z.string().optional(),
  }),
  gitPull: z.object({
    remote: z.string().optional(),
    branch: z.string().optional(),
    cwd: z.string().optional(),
  }),
  npmInstall: z.object({
    package: z.string().optional(),
    cwd: z.string().optional(),
  }),
  npmRun: z.object({
    script: z.string(),
    cwd: z.string().optional(),
  }),
  dockerBuild: z.object({
    tag: z.string(),
    dockerfile: z.string().optional(),
    cwd: z.string().optional(),
  }),
  dockerRun: z.object({
    image: z.string(),
    ports: z.array(z.string()).optional(),
    volumes: z.array(z.string()).optional(),
    environment: z.record(z.string()).optional(),
  }),
  searchCode: z.object({
    query: z.string(),
    directory: z.string().optional(),
    fileTypes: z.array(z.string()).optional(),
  }),
  createFile: z.object({
    filePath: z.string(),
    content: z.string(),
  }),
  deleteFile: z.object({
    filePath: z.string(),
  }),
  createDirectory: z.object({
    dirPath: z.string(),
  }),
  moveFile: z.object({
    source: z.string(),
    destination: z.string(),
  }),
  copyFile: z.object({
    source: z.string(),
    destination: z.string(),
  }),
};

// Tool implementations
export class ToolManager {
  private workspacePath: string;

  constructor(workspacePath: string = '/app/workspace') {
    this.workspacePath = workspacePath;
  }

  async fileRead(params: z.infer<typeof ToolSchemas.fileRead>) {
    try {
      const filePath = path.resolve(this.workspacePath, params.filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, content, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fileWrite(params: z.infer<typeof ToolSchemas.fileWrite>) {
    try {
      const filePath = path.resolve(this.workspacePath, params.filePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, params.content, 'utf-8');
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fileList(params: z.infer<typeof ToolSchemas.fileList>) {
    try {
      const directory = params.directory 
        ? path.resolve(this.workspacePath, params.directory)
        : this.workspacePath;
      
      const entries = await fs.readdir(directory, { withFileTypes: true });
      const files = entries.map(entry => ({
        name: entry.name,
        path: path.relative(this.workspacePath, path.join(directory, entry.name)),
        type: entry.isDirectory() ? 'directory' : 'file',
        size: entry.isFile() ? (await fs.stat(path.join(directory, entry.name))).size : undefined,
      }));
      
      return { success: true, files };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async terminalCommand(params: z.infer<typeof ToolSchemas.terminalCommand>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const { stdout, stderr } = await execAsync(params.command, { cwd });
      return { 
        success: true, 
        output: stdout, 
        error: stderr,
        command: params.command,
        cwd 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        command: params.command 
      };
    }
  }

  async gitStatus(params: z.infer<typeof ToolSchemas.gitStatus>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const { stdout, stderr } = await execAsync('git status --porcelain', { cwd });
      const { stdout: branch } = await execAsync('git branch --show-current', { cwd });
      
      return { 
        success: true, 
        status: stdout.trim(),
        branch: branch.trim(),
        cwd 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async gitCommit(params: z.infer<typeof ToolSchemas.gitCommit>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const { stdout, stderr } = await execAsync(`git commit -m "${params.message}"`, { cwd });
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        message: params.message 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async gitPush(params: z.infer<typeof ToolSchemas.gitPush>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const remote = params.remote || 'origin';
      const branch = params.branch || 'main';
      const { stdout, stderr } = await execAsync(`git push ${remote} ${branch}`, { cwd });
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        remote,
        branch 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async gitPull(params: z.infer<typeof ToolSchemas.gitPull>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const remote = params.remote || 'origin';
      const branch = params.branch || 'main';
      const { stdout, stderr } = await execAsync(`git pull ${remote} ${branch}`, { cwd });
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        remote,
        branch 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async npmInstall(params: z.infer<typeof ToolSchemas.npmInstall>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const command = params.package ? `npm install ${params.package}` : 'npm install';
      const { stdout, stderr } = await execAsync(command, { cwd });
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        package: params.package 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async npmRun(params: z.infer<typeof ToolSchemas.npmRun>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const { stdout, stderr } = await execAsync(`npm run ${params.script}`, { cwd });
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        script: params.script 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async dockerBuild(params: z.infer<typeof ToolSchemas.dockerBuild>) {
    try {
      const cwd = params.cwd ? path.resolve(this.workspacePath, params.cwd) : this.workspacePath;
      const dockerfile = params.dockerfile || 'Dockerfile';
      const { stdout, stderr } = await execAsync(`docker build -t ${params.tag} -f ${dockerfile} .`, { cwd });
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        tag: params.tag 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async dockerRun(params: z.infer<typeof ToolSchemas.dockerRun>) {
    try {
      const portMappings = params.ports?.map(p => `-p ${p}`).join(' ') || '';
      const volumeMappings = params.volumes?.map(v => `-v ${v}`).join(' ') || '';
      const envVars = params.environment 
        ? Object.entries(params.environment).map(([k, v]) => `-e ${k}=${v}`).join(' ')
        : '';
      
      const command = `docker run ${portMappings} ${volumeMappings} ${envVars} ${params.image}`;
      const { stdout, stderr } = await execAsync(command);
      return { 
        success: true, 
        output: stdout,
        error: stderr,
        image: params.image 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchCode(params: z.infer<typeof ToolSchemas.searchCode>) {
    try {
      const directory = params.directory 
        ? path.resolve(this.workspacePath, params.directory)
        : this.workspacePath;
      
      const fileTypes = params.fileTypes?.map(ext => `--include="*.${ext}"`).join(' ') || '';
      const { stdout, stderr } = await execAsync(
        `grep -r "${params.query}" ${fileTypes} .`, 
        { cwd: directory }
      );
      
      const results = stdout.split('\n').filter(line => line.trim()).map(line => {
        const [filePath, ...rest] = line.split(':');
        const content = rest.join(':');
        return { filePath, content: content.trim() };
      });
      
      return { 
        success: true, 
        results,
        query: params.query,
        count: results.length 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createFile(params: z.infer<typeof ToolSchemas.createFile>) {
    return this.fileWrite(params);
  }

  async deleteFile(params: z.infer<typeof ToolSchemas.deleteFile>) {
    try {
      const filePath = path.resolve(this.workspacePath, params.filePath);
      await fs.unlink(filePath);
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createDirectory(params: z.infer<typeof ToolSchemas.createDirectory>) {
    try {
      const dirPath = path.resolve(this.workspacePath, params.dirPath);
      await fs.mkdir(dirPath, { recursive: true });
      return { success: true, dirPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async moveFile(params: z.infer<typeof ToolSchemas.moveFile>) {
    try {
      const source = path.resolve(this.workspacePath, params.source);
      const destination = path.resolve(this.workspacePath, params.destination);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.rename(source, destination);
      return { success: true, source, destination };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async copyFile(params: z.infer<typeof ToolSchemas.copyFile>) {
    try {
      const source = path.resolve(this.workspacePath, params.source);
      const destination = path.resolve(this.workspacePath, params.destination);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
      return { success: true, source, destination };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Tool execution function
export async function executeTool(toolName: string, params: any, toolManager: ToolManager) {
  const toolMap: Record<string, (params: any) => Promise<any>> = {
    'file_read': (p) => toolManager.fileRead(p),
    'file_write': (p) => toolManager.fileWrite(p),
    'file_list': (p) => toolManager.fileList(p),
    'terminal_command': (p) => toolManager.terminalCommand(p),
    'git_status': (p) => toolManager.gitStatus(p),
    'git_commit': (p) => toolManager.gitCommit(p),
    'git_push': (p) => toolManager.gitPush(p),
    'git_pull': (p) => toolManager.gitPull(p),
    'npm_install': (p) => toolManager.npmInstall(p),
    'npm_run': (p) => toolManager.npmRun(p),
    'docker_build': (p) => toolManager.dockerBuild(p),
    'docker_run': (p) => toolManager.dockerRun(p),
    'search_code': (p) => toolManager.searchCode(p),
    'create_file': (p) => toolManager.createFile(p),
    'delete_file': (p) => toolManager.deleteFile(p),
    'create_directory': (p) => toolManager.createDirectory(p),
    'move_file': (p) => toolManager.moveFile(p),
    'copy_file': (p) => toolManager.copyFile(p),
  };

  const tool = toolMap[toolName];
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    return await tool(params);
  } catch (error) {
    return { success: false, error: error.message };
  }
}