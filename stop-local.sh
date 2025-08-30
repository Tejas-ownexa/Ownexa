#!/bin/bash

echo "🛑 Stopping Ownexa Real Estate Management System (Local Docker)"

# Stop and remove containers
echo "🔨 Stopping services..."
docker-compose -f docker-compose.dev.yml down

# Remove unused images (optional)
read -p "Do you want to remove unused Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Removing unused images..."
    docker image prune -f
fi

echo "✅ Services stopped successfully!"
