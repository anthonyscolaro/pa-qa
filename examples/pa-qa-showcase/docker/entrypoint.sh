#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is up - continuing"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until nc -z redis 6379; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is up - continuing"

# Run database migrations if in production
if [ "$NODE_ENV" = "production" ]; then
  echo "Running database migrations..."
  npm run db:migrate
fi

# Seed database if in development
if [ "$NODE_ENV" = "development" ]; then
  echo "Seeding database..."
  npm run db:seed
fi

# Start the application
echo "Starting application..."
exec "$@"