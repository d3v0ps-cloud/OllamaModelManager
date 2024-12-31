### (Untested I dont have unraid to confirm)

# Unraid Deployment Guide for Ollama Model Manager

This guide covers how to deploy the Ollama Model Manager on Unraid using Docker.

## Prerequisites

- Unraid server running version 6.9.0 or higher
- Community Applications (CA) plugin installed
- Docker enabled on your Unraid server
- One or more Ollama instances accessible from your network

## Installation Steps

### 1. Install via Docker

#### Manual Configuration

1. Click "Add Container" in the Docker tab
2. Fill in the following fields:

```yaml
Repository: ghcr.io/d3v0ps-cloud/ollamamodelmanager:latest
Name: ollamamodelmanager
Network Type: Bridge

# Port Mappings
Host Port: 3000
Container Port: 3000
Protocol: TCP

# Environment Variables
Variable: OLLAMA_ENDPOINTS
Value: http://your-ollama-ip:11434,https://ollama2.remote.net

# Optional: Auto-start container
Start on array boot: Yes
```