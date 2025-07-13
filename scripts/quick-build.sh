#!/bin/bash
# Quick Statik-Server build and run

echo "🔥 Quick Building Statik-Server..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from statik-server directory"
    echo "💡 Run: cd $HOME/AscendNet/statik-server && ./quick-build.sh"
    exit 1
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t statikfintech/statik-server .

# Run the container
echo "🚀 Launching Statik-Server..."
docker run -d \
  --name statik-server \
  -p 8080:8080 \
  -p 8081:8081 \
  -p 50443:50443 \
  -v $HOME/AscendNet:/mnt/ascendnet \
  -v statik-data:/root/.statik \
  statikfintech/statik-server

echo ""
echo "✅ Statik-Server running!"
echo "💻 VS Code with Copilot: http://localhost:8080"
echo "🌐 Mesh VPN admin: http://localhost:8081"
echo "🤖 Copilot Chat enabled with persistent auth"
echo ""
echo "📝 Next steps:"
echo "1. Add GitHub token: docker exec statik-server sh -c 'echo YOUR_TOKEN > /root/.statik/keys/github-token'"
echo "2. Restart container: docker restart statik-server"
echo "3. Access VS Code: http://localhost:8080"
