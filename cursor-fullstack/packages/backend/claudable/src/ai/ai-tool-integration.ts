import { aiProviders } from './providers';
import { ToolManager, executeTool } from '../tools';

interface AIToolMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

export class AIToolIntegration {
  private toolManager: ToolManager;
  private availableTools: any[];

  constructor(workspacePath: string = '/app/workspace') {
    this.toolManager = new ToolManager(workspacePath);
    this.availableTools = [
      {
        name: 'file_read',
        description: 'Read contents of a file',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the file to read' }
          },
          required: ['filePath']
        }
      },
      {
        name: 'file_write',
        description: 'Write content to a file',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the file to write' },
            content: { type: 'string', description: 'Content to write to the file' }
          },
          required: ['filePath', 'content']
        }
      },
      {
        name: 'file_list',
        description: 'List files in a directory',
        parameters: {
          type: 'object',
          properties: {
            directory: { type: 'string', description: 'Directory to list files from' }
          }
        }
      },
      {
        name: 'terminal_command',
        description: 'Execute a terminal command',
        parameters: {
          type: 'object',
          properties: {
            command: { type: 'string', description: 'Command to execute' },
            cwd: { type: 'string', description: 'Working directory for the command' }
          },
          required: ['command']
        }
      },
      {
        name: 'git_status',
        description: 'Get git status',
        parameters: {
          type: 'object',
          properties: {
            cwd: { type: 'string', description: 'Working directory for git command' }
          }
        }
      },
      {
        name: 'git_commit',
        description: 'Commit changes to git',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Commit message' },
            cwd: { type: 'string', description: 'Working directory for git command' }
          },
          required: ['message']
        }
      },
      {
        name: 'search_code',
        description: 'Search for code patterns',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            directory: { type: 'string', description: 'Directory to search in' },
            fileTypes: { type: 'array', items: { type: 'string' }, description: 'File types to search in' }
          },
          required: ['query']
        }
      },
      {
        name: 'create_file',
        description: 'Create a new file',
        parameters: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path for the new file' },
            content: { type: 'string', description: 'Content for the new file' }
          },
          required: ['filePath', 'content']
        }
      },
      {
        name: 'create_directory',
        description: 'Create a new directory',
        parameters: {
          type: 'object',
          properties: {
            dirPath: { type: 'string', description: 'Path for the new directory' }
          },
          required: ['dirPath']
        }
      }
    ];
  }

  async chatWithTools(
    message: string,
    provider: string,
    apiKey: string,
    model?: string,
    conversationHistory: AIToolMessage[] = []
  ): Promise<{ response: string; toolResults?: any[] }> {
    const systemPrompt = `You are an AI assistant with access to various tools to help with coding tasks. 
You can use these tools to read files, write files, execute commands, search code, and more.

Available tools:
${this.availableTools.map(tool => 
  `- ${tool.name}: ${tool.description}`
).join('\n')}

When you need to use a tool, respond with a JSON object containing:
{
  "tool_calls": [
    {
      "id": "unique_id",
      "type": "function", 
      "function": {
        "name": "tool_name",
        "arguments": "{\"param1\": \"value1\", \"param2\": \"value2\"}"
      }
    }
  ]
}

If you don't need to use any tools, respond normally with text.

Current conversation context: ${conversationHistory.map(msg => 
  `${msg.role}: ${msg.content}`
).join('\n')}`;

    const messages: AIToolMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    try {
      // Get AI response
      const aiResponse = await aiProviders[provider].chat(
        JSON.stringify(messages), 
        apiKey, 
        model
      );

      // Check if response contains tool calls
      const toolCallMatch = aiResponse.match(/\{[\s\S]*"tool_calls"[\s\S]*\}/);
      
      if (toolCallMatch) {
        try {
          const toolCallData = JSON.parse(toolCallMatch[0]);
          const toolResults = [];

          // Execute each tool call
          for (const toolCall of toolCallData.tool_calls || []) {
            const { name, arguments: args } = toolCall.function;
            const parsedArgs = JSON.parse(args);
            
            console.log(`Executing tool: ${name} with args:`, parsedArgs);
            
            const result = await executeTool(name, parsedArgs, this.toolManager);
            toolResults.push({
              tool_call_id: toolCall.id,
              tool_name: name,
              result: result
            });
          }

          // Generate final response based on tool results
          const toolResultsSummary = toolResults.map(tr => 
            `Tool ${tr.tool_name}: ${tr.result.success ? 'Success' : 'Failed'} - ${JSON.stringify(tr.result)}`
          ).join('\n');

          const finalResponse = await aiProviders[provider].chat(
            `Based on the tool execution results, provide a helpful response to the user:\n\nTool Results:\n${toolResultsSummary}\n\nOriginal request: ${message}`,
            apiKey,
            model
          );

          return {
            response: finalResponse,
            toolResults: toolResults
          };
        } catch (parseError) {
          console.error('Error parsing tool calls:', parseError);
          return { response: aiResponse };
        }
      }

      return { response: aiResponse };
    } catch (error) {
      console.error('AI tool integration error:', error);
      throw error;
    }
  }

  getAvailableTools() {
    return this.availableTools;
  }
}