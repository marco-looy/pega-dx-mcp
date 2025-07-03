import { PegaAPIClient } from '../../api/pega-client.js';

export class GetCaseStagesTool {
  constructor() {
    this.pegaClient = new PegaAPIClient();
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
            description: 'Full case handle (e.g., METE-MYDEMOAPP-WORK T-3)'
          }
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

    // Validate required parameters
    if (!caseID || typeof caseID !== 'string' || caseID.trim() === '') {
      return {
        error: 'Invalid caseID parameter. Case ID is required and must be a non-empty string.'
      };
    }

    try {
      // Call Pega API to get case stages
      const result = await this.pegaClient.getCaseStages(caseID.trim());

      if (result.success) {
        return {
          content: [
            {
              type: 'text',
              text: this.formatSuccessResponse(caseID, result.data)
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: this.formatErrorResponse(caseID, result.error)
            }
          ]
        };
      }
    } catch (error) {
      return {
        error: `Unexpected error while retrieving stages for case ${caseID}: ${error.message}`
      };
    }
  }

  /**
   * Format successful response for display
   */
  formatSuccessResponse(caseID, data) {
    let response = `## Case Stages: ${caseID}\n\n`;

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

    response += '\n---\n';
    response += `*Retrieved at: ${new Date().toISOString()}*`;

    return response;
  }

  /**
   * Format error response for display
   */
  formatErrorResponse(caseID, error) {
    let response = `## Error retrieving stages for case: ${caseID}\n\n`;
    
    response += `**Error Type**: ${error.type}\n`;
    response += `**Message**: ${error.message}\n`;
    
    if (error.details) {
      response += `**Details**: ${error.details}\n`;
    }
    
    if (error.status) {
      response += `**HTTP Status**: ${error.status} ${error.statusText}\n`;
    }

    // Add specific guidance based on error type
    switch (error.type) {
      case 'NOT_FOUND':
        response += '\n**Suggestions**:\n';
        response += '- Verify the case ID is correct and the case exists\n';
        response += '- Check that you have access permissions to this case\n';
        response += '- Ensure the case ID format is correct (full case handle)\n';
        break;
      case 'FORBIDDEN':
        response += '\n**Suggestion**: Check if you have the necessary permissions to access this case and its stages.\n';
        break;
      case 'UNAUTHORIZED':
        response += '\n**Suggestion**: Authentication may have expired. The system will attempt to refresh the token on the next request.\n';
        break;
      case 'BAD_REQUEST':
        response += '\n**Suggestions**:\n';
        response += '- Check the case ID format (should be full case handle)\n';
        response += '- Ensure the case ID is properly encoded\n';
        response += '- Verify the case is in a valid state to retrieve stages\n';
        break;
      case 'CONNECTION_ERROR':
        response += '\n**Suggestion**: Verify the Pega instance URL and network connectivity.\n';
        break;
    }

    if (error.errorDetails && error.errorDetails.length > 0) {
      response += '\n### Additional Error Details\n';
      error.errorDetails.forEach((detail, index) => {
        response += `${index + 1}. ${detail.localizedValue || detail.message}\n`;
      });
    }

    response += '\n---\n';
    response += `*Error occurred at: ${new Date().toISOString()}*`;

    return response;
  }
}
