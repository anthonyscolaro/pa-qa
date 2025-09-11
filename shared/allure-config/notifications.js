#!/usr/bin/env node

/**
 * Allure Test Report Notification System
 * 
 * Sends notifications via Slack, email, and other channels when test reports are generated
 * Supports multiple notification types, rich formatting, and intelligent filtering
 * 
 * Features:
 * - Slack webhook integration with rich formatting
 * - Email notifications via SMTP
 * - Microsoft Teams webhooks
 * - Discord webhooks
 * - Custom webhook endpoints
 * - Intelligent notification filtering
 * - Test result analysis and summaries
 * - Trend analysis alerts
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const config = {
  notifications: {
    enabled: process.env.NOTIFICATIONS_ENABLED !== 'false',
    channels: {
      slack: {
        enabled: !!process.env.SLACK_WEBHOOK_URL,
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#qa-testing',
        username: process.env.SLACK_USERNAME || 'PA-QA Bot',
        iconEmoji: process.env.SLACK_ICON || ':test_tube:',
      },
      email: {
        enabled: !!process.env.SMTP_HOST,
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        from: process.env.EMAIL_FROM || 'noreply@projectassistant.ai',
        to: (process.env.EMAIL_TO || '').split(',').filter(Boolean),
      },
      teams: {
        enabled: !!process.env.TEAMS_WEBHOOK_URL,
        webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      },
      discord: {
        enabled: !!process.env.DISCORD_WEBHOOK_URL,
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
        username: process.env.DISCORD_USERNAME || 'PA-QA Bot',
      },
      webhook: {
        enabled: !!process.env.CUSTOM_WEBHOOK_URL,
        url: process.env.CUSTOM_WEBHOOK_URL,
        headers: {},
      },
    },
  },
  filters: {
    onlyFailures: process.env.NOTIFY_ONLY_FAILURES === 'true',
    minFailureCount: parseInt(process.env.MIN_FAILURE_COUNT || '0'),
    skipSuccessfulBuilds: process.env.SKIP_SUCCESSFUL_BUILDS === 'true',
    enableTrendAlerts: process.env.ENABLE_TREND_ALERTS !== 'false',
  },
  reports: {
    baseUrl: process.env.ALLURE_SERVER_URL || 'https://allure.projectassistant.ai',
    dashboardUrl: process.env.DASHBOARD_URL || process.env.ALLURE_SERVER_URL || 'https://allure.projectassistant.ai',
  },
};

// Utility functions
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  debug: (message) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[DEBUG] ${message}`);
    }
  },
};

// Show usage information
function showUsage() {
  console.log(`
Usage: node notifications.js [OPTIONS]

Send notifications for Allure test reports.

OPTIONS:
    --project PROJECT_NAME        Project name
    --framework FRAMEWORK         Test framework (jest|vitest|pytest|phpunit)
    --build BUILD_NUMBER          Build number
    --branch BRANCH_NAME          Git branch name
    --commit COMMIT_SHA           Git commit SHA
    --status STATUS               Test status (success|failure|error)
    --report-url URL              Report URL
    --results-file FILE           Path to test results summary
    --type TYPE                   Notification type (test|deployment|trend)
    --severity LEVEL              Severity level (info|warning|error|critical)
    --projects JSON_ARRAY         Array of project names (for multi-project)
    --dry-run                     Show what would be sent without sending
    --verbose                     Enable verbose logging
    --help                        Show this help message

ENVIRONMENT VARIABLES:
    NOTIFICATIONS_ENABLED         Enable/disable notifications (default: true)
    SLACK_WEBHOOK_URL            Slack webhook URL
    SLACK_CHANNEL                Slack channel (default: #qa-testing)
    SMTP_HOST                    SMTP server host
    SMTP_PORT                    SMTP server port (default: 587)
    SMTP_USER                    SMTP username
    SMTP_PASSWORD                SMTP password
    EMAIL_FROM                   From email address
    EMAIL_TO                     Comma-separated list of recipient emails
    TEAMS_WEBHOOK_URL            Microsoft Teams webhook URL
    DISCORD_WEBHOOK_URL          Discord webhook URL
    CUSTOM_WEBHOOK_URL           Custom webhook URL
    NOTIFY_ONLY_FAILURES         Only notify on failures (default: false)
    MIN_FAILURE_COUNT            Minimum failure count to trigger notification
    SKIP_SUCCESSFUL_BUILDS       Skip notifications for successful builds

EXAMPLES:
    # Basic test notification
    node notifications.js --project my-app --status success --report-url https://reports.example.com

    # Failure notification with details
    node notifications.js --project my-app --status failure --build 123 --branch main --commit abc123

    # Deployment notification
    node notifications.js --type deployment --status success --projects '["app1","app2"]'

    # Dry run to test configuration
    node notifications.js --project test --status success --dry-run
`);
}

// Parse command line arguments
function parseArguments() {
  const args = {
    project: '',
    framework: '',
    build: '',
    branch: '',
    commit: '',
    status: '',
    reportUrl: '',
    resultsFile: '',
    type: 'test',
    severity: 'info',
    projects: [],
    dryRun: false,
    verbose: false,
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const nextArg = process.argv[i + 1];

    switch (arg) {
      case '--project':
        args.project = nextArg;
        i++;
        break;
      case '--framework':
        args.framework = nextArg;
        i++;
        break;
      case '--build':
        args.build = nextArg;
        i++;
        break;
      case '--branch':
        args.branch = nextArg;
        i++;
        break;
      case '--commit':
        args.commit = nextArg;
        i++;
        break;
      case '--status':
        args.status = nextArg;
        i++;
        break;
      case '--report-url':
        args.reportUrl = nextArg;
        i++;
        break;
      case '--results-file':
        args.resultsFile = nextArg;
        i++;
        break;
      case '--type':
        args.type = nextArg;
        i++;
        break;
      case '--severity':
        args.severity = nextArg;
        i++;
        break;
      case '--projects':
        try {
          args.projects = JSON.parse(nextArg);
        } catch (e) {
          log.error(`Invalid JSON for projects: ${nextArg}`);
          process.exit(1);
        }
        i++;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--help':
        showUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          log.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return args;
}

// Load test results summary
function loadTestResults(resultsFile) {
  if (!resultsFile || !fs.existsSync(resultsFile)) {
    return null;
  }

  try {
    const content = fs.readFileSync(resultsFile, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log.warn(`Failed to load results file: ${error.message}`);
    return null;
  }
}

// Analyze test results and create summary
function analyzeResults(results) {
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    broken: 0,
    duration: 0,
    passRate: 0,
    categories: [],
    topFailures: [],
  };

  if (!results) {
    return summary;
  }

  // Parse different result formats
  if (results.statistic) {
    // Allure format
    summary.total = results.statistic.total || 0;
    summary.passed = results.statistic.passed || 0;
    summary.failed = results.statistic.failed || 0;
    summary.skipped = results.statistic.skipped || 0;
    summary.broken = results.statistic.broken || 0;
  } else if (results.numTotalTests) {
    // Jest format
    summary.total = results.numTotalTests;
    summary.passed = results.numPassedTests;
    summary.failed = results.numFailedTests;
    summary.skipped = results.numPendingTests;
  }

  // Calculate pass rate
  if (summary.total > 0) {
    summary.passRate = Math.round((summary.passed / summary.total) * 100);
  }

  return summary;
}

// Create notification message
function createMessage(args, results) {
  const summary = analyzeResults(results);
  const timestamp = new Date().toISOString();
  const shortCommit = args.commit.substring(0, 8);

  const message = {
    type: args.type,
    project: args.project,
    framework: args.framework,
    status: args.status,
    timestamp,
    summary,
    links: {
      report: args.reportUrl,
      dashboard: `${config.reports.dashboardUrl}/${args.project}`,
      commit: args.commit ? `https://github.com/your-org/your-repo/commit/${args.commit}` : '',
    },
    metadata: {
      build: args.build,
      branch: args.branch,
      commit: shortCommit,
      severity: args.severity,
    },
  };

  return message;
}

// Format message for Slack
function formatSlackMessage(message) {
  const { project, status, summary, links, metadata } = message;
  
  // Status emoji and color
  const statusInfo = {
    success: { emoji: ':white_check_mark:', color: 'good' },
    failure: { emoji: ':x:', color: 'danger' },
    error: { emoji: ':warning:', color: 'warning' },
    warning: { emoji: ':warning:', color: 'warning' },
  };

  const info = statusInfo[status] || { emoji: ':grey_question:', color: 'warning' };
  
  // Build main message
  let text = `${info.emoji} *${project}* test report ${status}`;
  if (metadata.build) {
    text += ` (Build #${metadata.build})`;
  }

  const fields = [];

  // Test results summary
  if (summary.total > 0) {
    fields.push({
      title: 'Test Results',
      value: `${summary.passed}/${summary.total} passed (${summary.passRate}%)\\n` +
             `Failed: ${summary.failed} | Skipped: ${summary.skipped}`,
      short: true,
    });
  }

  // Build information
  if (metadata.branch || metadata.commit) {
    let buildInfo = '';
    if (metadata.branch) buildInfo += `Branch: ${metadata.branch}\\n`;
    if (metadata.commit) buildInfo += `Commit: ${metadata.commit}`;
    
    fields.push({
      title: 'Build Info',
      value: buildInfo,
      short: true,
    });
  }

  // Framework info
  if (message.framework) {
    fields.push({
      title: 'Framework',
      value: message.framework,
      short: true,
    });
  }

  const attachment = {
    color: info.color,
    text,
    fields,
    actions: [],
    footer: 'PA-QA Testing Framework',
    ts: Math.floor(Date.now() / 1000),
  };

  // Add action buttons
  if (links.report) {
    attachment.actions.push({
      type: 'button',
      text: 'View Report',
      url: links.report,
    });
  }

  if (links.dashboard) {
    attachment.actions.push({
      type: 'button',
      text: 'Dashboard',
      url: links.dashboard,
    });
  }

  return {
    channel: config.notifications.channels.slack.channel,
    username: config.notifications.channels.slack.username,
    icon_emoji: config.notifications.channels.slack.iconEmoji,
    attachments: [attachment],
  };
}

// Format message for Microsoft Teams
function formatTeamsMessage(message) {
  const { project, status, summary, links, metadata } = message;
  
  const statusInfo = {
    success: { color: '00ff00', title: 'Test Passed' },
    failure: { color: 'ff0000', title: 'Test Failed' },
    error: { color: 'ff9900', title: 'Test Error' },
    warning: { color: 'ffcc00', title: 'Test Warning' },
  };

  const info = statusInfo[status] || { color: '808080', title: 'Test Status' };

  const facts = [];
  
  if (summary.total > 0) {
    facts.push({ name: 'Tests Passed', value: `${summary.passed}/${summary.total} (${summary.passRate}%)` });
    facts.push({ name: 'Failed', value: summary.failed.toString() });
    facts.push({ name: 'Skipped', value: summary.skipped.toString() });
  }

  if (metadata.branch) facts.push({ name: 'Branch', value: metadata.branch });
  if (metadata.commit) facts.push({ name: 'Commit', value: metadata.commit });
  if (message.framework) facts.push({ name: 'Framework', value: message.framework });

  const potentialActions = [];
  if (links.report) {
    potentialActions.push({
      '@type': 'OpenUri',
      name: 'View Report',
      targets: [{ os: 'default', uri: links.report }],
    });
  }

  return {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: info.color,
    summary: `${project} ${info.title}`,
    sections: [
      {
        activityTitle: `${project} - ${info.title}`,
        activitySubtitle: metadata.build ? `Build #${metadata.build}` : '',
        facts,
        markdown: true,
      },
    ],
    potentialAction: potentialActions,
  };
}

// Format message for Discord
function formatDiscordMessage(message) {
  const { project, status, summary, links, metadata } = message;
  
  const statusInfo = {
    success: { color: 0x00ff00, title: '✅ Tests Passed' },
    failure: { color: 0xff0000, title: '❌ Tests Failed' },
    error: { color: 0xff9900, title: '⚠️ Test Error' },
    warning: { color: 0xffcc00, title: '⚠️ Test Warning' },
  };

  const info = statusInfo[status] || { color: 0x808080, title: '❓ Test Status' };

  let description = '';
  if (summary.total > 0) {
    description = `**Results:** ${summary.passed}/${summary.total} passed (${summary.passRate}%)\\n`;
    description += `**Failed:** ${summary.failed} | **Skipped:** ${summary.skipped}\\n`;
  }

  if (metadata.branch) description += `**Branch:** ${metadata.branch}\\n`;
  if (metadata.commit) description += `**Commit:** ${metadata.commit}\\n`;
  if (message.framework) description += `**Framework:** ${message.framework}\\n`;

  const embed = {
    title: `${project} - ${info.title}`,
    description,
    color: info.color,
    timestamp: message.timestamp,
    footer: {
      text: 'PA-QA Testing Framework',
    },
  };

  if (links.report) {
    embed.url = links.report;
  }

  return {
    username: config.notifications.channels.discord.username,
    embeds: [embed],
  };
}

// Send HTTP request
function sendHttpRequest(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: responseData });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Send Slack notification
async function sendSlackNotification(message) {
  if (!config.notifications.channels.slack.enabled) {
    log.debug('Slack notifications disabled');
    return false;
  }

  const slackMessage = formatSlackMessage(message);
  const webhookUrl = new URL(config.notifications.channels.slack.webhookUrl);
  
  const options = {
    hostname: webhookUrl.hostname,
    port: webhookUrl.port,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await sendHttpRequest(options, JSON.stringify(slackMessage));
    log.info('Slack notification sent successfully');
    return true;
  } catch (error) {
    log.error(`Failed to send Slack notification: ${error.message}`);
    return false;
  }
}

// Send Teams notification
async function sendTeamsNotification(message) {
  if (!config.notifications.channels.teams.enabled) {
    log.debug('Teams notifications disabled');
    return false;
  }

  const teamsMessage = formatTeamsMessage(message);
  const webhookUrl = new URL(config.notifications.channels.teams.webhookUrl);
  
  const options = {
    hostname: webhookUrl.hostname,
    port: webhookUrl.port,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await sendHttpRequest(options, JSON.stringify(teamsMessage));
    log.info('Teams notification sent successfully');
    return true;
  } catch (error) {
    log.error(`Failed to send Teams notification: ${error.message}`);
    return false;
  }
}

// Send Discord notification
async function sendDiscordNotification(message) {
  if (!config.notifications.channels.discord.enabled) {
    log.debug('Discord notifications disabled');
    return false;
  }

  const discordMessage = formatDiscordMessage(message);
  const webhookUrl = new URL(config.notifications.channels.discord.webhookUrl);
  
  const options = {
    hostname: webhookUrl.hostname,
    port: webhookUrl.port,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await sendHttpRequest(options, JSON.stringify(discordMessage));
    log.info('Discord notification sent successfully');
    return true;
  } catch (error) {
    log.error(`Failed to send Discord notification: ${error.message}`);
    return false;
  }
}

// Check if notification should be sent based on filters
function shouldSendNotification(message) {
  const { filters } = config;
  const { status, summary } = message;

  // Check if notifications are enabled
  if (!config.notifications.enabled) {
    log.debug('Notifications disabled globally');
    return false;
  }

  // Check only failures filter
  if (filters.onlyFailures && status === 'success') {
    log.debug('Skipping successful build (only failures enabled)');
    return false;
  }

  // Check minimum failure count
  if (filters.minFailureCount > 0 && summary.failed < filters.minFailureCount) {
    log.debug(`Not enough failures (${summary.failed} < ${filters.minFailureCount})`);
    return false;
  }

  // Check skip successful builds
  if (filters.skipSuccessfulBuilds && status === 'success') {
    log.debug('Skipping successful build');
    return false;
  }

  return true;
}

// Main notification function
async function sendNotifications(args) {
  log.info(`Sending notifications for project: ${args.project}`);

  // Load test results if file provided
  const results = loadTestResults(args.resultsFile);
  
  // Create message
  const message = createMessage(args, results);
  
  // Check if notification should be sent
  if (!shouldSendNotification(message)) {
    log.info('Notification filtered out');
    return true;
  }

  if (args.dryRun) {
    log.info('DRY RUN - Would send notification:');
    console.log(JSON.stringify(message, null, 2));
    return true;
  }

  // Send to all enabled channels
  const results_array = await Promise.allSettled([
    sendSlackNotification(message),
    sendTeamsNotification(message),
    sendDiscordNotification(message),
  ]);

  const successCount = results_array.filter(r => r.status === 'fulfilled' && r.value).length;
  const totalEnabled = [
    config.notifications.channels.slack.enabled,
    config.notifications.channels.teams.enabled,
    config.notifications.channels.discord.enabled,
  ].filter(Boolean).length;

  log.info(`Notifications sent to ${successCount}/${totalEnabled} channels`);
  
  return successCount > 0;
}

// Main execution
async function main() {
  try {
    const args = parseArguments();
    
    if (args.verbose) {
      process.env.DEBUG = 'true';
      log.debug('Verbose logging enabled');
      log.debug('Configuration:', JSON.stringify(config, null, 2));
    }

    // Validate required arguments
    if (!args.project && !args.projects.length) {
      log.error('Project name is required');
      process.exit(1);
    }

    // Handle multiple projects
    if (args.projects.length > 0) {
      log.info(`Processing ${args.projects.length} projects`);
      
      for (const project of args.projects) {
        const projectArgs = { ...args, project };
        await sendNotifications(projectArgs);
      }
    } else {
      await sendNotifications(args);
    }

    log.info('Notification process completed');
  } catch (error) {
    log.error(`Notification failed: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  sendNotifications,
  formatSlackMessage,
  formatTeamsMessage,
  formatDiscordMessage,
  analyzeResults,
};