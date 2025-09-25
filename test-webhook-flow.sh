#!/bin/bash

# Test script for Clerk webhook flow
# This script helps test the enrollment activation process

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Clerk Webhook Flow Test ===${NC}\n"

# Check if API is running
echo -e "${YELLOW}Checking if API is running...${NC}"
curl -s http://localhost:3000/api/test/webhook-simulator > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ API is not running. Please start the development server first.${NC}"
    echo "Run: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ API is running${NC}\n"

# Function to test webhook
test_webhook() {
    local action=$1
    local email=$2
    local course=$3
    local org=$4
    local class_id=$5
    
    echo -e "${BLUE}Testing: $action for $email${NC}"
    
    # Build JSON payload
    local payload="{\"email\":\"$email\",\"courseId\":\"$course\",\"organizationCode\":\"$org\",\"action\":\"$action\""
    if [ ! -z "$class_id" ]; then
        payload="${payload},\"classId\":\"$class_id\""
    fi
    payload="${payload}}"
    
    # Make request
    response=$(curl -s -X POST http://localhost:3000/api/test/webhook-simulator \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    # Check if successful
    if echo "$response" | grep -q "success.*true"; then
        echo -e "${GREEN}✓ Success${NC}"
        echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed${NC}"
        echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
    fi
    echo ""
}

# Main test flow
main() {
    # Default values
    EMAIL="${1:-test@example.com}"
    COURSE="${2:-telc_a1}"
    ORG="${3:-ANB}"
    CLASS="${4:-}"
    
    echo -e "${YELLOW}Test Configuration:${NC}"
    echo "  Email: $EMAIL"
    echo "  Course: $COURSE"
    echo "  Organization: $ORG"
    echo "  Class: ${CLASS:-none}"
    echo ""
    
    # Step 1: Check current status
    echo -e "${YELLOW}Step 1: Checking current enrollment status${NC}"
    test_webhook "check" "$EMAIL" "$COURSE" "$ORG" "$CLASS"
    
    # Step 2: Activate enrollment (simulate user.created)
    echo -e "${YELLOW}Step 2: Simulating user.created webhook (activate enrollment)${NC}"
    test_webhook "activate" "$EMAIL" "$COURSE" "$ORG" "$CLASS"
    
    # Step 3: Verify activation
    echo -e "${YELLOW}Step 3: Verifying enrollment is now active${NC}"
    test_webhook "check" "$EMAIL" "$COURSE" "$ORG" "$CLASS"
    
    # Optional: Test deactivation
    read -p "Do you want to test deactivation (user.deleted)? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${YELLOW}Step 4: Simulating user.deleted webhook (deactivate enrollment)${NC}"
        test_webhook "deactivate" "$EMAIL" "$COURSE" "$ORG" "$CLASS"
        
        echo -e "${YELLOW}Step 5: Verifying enrollment is now inactive${NC}"
        test_webhook "check" "$EMAIL" "$COURSE" "$ORG" "$CLASS"
    fi
}

# Show usage
usage() {
    echo "Usage: ./test-webhook-flow.sh [email] [course_id] [organization] [class_id]"
    echo ""
    echo "Examples:"
    echo "  ./test-webhook-flow.sh                                    # Use defaults"
    echo "  ./test-webhook-flow.sh student@test.com                   # Custom email"
    echo "  ./test-webhook-flow.sh student@test.com telc_a1 ANB       # Full config"
    echo "  ./test-webhook-flow.sh student@test.com telc_a1 ANB class_123  # With class"
    echo ""
    echo "This script will:"
    echo "  1. Check current enrollment status"
    echo "  2. Activate the enrollment (simulate user.created)"
    echo "  3. Verify activation worked"
    echo "  4. Optionally deactivate (simulate user.deleted)"
}

# Check for help flag
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    usage
    exit 0
fi

# Run main test flow
main "$@"

echo -e "${GREEN}=== Test Complete ===${NC}"