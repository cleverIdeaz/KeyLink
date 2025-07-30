#!/bin/bash

# KeyLink Relay Server Installer
echo "🎵 Installing KeyLink Relay Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create startup script
echo "🚀 Creating startup script..."
cat > start-relay.sh << 'EOF'
#!/bin/bash
echo "🎵 Starting KeyLink Relay Server..."
echo "   UDP: 239.255.0.1:7474"
echo "   WebSocket: ws://localhost:20801"
echo "   Press Ctrl+C to stop"
npm start
EOF

chmod +x start-relay.sh

# Create systemd service (Linux)
if command -v systemctl &> /dev/null; then
    echo "🔧 Creating systemd service..."
    sudo tee /etc/systemd/system/keylink-relay.service > /dev/null << EOF
[Unit]
Description=KeyLink Relay Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(which node) relay.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo "✅ Systemd service created. To enable:"
    echo "   sudo systemctl enable keylink-relay"
    echo "   sudo systemctl start keylink-relay"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "To start the relay server:"
echo "   ./start-relay.sh"
echo ""
echo "Or manually:"
echo "   npm start"
echo ""
echo "The relay server will:"
echo "   • Listen for UDP multicast on 239.255.0.1:7474"
echo "   • Accept WebSocket connections on ws://localhost:20801"
echo "   • Bridge between Max/MSP and web apps"
echo ""
echo "For more information, see DEPLOYMENT.md" 