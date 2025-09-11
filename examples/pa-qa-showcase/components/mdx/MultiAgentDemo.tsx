'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Code,
  TestTube,
  FileText,
  Settings,
  Cpu,
  Activity
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'testing' | 'research' | 'implementation' | 'validation';
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  task: string;
  output?: string[];
  duration?: number;
  startTime?: number;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agents: string[];
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
}

interface MultiAgentDemoProps {
  title?: string;
  description?: string;
  workflow?: 'test-generation' | 'code-review' | 'performance-analysis' | 'custom';
  autoStart?: boolean;
  speed?: number;
  className?: string;
}

const defaultAgents: Agent[] = [
  {
    id: 'unit-tester',
    name: 'Unit Test Generator',
    type: 'testing',
    status: 'idle',
    progress: 0,
    task: 'Generate comprehensive unit tests'
  },
  {
    id: 'e2e-tester',
    name: 'E2E Test Creator',
    type: 'testing',
    status: 'idle',
    progress: 0,
    task: 'Create end-to-end test scenarios'
  },
  {
    id: 'researcher',
    name: 'Best Practices Research',
    type: 'research',
    status: 'idle',
    progress: 0,
    task: 'Research testing patterns and frameworks'
  },
  {
    id: 'implementer',
    name: 'Infrastructure Setup',
    type: 'implementation',
    status: 'idle',
    progress: 0,
    task: 'Configure CI/CD and testing infrastructure'
  },
  {
    id: 'validator',
    name: 'Quality Validator',
    type: 'validation',
    status: 'idle',
    progress: 0,
    task: 'Validate test coverage and quality'
  }
];

const defaultWorkflow: WorkflowStep[] = [
  {
    id: 'research',
    name: 'Research Phase',
    description: 'Analyze requirements and research best practices',
    agents: ['researcher'],
    dependencies: [],
    status: 'pending'
  },
  {
    id: 'parallel-testing',
    name: 'Parallel Test Generation',
    description: 'Generate unit and E2E tests simultaneously',
    agents: ['unit-tester', 'e2e-tester'],
    dependencies: ['research'],
    status: 'pending'
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure Setup',
    description: 'Configure testing infrastructure and CI/CD',
    agents: ['implementer'],
    dependencies: ['research'],
    status: 'pending'
  },
  {
    id: 'validation',
    name: 'Quality Validation',
    description: 'Validate test coverage and quality metrics',
    agents: ['validator'],
    dependencies: ['parallel-testing', 'infrastructure'],
    status: 'pending'
  }
];

