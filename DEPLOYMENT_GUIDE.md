# KeyLink Zero-Config Deployment Guide

**Deploy your zero-config P2P music sync app without cloud dependencies**

## 🚀 Netlify Deployment

### **Automatic Deployment**
1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - Set build settings:
     - **Build command**: `cd demo/web && npm run build`
     - **Publish directory**: `demo/web/build`
     - **Base directory**: `demo/web`

2. **Environment Variables** (Optional)
   - No environment variables needed for zero-config deployment
   - The app works completely client-side

3. **Deploy**
   - Netlify will automatically build and deploy
   - Your app will be available at `https://your-app.netlify.app`

### **Manual Deployment**
```bash
# Clone repository
git clone https://github.com/cleverIdeaz/KeyLink.git
cd KeyLink

# Build the app
cd demo/web
npm install
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

## 🌐 Other Deployment Options

### **Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd demo/web
vercel
```

### **GitHub Pages**
```bash
# Add to package.json
{
  "homepage": "https://yourusername.github.io/KeyLink",
  "scripts": {
    "predeploy": "cd demo/web && npm run build",
    "deploy": "gh-pages -d demo/web/build"
  }
}

# Deploy
npm run deploy
```

### **Firebase Hosting**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Build and deploy
cd demo/web
npm run build
firebase deploy
```

## 🔧 Build Configuration

### **Netlify Configuration** (`netlify.toml`)
```toml
[build]
  base = "demo/web"
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### **Package.json Scripts**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

## 🎯 Zero-Config Features

### **What Works Out of the Box**
✅ **Automatic Peer Discovery** - Scans local network  
✅ **WebRTC Connections** - Direct peer-to-peer  
✅ **No Server Required** - Pure client-side  
✅ **Offline Capable** - Works without internet  
✅ **Cross-Platform** - Works on all devices  

### **What Requires Manual Setup**
⚠️ **Max/MSP Integration** - Requires relay server  
⚠️ **Advanced Features** - Some features need local relay  

## 🔍 Troubleshooting

### **Build Errors**
```bash
# Common issues and solutions

# 1. Node version issues
# Set NODE_VERSION in Netlify environment variables
NODE_VERSION = "18"

# 2. Build path issues
# Ensure build command is: cd demo/web && npm run build
# Ensure publish directory is: demo/web/build

# 3. Dependencies issues
# Run locally first: npm install && npm run build
```

### **Runtime Issues**
```javascript
// Check browser console for errors
// Common issues:

// 1. Service Worker not registered
// Solution: Ensure HTTPS or localhost

// 2. WebRTC not supported
// Solution: Use modern browser (Chrome, Firefox, Safari)

// 3. Network discovery failing
// Solution: Check firewall settings
```

### **Network Issues**
```bash
# For Max/MSP integration
# Start relay server manually:
cd relay
node relay-zero-config.js

# Check if relay is running:
curl http://localhost:20801/health
```

## 📱 Testing Your Deployment

### **Local Testing**
```bash
# Test locally first
cd demo/web
npm start
# Open http://localhost:3000
```

### **Multi-Device Testing**
1. **Deploy to Netlify**
2. **Open on multiple devices** on same network
3. **Verify peer discovery** - devices should connect automatically
4. **Test synchronization** - changes should sync between devices

### **Max/MSP Testing**
```bash
# Start relay server
cd relay
node relay-zero-config.js

# Build Max external
cd ../max/externals
./build_keylink.sh

# Test in Max/MSP
# Send messages from Max to web app
```

## 🎵 Production Checklist

### **Before Deployment**
- [ ] **Build succeeds locally** - `npm run build`
- [ ] **No TypeScript errors** - All types resolved
- [ ] **Service worker registered** - P2P discovery works
- [ ] **Network discovery tested** - Peers can find each other

### **After Deployment**
- [ ] **App loads correctly** - No console errors
- [ ] **P2P discovery works** - Devices connect automatically
- [ ] **Synchronization works** - Changes sync between devices
- [ ] **Performance is good** - No lag or delays

### **Monitoring**
- [ ] **Check Netlify analytics** - Monitor usage
- [ ] **Monitor console errors** - Fix any issues
- [ ] **Test on different devices** - Ensure compatibility
- [ ] **Verify offline functionality** - Works without internet

## 🔒 Security Considerations

### **Zero-Config Security**
- **No server-side code** - Nothing to hack
- **Local network only** - Data stays on your network
- **No authentication** - Simple peer-to-peer
- **No data storage** - Everything is ephemeral

### **Best Practices**
- **Use HTTPS** - Required for service workers
- **Test on secure networks** - Avoid public WiFi
- **Monitor network usage** - Check for unusual activity
- **Keep dependencies updated** - Regular security updates

## 📊 Performance Optimization

### **Build Optimization**
```bash
# Optimize bundle size
npm run build -- --analyze

# Check bundle size
ls -la build/static/js/
```

### **Runtime Optimization**
```javascript
// Optimize peer discovery
const p2p = new KeyLinkP2P({
  discoveryInterval: 10000,  // Scan every 10 seconds
  port: 20801
});

// Limit network scanning
// Framework automatically limits to first 50 IPs per range
```

## 🚀 Advanced Deployment

### **Custom Domain**
```bash
# Add custom domain in Netlify
# Settings > Domain management > Add custom domain

# Update DNS records
# Point your domain to Netlify's servers
```

### **CDN Configuration**
```toml
# Netlify automatically provides CDN
# No additional configuration needed

# For other platforms, configure CDN for:
# - Static assets (JS, CSS, images)
# - Service worker files
```

### **Environment-Specific Builds**
```javascript
// Use environment variables for different configs
const config = {
  discoveryInterval: process.env.NODE_ENV === 'production' ? 10000 : 5000,
  enableUdp: process.env.NODE_ENV === 'development'
};
```

---

**🎵 Happy deploying!**

Your zero-config P2P app is now ready for production deployment with zero cloud dependencies! 