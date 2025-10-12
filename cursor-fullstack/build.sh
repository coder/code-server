#!/bin/bash

echo "🚀 Building Cursor Full Stack AI IDE..."

# Create workspace directory
mkdir -p workspace

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

# Check backend
if curl -f http://localhost:3001/api/providers > /dev/null 2>&1; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "❌ Backend is not responding"
fi

# Check frontend
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend is not responding"
fi

# Check code-server
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ code-server is running on http://localhost:8081"
else
    echo "❌ code-server is not responding"
fi

echo ""
echo "🎉 Cursor Full Stack AI IDE is ready!"
echo ""
echo "📱 Access Points:"
echo "   Frontend:    http://localhost:5173"
echo "   Backend API: http://localhost:3001"
echo "   code-server: http://localhost:8081"
echo "   WebSocket:   ws://localhost:8080"
echo ""
echo "🔧 Next Steps:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Click 'AI Settings' to configure your API keys"
echo "   3. Start coding with AI assistance!"
echo ""
echo "📚 Documentation: README.md"
echo "🛑 To stop: docker-compose down"