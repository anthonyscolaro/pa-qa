#!/usr/bin/env python3
"""
Allure Test Trend Analysis Script

Analyzes historical test data to provide insights into test quality trends,
performance metrics, and failure patterns over time.

Features:
- Historical data processing from Allure results
- Trend analysis for test execution metrics
- Failure pattern detection and categorization
- Performance regression analysis
- Flaky test identification
- Test stability metrics
- Visual trend charts and reports
- Integration with notification system
"""

import argparse
import json
import os
import sys
import datetime
import statistics
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from collections import defaultdict, Counter
import re

# Try to import optional dependencies
try:
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    from matplotlib.backends.backend_agg import FigureCanvasAgg
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("Warning: matplotlib not available. Visual charts will be disabled.")

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    print("Warning: pandas not available. Advanced analysis features will be limited.")


@dataclass
class TestResult:
    """Represents a single test result"""
    name: str
    status: str
    duration: float
    timestamp: datetime.datetime
    build_number: str
    branch: str
    framework: str
    error_message: Optional[str] = None
    category: Optional[str] = None


@dataclass
class BuildSummary:
    """Represents a build summary"""
    build_number: str
    timestamp: datetime.datetime
    branch: str
    framework: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    skipped_tests: int
    broken_tests: int
    duration: float
    pass_rate: float


@dataclass
class TrendMetrics:
    """Represents trend analysis metrics"""
    average_pass_rate: float
    pass_rate_trend: str  # "improving", "declining", "stable"
    average_duration: float
    duration_trend: str
    total_builds: int
    flaky_tests: List[str]
    most_failed_tests: List[Tuple[str, int]]
    failure_categories: Dict[str, int]
    performance_regressions: List[str]


