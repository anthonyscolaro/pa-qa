// MDX Components for PA-QA Testing Showcase
// Export all interactive components for use in MDX content

export { default as LiveCodeEditor } from './LiveCodeEditor';
export { default as TestRunner } from './TestRunner';
export { default as CoverageReport } from './CoverageReport';
export { default as MockServiceConfig } from './MockServiceConfig';
export { default as PerformanceChart } from './PerformanceChart';
export { default as TestExample } from './TestExample';
export { default as MultiAgentDemo } from './MultiAgentDemo';

// New interactive components
export { CodeDemo } from './CodeDemo';
export { TabbedCodeDemo } from './TabbedCodeDemo';
export { InteractiveSelector } from './InteractiveSelector';
export { WorkflowDiagram } from './WorkflowDiagram';

// Placeholder components for MDX content
export * from './placeholder-components';

// Import components for the convenience object
import LiveCodeEditor from './LiveCodeEditor';
import TestRunner from './TestRunner';
import CoverageReport from './CoverageReport';
import MockServiceConfig from './MockServiceConfig';
import PerformanceChart from './PerformanceChart';
import TestExample from './TestExample';
import MultiAgentDemo from './MultiAgentDemo';
import { CodeDemo } from './CodeDemo';
import { TabbedCodeDemo } from './TabbedCodeDemo';
import { InteractiveSelector } from './InteractiveSelector';
import { WorkflowDiagram } from './WorkflowDiagram';

// Convenience object for batch imports
export const MDXComponents = {
  LiveCodeEditor: LiveCodeEditor,
  TestRunner: TestRunner,
  CoverageReport: CoverageReport,
  MockServiceConfig: MockServiceConfig,
  PerformanceChart: PerformanceChart,
  TestExample: TestExample,
  MultiAgentDemo: MultiAgentDemo,
  CodeDemo: CodeDemo,
  TabbedCodeDemo: TabbedCodeDemo,
  InteractiveSelector: InteractiveSelector,
  WorkflowDiagram: WorkflowDiagram,
};

// Component categories for documentation
export const ComponentCategories = {
  editors: ['LiveCodeEditor'],
  testing: ['TestRunner', 'TestExample'],
  visualization: ['CoverageReport', 'PerformanceChart'],
  configuration: ['MockServiceConfig'],
  workflow: ['MultiAgentDemo'],
} as const;

// Default props for quick setup
export const DefaultProps = {
  LiveCodeEditor: {
    language: 'typescript',
    height: 400,
    readonly: false,
    showOutput: true,
  },
  TestRunner: {
    framework: 'jest' as const,
    autoRun: false,
  },
  CoverageReport: {
    showDetails: true,
    interactive: true,
  },
  MockServiceConfig: {
    baseUrl: 'http://localhost:3000',
  },
  PerformanceChart: {
    height: 400,
    showLegend: true,
    autoRefresh: false,
  },
  TestExample: {
    difficulty: 'beginner' as const,
    category: 'Unit Testing',
  },
  MultiAgentDemo: {
    workflow: 'test-generation' as const,
    autoStart: false,
    speed: 1,
  },
} as const;