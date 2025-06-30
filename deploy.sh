#!/bin/bash

# Grok Prompt Enhancer Deployment Script
# This script automates the setup and deployment process

set -e  # Exit on any error

echo "🚀 Grok Prompt Enhancer Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        exit 1
    fi
    
    print_success "npm $(npm --version) is installed"
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing..."
        npm install -g vercel
    fi
    
    print_success "Vercel CLI is available"
}

# Setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Check for environment file
    if [ ! -f .env ]; then
        print_warning "No .env file found. Creating from template..."
        cp env.example .env
        print_warning "Please update .env with your OpenRouter API key"
    fi
    
    # Test backend locally
    print_status "Testing backend locally..."
    timeout 10s npm start &
    BACKEND_PID=$!
    
    sleep 3
    
    # Test health endpoint
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Backend is running locally"
    else
        print_warning "Backend health check failed, but continuing..."
    fi
    
    # Stop backend
    kill $BACKEND_PID 2>/dev/null || true
    
    cd ..
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    cd backend
    
    # Check if already linked to Vercel
    if [ ! -f .vercel/project.json ]; then
        print_status "Linking to Vercel project..."
        vercel --yes
    fi
    
    # Deploy
    print_status "Deploying to production..."
    vercel --prod --yes
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        print_success "Backend deployed to: $DEPLOYMENT_URL"
        echo "DEPLOYMENT_URL=$DEPLOYMENT_URL" > ../deployment_info.txt
    else
        print_error "Failed to get deployment URL"
        exit 1
    fi
    
    cd ..
}

# Setup extension
setup_extension() {
    print_status "Setting up Chrome extension..."
    
    # Check if icons exist
    if [ ! -f "extension/icons/icon16.png" ] || [ ! -f "extension/icons/icon48.png" ] || [ ! -f "extension/icons/icon128.png" ]; then
        print_warning "Extension icons not found. Please create them before loading the extension."
        print_status "See extension/icons/README.md for instructions"
    fi
    
    # Update backend URL in content script if deployment URL is available
    if [ -f "deployment_info.txt" ]; then
        DEPLOYMENT_URL=$(grep DEPLOYMENT_URL deployment_info.txt | cut -d'=' -f2)
        if [ -n "$DEPLOYMENT_URL" ]; then
            print_status "Updating backend URL in extension..."
            sed -i.bak "s|https://your-vercel-url.vercel.app|$DEPLOYMENT_URL|g" extension/content.js
            print_success "Backend URL updated in extension"
        fi
    fi
}

# Create GitHub repository
setup_github() {
    print_status "Setting up GitHub repository..."
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
        print_status "Initializing git repository..."
        git init
        git add .
        git commit -m "Initial commit: Grok Prompt Enhancer"
    fi
    
    print_warning "Please create a GitHub repository and push the code:"
    echo "git remote add origin https://github.com/your-username/grok-prompt-enhancer.git"
    echo "git branch -M main"
    echo "git push -u origin main"
}

# Create final instructions
create_instructions() {
    print_status "Creating final instructions..."
    
    cat > FINAL_INSTRUCTIONS.md << EOF
# 🎉 Grok Prompt Enhancer Setup Complete!

## Next Steps

### 1. Backend Configuration
- Your backend is deployed at: $(cat deployment_info.txt 2>/dev/null | grep DEPLOYMENT_URL | cut -d'=' -f2 || echo "Check Vercel dashboard")
- Set your OpenRouter API key in Vercel environment variables:
  - Go to Vercel dashboard
  - Select your project
  - Go to Settings > Environment Variables
  - Add: OPENROUTER_API_KEY = your_api_key_here

### 2. Chrome Extension Setup
1. Open Chrome and go to \`chrome://extensions/\`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the \`extension/\` folder
5. The extension should now appear in your extensions list

### 3. Testing
1. Visit [grok.com](https://grok.com)
2. Enter a prompt in the text area
3. Look for the "⚡ Prompt Enhancer" panel on the right
4. Click "Enhance Prompt" and choose enhancement type
5. Your prompt should be enhanced!

### 4. Customization
- Click the extension icon to change AI models
- The extension will remember your settings
- You can choose between Quick and Advanced enhancement types

## Troubleshooting

If you encounter issues:
1. Check the browser console for errors
2. Verify your OpenRouter API key is set correctly
3. Ensure the backend URL is updated in the extension
4. See \`setup/troubleshooting.md\` for detailed help

## Support

- Backend logs: Check Vercel dashboard
- Extension debugging: Use Chrome DevTools
- API documentation: See \`setup/api-docs.md\`

Happy enhancing! 🚀
EOF

    print_success "Final instructions created: FINAL_INSTRUCTIONS.md"
}

# Main execution
main() {
    echo ""
    print_status "Starting deployment process..."
    
    check_prerequisites
    setup_backend
    deploy_to_vercel
    setup_extension
    setup_github
    create_instructions
    
    echo ""
    print_success "Deployment process completed!"
    echo ""
    print_status "Please read FINAL_INSTRUCTIONS.md for next steps"
    echo ""
}

# Run main function
main "$@" 