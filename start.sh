#!/bin/bash

export PATH=$PATH:$(npm bin -g)

# Determine if we're running on Replit
if [ -n "$REPL_ID" ]; then
    echo "Running on Replit"
    BACKEND_PORT=8080
    FRONTEND_CMD="npm run build && npm run preview"
else
    echo "Running locally"
    BACKEND_PORT=5000
    FRONTEND_CMD="npm run dev"
fi

# Start the backend server
echo "Starting backend server on port $BACKEND_PORT..."
PORT=$BACKEND_PORT python -m backend.app &

# Capture the PID of the backend process
BACKEND_PID=$!

# Wait for a few seconds to give the backend time to start
sleep 5

# Check if the backend process is still running
if ps -p $BACKEND_PID > /dev/null
then
   echo "Backend server started successfully with PID $BACKEND_PID"
else
   echo "Backend server failed to start. Check logs/backend.log for errors."
   exit 1
fi

# Wait for the backend to be fully operational
echo "Waiting for backend to be ready..."
while ! curl -s http://localhost:$BACKEND_PORT > /dev/null
do
  sleep 1
done
echo "Backend is ready!"

# Start the frontend server
echo "Starting frontend..."
cd frontend && REACT_APP_BACKEND_PORT=$BACKEND_PORT $FRONTEND_CMD &

# Capture the PID of the frontend process
FRONTEND_PID=$!

# Function to kill processes
cleanup() {
    echo "Stopping processes..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

# Set up trap to call cleanup function on script exit
trap cleanup EXIT

# Wait for any key press
echo "Press any key to stop the servers"
read -n 1 -s

# Cleanup will be called automatically due to the trap
