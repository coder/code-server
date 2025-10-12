import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';

const router = Router();

// Start code-server session
router.post('/session/start', async (req, res) => {
  try {
    const { workspace } = req.body;
    const workspacePath = workspace || '/app/workspace';
    
    // Start code-server process
    const codeServer = spawn('code-server', [
      '--bind-addr', '0.0.0.0:8080',
      '--auth', 'none',
      '--disable-telemetry',
      workspacePath
    ], {
      stdio: 'pipe',
      detached: true
    });

    codeServer.stdout?.on('data', (data) => {
      console.log(`code-server: ${data}`);
    });

    codeServer.stderr?.on('data', (data) => {
      console.error(`code-server error: ${data}`);
    });

    codeServer.on('close', (code) => {
      console.log(`code-server process exited with code ${code}`);
    });

    res.json({ 
      success: true, 
      message: 'Code server started',
      url: 'http://localhost:8081'
    });
  } catch (error) {
    console.error('Failed to start code-server:', error);
    res.status(500).json({ error: 'Failed to start code-server' });
  }
});

// Get workspace files
router.get('/workspace/files', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const workspacePath = '/app/workspace';
    
    const files = await getWorkspaceFiles(workspacePath);
    res.json({ files });
  } catch (error) {
    console.error('Failed to get workspace files:', error);
    res.status(500).json({ error: 'Failed to get workspace files' });
  }
});

// Get file content
router.get('/workspace/file/:filepath(*)', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const filePath = path.join('/app/workspace', req.params.filepath);
    
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content });
  } catch (error) {
    console.error('Failed to read file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Save file content
router.post('/workspace/file/:filepath(*)', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const filePath = path.join('/app/workspace', req.params.filepath);
    const { content } = req.body;
    
    await fs.writeFile(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

async function getWorkspaceFiles(dir: string, basePath = ''): Promise<any[]> {
  const fs = await import('fs/promises');
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subFiles = await getWorkspaceFiles(fullPath, relativePath);
          files.push(...subFiles);
        }
      } else {
        files.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          extension: path.extname(entry.name)
        });
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }
  
  return files;
}

export { router as sessionRoutes };