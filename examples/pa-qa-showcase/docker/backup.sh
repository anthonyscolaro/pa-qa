#!/bin/sh
set -e

# Environment variables
BACKUP_DIR="/backups"
POSTGRES_HOST="postgres"
POSTGRES_PORT="5432"
POSTGRES_DB="pa_qa_prod"
POSTGRES_USER="postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database backup
echo "Creating backup: $BACKUP_FILE"
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
    -h "$POSTGRES_HOST" \
    -p "$POSTGRES_PORT" \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Remove old backups
    echo "Removing backups older than $RETENTION_DAYS days"
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    # List current backups
    echo "Current backups:"
    ls -la "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null || echo "No backups found"
else
    echo "Backup failed!"
    exit 1
fi