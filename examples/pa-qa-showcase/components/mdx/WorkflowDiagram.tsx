"use client"

import React, { useState, useEffect } from 'react'
import { Play, Clock, CheckCircle, Users, ArrowRight } from 'lucide-react'

interface WorkflowAgent {
  name: string
  task: string
  duration: string
  status?: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
}

interface WorkflowDiagramProps {
  title: string
  agents: WorkflowAgent[]
  parallel?: boolean
  autoRun?: boolean
  className?: string
  onComplete?: () => void
}

export function WorkflowDiagram({
  title,
  agents: initialAgents,
  parallel = true,
  autoRun = false,
  className = '',
  onComplete
}: WorkflowDiagramProps) {
  const [agents, setAgents] = useState<WorkflowAgent[]>(
    initialAgents.map(agent => ({ ...agent, status: 'pending', progress: 0 }))
  )
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<number>(0)

  // Update current time for animation
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning])

  // Auto-run if specified
  useEffect(() => {
    if (autoRun && !isRunning) {
      setTimeout(() => runWorkflow(), 1000)
    }
  }, [autoRun])

  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)([ms]?)/)
    if (!match) return 1000
    
    const value = parseInt(match[1])
    const unit = match[2] || 's'
    
    return unit === 'm' ? value * 60 * 1000 : value * 1000
  }

  const runWorkflow = async () => {
    if (isRunning) return

    setIsRunning(true)
    setStartTime(Date.now())
    setCurrentTime(Date.now())
    
    // Reset all agents
    setAgents(prevAgents => 
      prevAgents.map(agent => ({ ...agent, status: 'pending', progress: 0 }))
    )

    if (parallel) {
      // Run all agents in parallel
      const promises = initialAgents.map((agent, index) => 
        runAgent(index, parseDuration(agent.duration))
      )
      
      await Promise.all(promises)
    } else {
      // Run agents sequentially
      for (let i = 0; i < initialAgents.length; i++) {
        await runAgent(i, parseDuration(initialAgents[i].duration))
      }
    }

    setIsRunning(false)
    onComplete?.()
  }

  const runAgent = (index: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      // Start the agent
      setAgents(prevAgents => 
        prevAgents.map((agent, i) => 
          i === index ? { ...agent, status: 'running' } : agent
        )
      )

      // Simulate progress
      const startTime = Date.now()
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / duration) * 100, 100)
        
        setAgents(prevAgents => 
          prevAgents.map((agent, i) => 
            i === index ? { ...agent, progress } : agent
          )
        )

        if (elapsed >= duration) {
          clearInterval(progressInterval)
          
          // Complete the agent
          setAgents(prevAgents => 
            prevAgents.map((agent, i) => 
              i === index ? { ...agent, status: 'completed', progress: 100 } : agent
            )
          )
          
          resolve()
        }
      }, 50)
    })
  }

  const resetWorkflow = () => {
    setIsRunning(false)
    setStartTime(null)
    setAgents(prevAgents => 
      prevAgents.map(agent => ({ ...agent, status: 'pending', progress: 0 }))
    )
  }

  const getStatusIcon = (status: WorkflowAgent['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <CheckCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
    }
  }

  const getStatusColor = (status: WorkflowAgent['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      default:
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
    }
  }

  const totalAgents = agents.length
  const completedAgents = agents.filter(a => a.status === 'completed').length
  const runningAgents = agents.filter(a => a.status === 'running').length

  const totalEstimatedTime = parallel 
    ? Math.max(...initialAgents.map(a => parseDuration(a.duration)))
    : initialAgents.reduce((sum, a) => sum + parseDuration(a.duration), 0)

  const elapsedTime = startTime ? currentTime - startTime : 0
  const overallProgress = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {parallel ? 'Parallel' : 'Sequential'} execution • {totalAgents} agents
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {(elapsedTime / 1000).toFixed(1)}s / {(totalEstimatedTime / 1000).toFixed(1)}s
            </div>
          )}
          
          <button
            onClick={isRunning ? resetWorkflow : runWorkflow}
            disabled={false}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isRunning ? (
              <>
                <div className="w-3 h-3 bg-white rounded-sm" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overall Progress */}
      {isRunning && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Overall Progress
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {completedAgents}/{totalAgents} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div className={`grid gap-4 ${parallel ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {agents.map((agent, index) => (
          <div key={index} className="relative">
            {/* Connection Line for Sequential */}
            {!parallel && index < agents.length - 1 && (
              <div className="absolute left-6 top-20 w-0.5 h-8 bg-gray-300 dark:bg-gray-600 z-0" />
            )}
            
            <div className={`
              relative z-10 p-4 rounded-lg border-2 transition-all duration-300
              ${getStatusColor(agent.status)}
            `}>
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="mt-1">
                  {getStatusIcon(agent.status)}
                </div>
                
                {/* Agent Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {agent.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {agent.task}
                  </p>
                  
                  {/* Duration Badge */}
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      <Clock className="w-3 h-3" />
                      {agent.duration}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  {agent.status === 'running' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {Math.round(agent.progress || 0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${agent.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sequence Number for Sequential */}
                {!parallel && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {totalAgents}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Total Agents</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {runningAgents}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Running</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {completedAgents}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {(totalEstimatedTime / 1000).toFixed(1)}s
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {parallel ? 'Max Time' : 'Total Time'}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Message */}
      {!isRunning && completedAgents === totalAgents && completedAgents > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Workflow completed successfully! All agents finished their tasks.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}