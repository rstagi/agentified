#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Agent Control Panel Development Environment...${NC}"

# Check if MongoDB container exists and start it if needed
if ! docker ps | grep -q "mongodb"; then
  if docker ps -a | grep -q "mongodb"; then
    echo -e "${YELLOW}Starting existing MongoDB container...${NC}"
    docker start mongo
  else
    echo -e "${GREEN}Creating and starting MongoDB container...${NC}"
    docker run -d --name mongodb -p 27017:27017 mongo:8.0
  fi
else
  echo -e "${GREEN}MongoDB container is already running${NC}"
fi

# Wait for MongoDB to be ready
echo -e "${BLUE}Waiting for MongoDB to be ready...${NC}"
sleep 2

# Find available port for backend if 8080 is occupied
BACKEND_PORT=8080
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${YELLOW}Port $BACKEND_PORT is occupied, finding alternative...${NC}"
  for port in {8081..8090}; do
    if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      BACKEND_PORT=$port
      break
    fi
  done
fi

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down development servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit
}

trap cleanup EXIT INT TERM

# Start backend server with dynamic port
echo -e "${GREEN}Starting backend server on port $BACKEND_PORT...${NC}"
cd backend
PORT=$BACKEND_PORT npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${BLUE}Waiting for backend to be ready...${NC}"
while ! curl -s http://localhost:$BACKEND_PORT/ping >/dev/null; do
  sleep 1
done
echo -e "${GREEN}Backend is ready!${NC}"

# Update frontend to know the backend port
export VITE_API_URL=http://localhost:$BACKEND_PORT

# Start frontend dev server (Vite will auto-select available port)
echo -e "${GREEN}Starting frontend dev server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for Vite to start and show its port
sleep 3

echo -e "${GREEN}( Development environment is running!${NC}"
echo -e "${BLUE}Backend: http://localhost:$BACKEND_PORT${NC}"
echo -e "${BLUE}Frontend: Check the Vite output above for the port (usually 5173)${NC}"
echo -e "${YELLOW}MongoDB: mongodb://localhost:27017 (container: mongodb)${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Keep script running
wait

