import { BaseTool } from '../../registry/base-tool.js';
import { getSessionCredentialsSchema } from '../../utils/tool-schema.js';

export class GetCaseStagesTool extends BaseTool {
  /**
   * Get the category this tool belongs to
   */
  static getCategory() {
    return 'cases';
  }

  /**
   * Get tool definition for MCP protocol
   */
  static getDefinition() {
    return {
      name: 'get_case_stages',
      description: 'Retrieve the stages list for a given case ID with processes, steps, and visited status information.',
      inputSchema: {
        type: 'object',
        properties: {
          caseID: {
            type: 'string',
            description: 'Full case handle (e.g.,ON6E5R-DIYRECIPE-WORK-RECIPECOLLECTION R-1008)'
          },
          sessionCredentials: getSessionCredentialsSchema()
        },
        required: ['caseID']
      }
    };
  }

  /**
   * Execute the get case stages operation
   */
  async execute(params) {
    const { caseID } = params;
    let sessionInfo = null;

    try {
      // Initialize session configuration if provided
      sessionInfo = this.initializeSessionConfig(params);

      // Validate required parameters using base class
      const requiredValidation = this.validateRequiredParams(params, ['caseID']);
      if (requiredValidation) {
        return requiredValidation;
      }

      // Execute with standardized error handling
      return await this.executeWithErrorHandling(
        `Case Stages: ${caseID}`,
        async () => await this.pegaClient.getCaseStages(caseID.trim()),
        { caseID, sessionInfo }
      );
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `## Error: Get Case Stages\n\n**Unexpected Error**: ${error.message}\n\n${sessionInfo ? `**Session**: ${sessionInfo.sessionId} (${sessionInfo.authMode} mode)\n` : ''}*Error occurred at: ${new Date().toISOString()}*`
        }]
      };
    }
  }

  /**
   * Override formatSuccessResponse to add case stages specific formatting
   */
  formatSuccessResponse(operation, data, options = {}) {
    const { caseID, sessionInfo } = options;

    let response = `## ${operation}\n\n`;

    response += `*Operation completed at: ${new Date().toISOString()}*\n\n`;

    // Session Information (if applicable)
    if (sessionInfo) {
      response += `### Session Information\n`;
      response += `- **Session ID**: ${sessionInfo.sessionId}\n`;
      response += `- **Authentication Mode**: ${sessionInfo.authMode.toUpperCase()}\n`;
      response += `- **Configuration Source**: ${sessionInfo.configSource}\n\n`;
    }

    // Display case stages information
    if (data.stages && Array.isArray(data.stages)) {
      response += `### Stage Overview\n`;
      response += `- **Total Stages**: ${data.stages.length}\n`;
      
      // Count visited and unvisited stages
      const visitedStages = data.stages.filter(stage => stage.visited === true);
      const unvisitedStages = data.stages.filter(stage => stage.visited === false);
      
      response += `- **Visited Stages**: ${visitedStages.length}\n`;
      response += `- **Remaining Stages**: ${unvisitedStages.length}\n\n`;

      // Display each stage with details
      data.stages.forEach((stage, stageIndex) => {
        const stageNumber = stageIndex + 1;
        const visitedIcon = stage.visited ? '✅' : '⏸️';
        const stageType = stage.stageType || 'Primary';
        
        response += `### ${visitedIcon} Stage ${stageNumber}: ${stage.name}\n`;
        response += `- **Type**: ${stageType}\n`;
        response += `- **Status**: ${stage.visited ? 'Visited' : 'Not Visited'}\n`;
        
        if (stage.description) {
          response += `- **Description**: ${stage.description}\n`;
        }

        // Display processes within the stage
        if (stage.processes && Array.isArray(stage.processes)) {
          response += `- **Processes**: ${stage.processes.length}\n\n`;
          
          stage.processes.forEach((process, processIndex) => {
            const processNumber = processIndex + 1;
            const processVisitedIcon = process.visited ? '✅' : '⏸️';
            
            response += `#### ${processVisitedIcon} Process ${stageNumber}.${processNumber}: ${process.name}\n`;
            response += `   - **Status**: ${process.visited ? 'Visited' : 'Not Visited'}\n`;
            
            if (process.description) {
              response += `   - **Description**: ${process.description}\n`;
            }

            // Display steps within the process
            if (process.steps && Array.isArray(process.steps)) {
              response += `   - **Steps**: ${process.steps.length}\n`;
              
              process.steps.forEach((step, stepIndex) => {
                const stepNumber = stepIndex + 1;
                const stepVisitedIcon = step.visited ? '✅' : '⏸️';
                
                response += `      ${stepVisitedIcon} **Step ${stageNumber}.${processNumber}.${stepNumber}**: ${step.name}`;
                response += ` (${step.visited ? 'Visited' : 'Not Visited'})\n`;
                
                if (step.description) {
                  response += `         - ${step.description}\n`;
                }
              });
            }
            response += '\n';
          });
        } else {
          response += '\n';
        }
      });

      // Summary section
      response += '### Progress Summary\n';
      const totalProcesses = data.stages.reduce((sum, stage) => 
        sum + (stage.processes ? stage.processes.length : 0), 0);
      const visitedProcesses = data.stages.reduce((sum, stage) => 
        sum + (stage.processes ? stage.processes.filter(p => p.visited).length : 0), 0);
      
      const totalSteps = data.stages.reduce((sum, stage) => 
        sum + (stage.processes ? stage.processes.reduce((pSum, process) => 
          pSum + (process.steps ? process.steps.length : 0), 0) : 0), 0);
      const visitedSteps = data.stages.reduce((sum, stage) => 
        sum + (stage.processes ? stage.processes.reduce((pSum, process) => 
          pSum + (process.steps ? process.steps.filter(s => s.visited).length : 0), 0) : 0), 0);

      if (totalProcesses > 0) {
        response += `- **Processes**: ${visitedProcesses}/${totalProcesses} completed\n`;
      }
      
      if (totalSteps > 0) {
        response += `- **Steps**: ${visitedSteps}/${totalSteps} completed\n`;
      }

      // Progress percentage
      if (totalSteps > 0) {
        const progressPercent = Math.round((visitedSteps / totalSteps) * 100);
        response += `- **Overall Progress**: ${progressPercent}%\n`;
      }

    } else if (data.stages) {
      response += '### Stages Information\n';
      response += '- Stages data available but not in expected array format\n';
      response += `- Raw data type: ${typeof data.stages}\n`;
    } else {
      response += '### No Stages Information\n';
      response += '- No stages data found for this case\n';
    }
    
    return response;
  }
}