class TrendAnalyzer:
    """Main trend analysis class"""
    
    def __init__(self, project_name: str, framework: str = "auto"):
        self.project_name = project_name
        self.framework = framework
        self.test_results: List[TestResult] = []
        self.build_summaries: List[BuildSummary] = []
        
    def load_results_from_directory(self, results_dir: Path) -> None:
        """Load test results from Allure results directory"""
        print(f"Loading results from: {results_dir}")
        
        if not results_dir.exists():
            print(f"Results directory does not exist: {results_dir}")
            return
            
        # Load test results from JSON files
        for json_file in results_dir.glob("**/*-result.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    result = self._parse_test_result(data)
                    if result:
                        self.test_results.append(result)
            except Exception as e:
                print(f"Error loading {json_file}: {e}")
        
        # Load build summary information
        self._load_build_summaries(results_dir)
        
        print(f"Loaded {len(self.test_results)} test results from {len(self.build_summaries)} builds")
    
    def load_history_from_directory(self, history_dir: Path) -> None:
        """Load historical data from Allure history directory"""
        print(f"Loading history from: {history_dir}")
        
        if not history_dir.exists():
            print(f"History directory does not exist: {history_dir}")
            return
            
        # Load history data
        history_file = history_dir / "history.json"
        if history_file.exists():
            try:
                with open(history_file, 'r', encoding='utf-8') as f:
                    history_data = json.load(f)
                    self._parse_history_data(history_data)
            except Exception as e:
                print(f"Error loading history: {e}")
    
    def _parse_test_result(self, data: Dict[str, Any]) -> Optional[TestResult]:
        """Parse a single test result from Allure JSON"""
        try:
            # Extract basic information
            name = data.get('fullName', data.get('name', 'Unknown'))
            status = data.get('status', 'unknown').lower()
            
            # Extract timing information
            start_time = data.get('start', 0)
            stop_time = data.get('stop', 0)
            duration = (stop_time - start_time) / 1000.0  # Convert to seconds
            
            # Convert timestamp
            timestamp = datetime.datetime.fromtimestamp(start_time / 1000.0) if start_time else datetime.datetime.now()
            
            # Extract metadata
            labels = {label['name']: label['value'] for label in data.get('labels', [])}
            build_number = labels.get('build', 'unknown')
            branch = labels.get('branch', 'unknown')
            framework = labels.get('framework', self.framework)
            
            # Extract error information
            error_message = None
            if 'statusDetails' in data and 'message' in data['statusDetails']:
                error_message = data['statusDetails']['message']
            
            # Categorize the test
            category = self._categorize_test(name, status, error_message)
            
            return TestResult(
                name=name,
                status=status,
                duration=duration,
                timestamp=timestamp,
                build_number=build_number,
                branch=branch,
                framework=framework,
                error_message=error_message,
                category=category
            )
        except Exception as e:
            print(f"Error parsing test result: {e}")
            return None
    
    def _load_build_summaries(self, results_dir: Path) -> None:
        """Load build summary information"""
        # Try to load from executor.json and environment.properties
        executor_file = results_dir / "executor.json"
        env_file = results_dir / "environment.properties"
        
        build_info = {}
        
        if executor_file.exists():
            try:
                with open(executor_file, 'r', encoding='utf-8') as f:
                    executor_data = json.load(f)
                    build_info.update(executor_data)
            except Exception as e:
                print(f"Error loading executor.json: {e}")
        
        if env_file.exists():
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        if '=' in line:
                            key, value = line.strip().split('=', 1)
                            build_info[key.lower().replace('.', '_')] = value
            except Exception as e:
                print(f"Error loading environment.properties: {e}")
        
        # Aggregate test results by build
        builds = defaultdict(list)
        for result in self.test_results:
            builds[result.build_number].append(result)
        
        for build_number, results in builds.items():
            if not results:
                continue
                
            # Calculate summary statistics
            total_tests = len(results)
            passed_tests = sum(1 for r in results if r.status == 'passed')
            failed_tests = sum(1 for r in results if r.status == 'failed')
            skipped_tests = sum(1 for r in results if r.status == 'skipped')
            broken_tests = sum(1 for r in results if r.status == 'broken')
            
            total_duration = sum(r.duration for r in results)
            pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
            
            # Use the latest timestamp from the results
            timestamp = max(r.timestamp for r in results)
            branch = results[0].branch
            framework = results[0].framework
            
            summary = BuildSummary(
                build_number=build_number,
                timestamp=timestamp,
                branch=branch,
                framework=framework,
                total_tests=total_tests,
                passed_tests=passed_tests,
                failed_tests=failed_tests,
                skipped_tests=skipped_tests,
                broken_tests=broken_tests,
                duration=total_duration,
                pass_rate=pass_rate
            )
            
            self.build_summaries.append(summary)
        
        # Sort by timestamp
        self.build_summaries.sort(key=lambda x: x.timestamp)
    
    def _parse_history_data(self, history_data: List[Dict[str, Any]]) -> None:
        """Parse historical data from Allure history JSON"""
        for build_data in history_data:
            try:
                # Extract build information
                build_number = build_data.get('buildOrder', 'unknown')
                timestamp_ms = build_data.get('time', {}).get('start', 0)
                timestamp = datetime.datetime.fromtimestamp(timestamp_ms / 1000.0) if timestamp_ms else datetime.datetime.now()
                
                # Extract statistics
                statistic = build_data.get('statistic', {})
                total_tests = statistic.get('total', 0)
                passed_tests = statistic.get('passed', 0)
                failed_tests = statistic.get('failed', 0)
                skipped_tests = statistic.get('skipped', 0)
                broken_tests = statistic.get('broken', 0)
                
                duration = build_data.get('time', {}).get('duration', 0) / 1000.0  # Convert to seconds
                pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
                
                summary = BuildSummary(
                    build_number=str(build_number),
                    timestamp=timestamp,
                    branch="unknown",  # Not available in history
                    framework=self.framework,
                    total_tests=total_tests,
                    passed_tests=passed_tests,
                    failed_tests=failed_tests,
                    skipped_tests=skipped_tests,
                    broken_tests=broken_tests,
                    duration=duration,
                    pass_rate=pass_rate
                )
                
                self.build_summaries.append(summary)
                
            except Exception as e:
                print(f"Error parsing history entry: {e}")
    
    def _categorize_test(self, name: str, status: str, error_message: Optional[str]) -> str:
        """Categorize test based on name, status, and error message"""
        if status == 'passed':
            return 'passed'
        
        if not error_message:
            return 'unknown_failure'
        
        error_lower = error_message.lower()
        
        # Product defects
        if any(keyword in error_lower for keyword in ['assertion', 'expect', 'should']):
            return 'product_defect'
        
        # Test defects
        if any(keyword in error_lower for keyword in ['typeerror', 'referenceerror', 'syntaxerror', 'importerror']):
            return 'test_defect'
        
        # Infrastructure problems
        if any(keyword in error_lower for keyword in ['timeout', 'connection', 'network', 'server']):
            return 'infrastructure'
        
        # Performance issues
        if any(keyword in error_lower for keyword in ['performance', 'slow', 'memory']):
            return 'performance'
        
        return 'other_failure'
    
    def analyze_trends(self, days_back: int = 30) -> TrendMetrics:
        """Analyze trends over the specified number of days"""
        print(f"Analyzing trends for the last {days_back} days")
        
        if not self.build_summaries:
            print("No build data available for trend analysis")
            return TrendMetrics(
                average_pass_rate=0,
                pass_rate_trend="unknown",
                average_duration=0,
                duration_trend="unknown",
                total_builds=0,
                flaky_tests=[],
                most_failed_tests=[],
                failure_categories={},
                performance_regressions=[]
            )
        
        # Filter builds by date range
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
        recent_builds = [b for b in self.build_summaries if b.timestamp >= cutoff_date]
        
        if not recent_builds:
            print("No recent builds found")
            return TrendMetrics(
                average_pass_rate=0,
                pass_rate_trend="unknown",
                average_duration=0,
                duration_trend="unknown",
                total_builds=0,
                flaky_tests=[],
                most_failed_tests=[],
                failure_categories={},
                performance_regressions=[]
            )
        
        # Calculate averages
        pass_rates = [b.pass_rate for b in recent_builds]
        durations = [b.duration for b in recent_builds]
        
        average_pass_rate = statistics.mean(pass_rates) if pass_rates else 0
        average_duration = statistics.mean(durations) if durations else 0
        
        # Analyze trends
        pass_rate_trend = self._analyze_trend(pass_rates)
        duration_trend = self._analyze_trend(durations, reverse=True)  # Lower duration is better
        
        # Analyze flaky tests
        flaky_tests = self._identify_flaky_tests(days_back)
        
        # Analyze most failed tests
        most_failed_tests = self._identify_most_failed_tests(days_back)
        
        # Analyze failure categories
        failure_categories = self._analyze_failure_categories(days_back)
        
        # Analyze performance regressions
        performance_regressions = self._identify_performance_regressions(days_back)
        
        return TrendMetrics(
            average_pass_rate=average_pass_rate,
            pass_rate_trend=pass_rate_trend,
            average_duration=average_duration,
            duration_trend=duration_trend,
            total_builds=len(recent_builds),
            flaky_tests=flaky_tests,
            most_failed_tests=most_failed_tests,
            failure_categories=failure_categories,
            performance_regressions=performance_regressions
        )
    
    def _analyze_trend(self, values: List[float], reverse: bool = False) -> str:
        """Analyze if a series of values is improving, declining, or stable"""
        if len(values) < 3:
            return "unknown"
        
        # Calculate trend using simple linear regression slope
        n = len(values)
        x_mean = (n - 1) / 2
        y_mean = statistics.mean(values)
        
        numerator = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return "stable"
        
        slope = numerator / denominator
        
        # Determine trend direction
        threshold = 0.1  # Minimum slope to consider significant
        
        if reverse:
            slope = -slope  # Reverse for metrics where lower is better
        
        if slope > threshold:
            return "improving"
        elif slope < -threshold:
            return "declining"
        else:
            return "stable"
    
    def _identify_flaky_tests(self, days_back: int) -> List[str]:
        """Identify tests that have inconsistent results (flaky tests)"""
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
        recent_results = [r for r in self.test_results if r.timestamp >= cutoff_date]
        
        # Group results by test name
        test_results = defaultdict(list)
        for result in recent_results:
            test_results[result.name].append(result.status)
        
        flaky_tests = []
        for test_name, statuses in test_results.items():
            if len(set(statuses)) > 1 and len(statuses) >= 3:  # At least 3 runs with different outcomes
                # Calculate flakiness ratio
                status_counts = Counter(statuses)
                minority_count = min(status_counts.values())
                flakiness_ratio = minority_count / len(statuses)
                
                # Consider flaky if minority status appears in at least 20% of runs
                if flakiness_ratio >= 0.2:
                    flaky_tests.append(test_name)
        
        return flaky_tests[:10]  # Return top 10 flaky tests
    
    def _identify_most_failed_tests(self, days_back: int) -> List[Tuple[str, int]]:
        """Identify tests that fail most frequently"""
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
        recent_results = [r for r in self.test_results if r.timestamp >= cutoff_date and r.status == 'failed']
        
        failure_counts = Counter(result.name for result in recent_results)
        return failure_counts.most_common(10)
    
    def _analyze_failure_categories(self, days_back: int) -> Dict[str, int]:
        """Analyze failure categories"""
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
        recent_results = [r for r in self.test_results if r.timestamp >= cutoff_date and r.status == 'failed']
        
        category_counts = Counter(result.category for result in recent_results if result.category)
        return dict(category_counts)
    
    def _identify_performance_regressions(self, days_back: int) -> List[str]:
        """Identify tests with performance regressions"""
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days_back)
        recent_results = [r for r in self.test_results if r.timestamp >= cutoff_date]
        
        # Group by test name and analyze duration trends
        test_durations = defaultdict(list)
        for result in recent_results:
            test_durations[result.name].append((result.timestamp, result.duration))
        
        regressions = []
        for test_name, duration_data in test_durations.items():
            if len(duration_data) < 5:  # Need at least 5 data points
                continue
                
            # Sort by timestamp
            duration_data.sort(key=lambda x: x[0])
            durations = [d[1] for d in duration_data]
            
            # Check if recent durations are significantly higher than earlier ones
            mid_point = len(durations) // 2
            early_avg = statistics.mean(durations[:mid_point])
            recent_avg = statistics.mean(durations[mid_point:])
            
            # Consider regression if recent average is 50% higher
            if recent_avg > early_avg * 1.5 and recent_avg > 1.0:  # At least 1 second
                regressions.append(test_name)
        
        return regressions[:10]  # Return top 10 performance regressions
    
    def generate_charts(self, output_dir: Path) -> None:
        """Generate trend charts"""
        if not HAS_MATPLOTLIB:
            print("Matplotlib not available, skipping chart generation")
            return
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        if not self.build_summaries:
            print("No build data available for chart generation")
            return
        
        # Prepare data
        dates = [b.timestamp for b in self.build_summaries]
        pass_rates = [b.pass_rate for b in self.build_summaries]
        durations = [b.duration for b in self.build_summaries]
        
        # Pass rate trend chart
        plt.figure(figsize=(12, 6))
        plt.subplot(1, 2, 1)
        plt.plot(dates, pass_rates, marker='o', linewidth=2, markersize=4)
        plt.title('Test Pass Rate Trend')
        plt.xlabel('Date')
        plt.ylabel('Pass Rate (%)')
        plt.ylim(0, 100)
        plt.grid(True, alpha=0.3)
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
        plt.gca().xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates) // 10)))
        plt.xticks(rotation=45)
        
        # Duration trend chart
        plt.subplot(1, 2, 2)
        plt.plot(dates, durations, marker='o', linewidth=2, markersize=4, color='orange')
        plt.title('Test Duration Trend')
        plt.xlabel('Date')
        plt.ylabel('Duration (seconds)')
        plt.grid(True, alpha=0.3)
        plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m/%d'))
        plt.gca().xaxis.set_major_locator(mdates.DayLocator(interval=max(1, len(dates) // 10)))
        plt.xticks(rotation=45)
        
        plt.tight_layout()
        plt.savefig(output_dir / 'trend_charts.png', dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"Charts saved to {output_dir}/trend_charts.png")
    
    def generate_report(self, output_dir: Path, format_type: str = "json") -> None:
        """Generate trend analysis report"""
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Analyze trends for different time periods
        trends_7d = self.analyze_trends(7)
        trends_30d = self.analyze_trends(30)
        trends_90d = self.analyze_trends(90)
        
        report_data = {
            "project": self.project_name,
            "framework": self.framework,
            "generated_at": datetime.datetime.now().isoformat(),
            "summary": {
                "total_builds": len(self.build_summaries),
                "total_test_results": len(self.test_results),
                "date_range": {
                    "start": min(b.timestamp for b in self.build_summaries).isoformat() if self.build_summaries else None,
                    "end": max(b.timestamp for b in self.build_summaries).isoformat() if self.build_summaries else None,
                }
            },
            "trends": {
                "7_days": asdict(trends_7d),
                "30_days": asdict(trends_30d),
                "90_days": asdict(trends_90d),
            }
        }
        
        if format_type.lower() == "json":
            # Generate JSON report
            with open(output_dir / "trend_analysis.json", 'w') as f:
                json.dump(report_data, f, indent=2, default=str)
            print(f"JSON report saved to {output_dir}/trend_analysis.json")
        
        if format_type.lower() == "html" or format_type.lower() == "all":
            # Generate HTML report
            html_content = self._generate_html_report(report_data)
            with open(output_dir / "trend_analysis.html", 'w') as f:
                f.write(html_content)
            print(f"HTML report saved to {output_dir}/trend_analysis.html")
    
    def _generate_html_report(self, report_data: Dict[str, Any]) -> str:
        """Generate HTML trend analysis report"""
        html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trend Analysis - {project}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1, h2, h3 {{ color: #333; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
        .metric {{ background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff; }}
        .metric h4 {{ margin: 0 0 10px 0; color: #666; }}
        .metric .value {{ font-size: 24px; font-weight: bold; color: #333; }}
        .trend-improving {{ border-left-color: #28a745; }}
        .trend-declining {{ border-left-color: #dc3545; }}
        .trend-stable {{ border-left-color: #ffc107; }}
        .flaky-tests, .failed-tests {{ background: #fff3cd; padding: 15px; border-radius: 6px; margin: 10px 0; }}
        .categories {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }}
        .category {{ background: #e9ecef; padding: 10px; border-radius: 4px; text-align: center; }}
        table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
        th, td {{ padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f8f9fa; }}
        .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Test Trend Analysis Report</h1>
        <p><strong>Project:</strong> {project} | <strong>Framework:</strong> {framework}</p>
        <p><strong>Generated:</strong> {generated_at} | <strong>Data Range:</strong> {date_range}</p>
        
        <h2>30-Day Trend Summary</h2>
        <div class="summary">
            <div class="metric trend-{pass_rate_trend}">
                <h4>Average Pass Rate</h4>
                <div class="value">{average_pass_rate:.1f}%</div>
                <small>Trend: {pass_rate_trend}</small>
            </div>
            <div class="metric trend-{duration_trend}">
                <h4>Average Duration</h4>
                <div class="value">{average_duration:.1f}s</div>
                <small>Trend: {duration_trend}</small>
            </div>
            <div class="metric">
                <h4>Total Builds</h4>
                <div class="value">{total_builds}</div>
            </div>
            <div class="metric">
                <h4>Flaky Tests</h4>
                <div class="value">{flaky_count}</div>
            </div>
        </div>
        
        {flaky_tests_section}
        {failed_tests_section}
        {categories_section}
        {performance_section}
        
        <div class="footer">
            <p>Generated by PA-QA Trend Analysis | Report data is based on the last 30 days</p>
        </div>
    </div>
</body>
</html>
        """
        
        trends_30d = report_data["trends"]["30_days"]
        
        # Format data for template
        template_data = {
            "project": report_data["project"],
            "framework": report_data["framework"],
            "generated_at": report_data["generated_at"],
            "date_range": f"{report_data['summary']['date_range']['start']} to {report_data['summary']['date_range']['end']}" if report_data['summary']['date_range']['start'] else "No data",
            "average_pass_rate": trends_30d["average_pass_rate"],
            "pass_rate_trend": trends_30d["pass_rate_trend"],
            "average_duration": trends_30d["average_duration"],
            "duration_trend": trends_30d["duration_trend"],
            "total_builds": trends_30d["total_builds"],
            "flaky_count": len(trends_30d["flaky_tests"]),
        }
        
        # Generate sections
        flaky_tests_section = ""
        if trends_30d["flaky_tests"]:
            flaky_tests_section = f"""
            <h3>Flaky Tests</h3>
            <div class="flaky-tests">
                <p>Tests with inconsistent results that may need attention:</p>
                <ul>
                    {"".join(f"<li>{test}</li>" for test in trends_30d["flaky_tests"])}
                </ul>
            </div>
            """
        
        failed_tests_section = ""
        if trends_30d["most_failed_tests"]:
            failed_tests_section = f"""
            <h3>Most Failed Tests</h3>
            <div class="failed-tests">
                <table>
                    <tr><th>Test Name</th><th>Failure Count</th></tr>
                    {"".join(f"<tr><td>{test}</td><td>{count}</td></tr>" for test, count in trends_30d["most_failed_tests"])}
                </table>
            </div>
            """
        
        categories_section = ""
        if trends_30d["failure_categories"]:
            categories_section = f"""
            <h3>Failure Categories</h3>
            <div class="categories">
                {"".join(f'<div class="category"><strong>{category}</strong><br>{count} failures</div>' for category, count in trends_30d["failure_categories"].items())}
            </div>
            """
        
        performance_section = ""
        if trends_30d["performance_regressions"]:
            performance_section = f"""
            <h3>Performance Regressions</h3>
            <div class="flaky-tests">
                <p>Tests showing performance degradation:</p>
                <ul>
                    {"".join(f"<li>{test}</li>" for test in trends_30d["performance_regressions"])}
                </ul>
            </div>
            """
        
        template_data.update({
            "flaky_tests_section": flaky_tests_section,
            "failed_tests_section": failed_tests_section,
            "categories_section": categories_section,
            "performance_section": performance_section,
        })
        
        return html_template.format(**template_data)


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Analyze Allure test trends")
    parser.add_argument("--results", type=Path, default="allure-results", 
                       help="Results directory")
    parser.add_argument("--history", type=Path, default="allure-history",
                       help="History directory")
    parser.add_argument("--output", type=Path, default="trends",
                       help="Output directory")
    parser.add_argument("--project", default="unknown-project",
                       help="Project name")
    parser.add_argument("--framework", default="auto",
                       help="Test framework")
    parser.add_argument("--format", choices=["json", "html", "all"], default="all",
                       help="Output format")
    parser.add_argument("--days", type=int, default=30,
                       help="Days to analyze")
    parser.add_argument("--charts", action="store_true",
                       help="Generate trend charts")
    parser.add_argument("--verbose", action="store_true",
                       help="Verbose output")
    
    args = parser.parse_args()
    
    if args.verbose:
        print(f"Starting trend analysis for project: {args.project}")
        print(f"Results directory: {args.results}")
        print(f"History directory: {args.history}")
        print(f"Output directory: {args.output}")
    
    # Initialize analyzer
    analyzer = TrendAnalyzer(args.project, args.framework)
    
    # Load data
    analyzer.load_results_from_directory(args.results)
    analyzer.load_history_from_directory(args.history)
    
    # Generate reports
    analyzer.generate_report(args.output, args.format)
    
    if args.charts:
        analyzer.generate_charts(args.output)
    
    # Print summary
    trends = analyzer.analyze_trends(args.days)
    print(f"\nTrend Analysis Summary ({args.days} days):")
    print(f"  Average Pass Rate: {trends.average_pass_rate:.1f}% ({trends.pass_rate_trend})")
    print(f"  Average Duration: {trends.average_duration:.1f}s ({trends.duration_trend})")
    print(f"  Total Builds: {trends.total_builds}")
    print(f"  Flaky Tests: {len(trends.flaky_tests)}")
    print(f"  Most Failed Tests: {len(trends.most_failed_tests)}")
    
    if trends.flaky_tests:
        print(f"\nTop Flaky Tests:")
        for test in trends.flaky_tests[:5]:
            print(f"  - {test}")
    
    if trends.performance_regressions:
        print(f"\nPerformance Regressions:")
        for test in trends.performance_regressions[:5]:
            print(f"  - {test}")


if __name__ == "__main__":
    main()