export function MultiAgentDemo({
  title = 'Multi-Agent Testing Workflow',
  description = 'Watch parallel agents collaborate to generate comprehensive test suites',
  workflow = 'test-generation',
  autoStart = false,
  speed = 1,
  className = '',
}: MultiAgentDemoProps) {
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(defaultWorkflow);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);
  const [logs, setLogs] = useState<{ timestamp: number; agent: string; message: string; type: 'info' | 'success' | 'error' }[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((agent: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [...prev.slice(-19), { timestamp: Date.now(), agent, message, type }]);
  }, []);

  const updateAgent = useCallback((agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, ...updates } : agent
    ));
  }, []);

  const updateWorkflowStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  }, []);

  const simulateAgentWork = useCallback((agent: Agent, duration: number) => {
    return new Promise<void>((resolve) => {
      const startTime = Date.now();
      updateAgent(agent.id, { status: 'running', startTime, progress: 0 });
      addLog(agent.name, `Started: ${agent.task}`, 'info');

      const workInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        
        updateAgent(agent.id, { progress });

        // Add periodic progress logs
        if (progress > 25 && progress < 35) {
          addLog(agent.name, 'Analyzing requirements...', 'info');
        } else if (progress > 50 && progress < 60) {
          addLog(agent.name, 'Generating test templates...', 'info');
        } else if (progress > 75 && progress < 85) {
          addLog(agent.name, 'Optimizing test coverage...', 'info');
        }

        if (progress >= 100) {
          clearInterval(workInterval);
          updateAgent(agent.id, { 
            status: 'completed', 
            progress: 100,
            duration: Date.now() - startTime,
            output: [
              'Generated test files',
              'Added configuration',
              'Updated documentation'
            ]
          });
          addLog(agent.name, `Completed: ${agent.task}`, 'success');
          resolve();
        }
      }, 100 / speed);
    });
  }, [updateAgent, addLog, speed]);

  const executeWorkflowStep = useCallback(async (step: WorkflowStep) => {
    setCurrentStep(step.id);
    updateWorkflowStep(step.id, { status: 'running' });
    addLog('Workflow', `Starting ${step.name}`, 'info');

    const stepAgents = agents.filter(agent => step.agents.includes(agent.id));
    const baseDuration = 3000 / speed;
    
    // Run agents in parallel
    const agentPromises = stepAgents.map(agent => {
      const duration = baseDuration + Math.random() * 2000 / speed;
      return simulateAgentWork(agent, duration);
    });

    try {
      await Promise.all(agentPromises);
      updateWorkflowStep(step.id, { status: 'completed', duration: Date.now() });
      addLog('Workflow', `Completed ${step.name}`, 'success');
    } catch (error) {
      updateWorkflowStep(step.id, { status: 'error' });
      addLog('Workflow', `Failed ${step.name}`, 'error');
    }
  }, [agents, updateWorkflowStep, addLog, speed, simulateAgentWork]);

  const startWorkflow = useCallback(async () => {
    setIsRunning(true);
    setLogs([]);
    addLog('System', 'Multi-agent workflow started', 'info');

    // Reset all agents and steps
    setAgents(prev => prev.map(agent => ({ 
      ...agent, 
      status: 'idle', 
      progress: 0, 
      output: undefined,
      duration: undefined,
      startTime: undefined
    })));
    setWorkflowSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending',
      duration: undefined
    })));

    // Execute workflow steps in dependency order
    for (const step of workflowSteps) {
      // Check if dependencies are completed
      const dependenciesCompleted = step.dependencies.every(depId => 
        workflowSteps.find(s => s.id === depId)?.status === 'completed'
      );

      if (dependenciesCompleted) {
        await executeWorkflowStep(step);
      }
    }

    setIsRunning(false);
    setCurrentStep(null);
    addLog('System', 'Multi-agent workflow completed', 'success');
  }, [workflowSteps, executeWorkflowStep, addLog]);

  const resetWorkflow = useCallback(() => {
    setIsRunning(false);
    setCurrentStep(null);
    setTotalProgress(0);
    setLogs([]);
    
    setAgents(prev => prev.map(agent => ({ 
      ...agent, 
      status: 'idle', 
      progress: 0, 
      output: undefined,
      duration: undefined,
      startTime: undefined
    })));
    
    setWorkflowSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending',
      duration: undefined
    })));
  }, []);

  // Calculate total progress
  useEffect(() => {
    const totalAgents = agents.length;
    const totalProgress = agents.reduce((sum, agent) => sum + agent.progress, 0);
    setTotalProgress(totalProgress / totalAgents);
  }, [agents]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      timeoutRef.current = setTimeout(() => {
        startWorkflow();
      }, 1000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoStart, startWorkflow]);

  const getAgentIcon = (type: Agent['type']) => {
    switch (type) {
      case 'testing': return TestTube;
      case 'research': return FileText;
      case 'implementation': return Settings;
      case 'validation': return CheckCircle;
      default: return Code;
    }
  };

  const getStatusColor = (status: Agent['status'] | WorkflowStep['status']) => {
    switch (status) {
      case 'running': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: Agent['status'] | WorkflowStep['status']) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4 opacity-50" />;
    }
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Cpu className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {Math.round(totalProgress)}%
            </span>
          </div>
          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <Pause className="w-3 h-3" />
              Stop
            </button>
          ) : (
            <button
              onClick={startWorkflow}
              disabled={isRunning}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              Start Workflow
            </button>
          )}
          <button
            onClick={resetWorkflow}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      <div className="flex h-96">
        {/* Workflow Steps */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Workflow Steps
            </span>
          </div>
          <div className="overflow-auto max-h-80">
            {workflowSteps.map((step, index) => (
              <div
                key={step.id}
                className={`p-3 border-b border-gray-200 dark:border-gray-700 ${
                  currentStep === step.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {index + 1}. {step.name}
                  </span>
                  <div className={`px-2 py-0.5 text-xs rounded ${getStatusColor(step.status)}`}>
                    {getStatusIcon(step.status)}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {step.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Agents: {step.agents.join(', ')}
                </div>
                {step.dependencies.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Depends on: {step.dependencies.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agents */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Agents ({agents.length})
            </span>
          </div>
          <div className="overflow-auto max-h-80">
            {agents.map((agent) => {
              const IconComponent = getAgentIcon(agent.type);
              
              return (
                <div
                  key={agent.id}
                  className="p-3 border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.name}
                      </span>
                    </div>
                    <div className={`px-2 py-0.5 text-xs rounded ${getStatusColor(agent.status)}`}>
                      {getStatusIcon(agent.status)}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {agent.task}
                  </p>
                  
                  {agent.status === 'running' && (
                    <>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(agent.progress)}% complete
                      </div>
                    </>
                  )}
                  
                  {agent.duration && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Completed in {Math.round(agent.duration / 1000)}s
                    </div>
                  )}
                  
                  {agent.output && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Output:
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                        {agent.output.map((item, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div className="w-1/3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Activity Log
            </span>
            <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="overflow-auto max-h-80 p-3">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity yet</p>
                <p className="text-xs">Start the workflow to see logs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs ${
                      log.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                      log.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                      'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{log.agent}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Multi-agent workflow demonstration • {workflow} mode
          </span>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>Speed: {speed}x</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MultiAgentDemo;