#!/bin/bash

# Grok Prompt Enhancer Test Script
# This script tests all components of the project

set -e

echo "🧪 Grok Prompt Enhancer Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Test backend
test_backend() {
    print_status "Testing backend..."
    
    cd backend
    
    # Test package.json
    if [ -f "package.json" ]; then
        print_success "package.json exists"
        ((TESTS_PASSED++))
    else
        print_error "package.json missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test app.js
    if [ -f "app.js" ]; then
        print_success "app.js exists"
        ((TESTS_PASSED++))
    else
        print_error "app.js missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test vercel.json
    if [ -f "vercel.json" ]; then
        print_success "vercel.json exists"
        ((TESTS_PASSED++))
    else
        print_error "vercel.json missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test dependencies
    if [ -d "node_modules" ]; then
        print_success "Dependencies installed"
        ((TESTS_PASSED++))
    else
        print_warning "Dependencies not installed (run: npm install)"
        ((TESTS_WARNED++))
    fi
    
    # Test environment file
    if [ -f ".env" ]; then
        print_success ".env file exists"
        ((TESTS_PASSED++))
    else
        print_warning ".env file missing (copy from env.example)"
        ((TESTS_WARNED++))
    fi
    
    # Test local server
    print_status "Testing local server..."
    timeout 15s npm start &
    SERVER_PID=$!
    
    sleep 5
    
    # Test health endpoint
    if curl -s http://localhost:3000/health > /dev/null; then
        print_success "Health endpoint responding"
        ((TESTS_PASSED++))
    else
        print_error "Health endpoint not responding"
        ((TESTS_FAILED++))
    fi
    
    # Test enhancement endpoint
    ENHANCE_RESPONSE=$(curl -s -X POST http://localhost:3000/enhance \
        -H "Content-Type: application/json" \
        -d '{"prompt":"test","model":"deepseek/deepseek-coder:33b-instruct","enhancementType":"quick"}' || echo "FAILED")
    
    if [[ "$ENHANCE_RESPONSE" == *"error"* ]]; then
        print_warning "Enhancement endpoint returned error (expected without API key)"
        ((TESTS_WARNED++))
    else
        print_success "Enhancement endpoint responding"
        ((TESTS_PASSED++))
    fi
    
    # Stop server
    kill $SERVER_PID 2>/dev/null || true
    
    cd ..
}

# Test extension
test_extension() {
    print_status "Testing Chrome extension..."
    
    # Test manifest.json
    if [ -f "extension/manifest.json" ]; then
        print_success "manifest.json exists"
        ((TESTS_PASSED++))
    else
        print_error "manifest.json missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test content script
    if [ -f "extension/content.js" ]; then
        print_success "content.js exists"
        ((TESTS_PASSED++))
    else
        print_error "content.js missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test popup files
    if [ -f "extension/popup.html" ]; then
        print_success "popup.html exists"
        ((TESTS_PASSED++))
    else
        print_error "popup.html missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    if [ -f "extension/popup.js" ]; then
        print_success "popup.js exists"
        ((TESTS_PASSED++))
    else
        print_error "popup.js missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test icons
    if [ -f "extension/icons/icon16.png" ] && [ -f "extension/icons/icon48.png" ] && [ -f "extension/icons/icon128.png" ]; then
        print_success "All icon files exist"
        ((TESTS_PASSED++))
    else
        print_warning "Some icon files missing (see extension/icons/README.md)"
        ((TESTS_WARNED++))
    fi
    
    # Test manifest validation
    if command -v jq &> /dev/null; then
        if jq empty extension/manifest.json 2>/dev/null; then
            print_success "manifest.json is valid JSON"
            ((TESTS_PASSED++))
        else
            print_error "manifest.json is invalid JSON"
            ((TESTS_FAILED++))
        fi
    else
        print_warning "jq not installed, skipping JSON validation"
        ((TESTS_WARNED++))
    fi
}

# Test setup files
test_setup_files() {
    print_status "Testing setup files..."
    
    # Test setup directory
    if [ -d "setup" ]; then
        print_success "setup directory exists"
        ((TESTS_PASSED++))
    else
        print_error "setup directory missing"
        ((TESTS_FAILED++))
        return 1
    fi
    
    # Test setup files
    for file in "codex-setup.md" "api-docs.md" "troubleshooting.md"; do
        if [ -f "setup/$file" ]; then
            print_success "$file exists"
            ((TESTS_PASSED++))
        else
            print_error "$file missing"
            ((TESTS_FAILED++))
        fi
    done
}

# Test deployment files
test_deployment_files() {
    print_status "Testing deployment files..."
    
    # Test deployment script
    if [ -f "deploy.sh" ]; then
        print_success "deploy.sh exists"
        ((TESTS_PASSED++))
    else
        print_error "deploy.sh missing"
        ((TESTS_FAILED++))
    fi
    
    # Test test script
    if [ -f "test.sh" ]; then
        print_success "test.sh exists"
        ((TESTS_PASSED++))
    else
        print_error "test.sh missing"
        ((TESTS_FAILED++))
    fi
    
    # Test README
    if [ -f "README.md" ]; then
        print_success "README.md exists"
        ((TESTS_PASSED++))
    else
        print_error "README.md missing"
        ((TESTS_FAILED++))
    fi
}

# Test code quality
test_code_quality() {
    print_status "Testing code quality..."
    
    # Test for common issues in content.js
    if grep -q "your-vercel-url" extension/content.js; then
        print_warning "Backend URL not updated in content.js"
        ((TESTS_WARNED++))
    else
        print_success "Backend URL appears to be updated"
        ((TESTS_PASSED++))
    fi
    
    # Test for proper error handling
    if grep -q "try.*catch" extension/content.js; then
        print_success "Error handling found in content.js"
        ((TESTS_PASSED++))
    else
        print_warning "No try-catch blocks found in content.js"
        ((TESTS_WARNED++))
    fi
    
    # Test for proper CORS headers in backend
    if grep -q "cors" backend/app.js; then
        print_success "CORS middleware found in backend"
        ((TESTS_PASSED++))
    else
        print_warning "CORS middleware not found in backend"
        ((TESTS_WARNED++))
    fi
}

# Test security
test_security() {
    print_status "Testing security..."
    
    # Check for hardcoded API keys
    if grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null; then
        print_error "Hardcoded API keys found in code"
        ((TESTS_FAILED++))
    else
        print_success "No hardcoded API keys found"
        ((TESTS_PASSED++))
    fi
    
    # Check for proper environment variable usage
    if grep -q "process.env.OPENROUTER_API_KEY" backend/app.js; then
        print_success "Environment variable usage found"
        ((TESTS_PASSED++))
    else
        print_error "Environment variable not used for API key"
        ((TESTS_FAILED++))
    fi
}

# Run all tests
main() {
    echo ""
    
    test_backend
    test_extension
    test_setup_files
    test_deployment_files
    test_code_quality
    test_security
    
    echo ""
    echo "📊 Test Results Summary"
    echo "======================"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${YELLOW}Warnings: $TESTS_WARNED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    TOTAL_TESTS=$((TESTS_PASSED + TESTS_WARNED + TESTS_FAILED))
    echo "Total tests: $TOTAL_TESTS"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All critical tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
        exit 1
    fi
}

# Run main function
main "$@" 