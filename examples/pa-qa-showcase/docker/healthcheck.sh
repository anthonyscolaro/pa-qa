#!/bin/sh
set -e

# Check if the application is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "Health check passed - HTTP $HTTP_CODE"
  exit 0
else
  echo "Health check failed - HTTP $HTTP_CODE"
  exit 1
fi