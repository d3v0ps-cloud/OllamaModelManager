# Ollama Model Manager API Documentation

This document outlines the REST API endpoints exposed by the Ollama Model Manager application.

## Base URL

By default, the server runs on `http://localhost:3000`

## Environment Configuration

- `OLLAMA_ENDPOINTS`: Comma-separated list of Ollama endpoints (default: 'http://localhost:11434')

## Endpoints

### Get Available Ollama Endpoints

```http
GET /api/endpoints
```

Returns a list of configured Ollama endpoints.

**Response**
```json
[
  "http://localhost:11434",
  "http://other-endpoint:11434"
]
```

### Set Active Ollama Endpoint

```http
POST /api/set-endpoint
```

Sets and validates the active Ollama endpoint.

**Request Body**
```json
{
  "endpoint": "http://localhost:11434"
}
```

**Response**
```json
{
  "success": true,
  "message": "Endpoint set successfully"
}
```

**Error Response** (500)
```json
{
  "success": false,
  "message": "Failed to connect to Ollama endpoint",
  "error": "error message"
}
```

### Get Running Models

```http
GET /api/ps
```

Returns a list of currently running Ollama models.

**Response**
```json
{
  // Response format matches Ollama's /api/ps endpoint
}
```

**Error Response** (500)
```json
{
  "success": false,
  "message": "Failed to fetch running models",
  "error": "error message"
}
```

### Get Available Models

```http
GET /api/models
```

Returns a list of available models with their details.

**Response**
```json
[
  {
    "name": "model-name",
    "size": 12345678,
    "details": {
      "parent_model": "base-model",
      "format": "gguf",
      "family": "llama",
      "families": ["llama", "llama2"],
      "parameter_size": "7B",
      "quantization_level": "Q4_K_M"
    }
  }
]
```

**Error Response** (500)
```json
{
  "success": false,
  "message": "Failed to fetch models",
  "error": "error message"
}
```

### Delete Models

```http
DELETE /api/models
```

Deletes one or more models from Ollama.

**Request Body**
```json
{
  "models": ["model1", "model2"]
}
```

**Success Response**
```json
{
  "success": true,
  "message": "Models deleted successfully"
}
```

**Error Response** (500)
```json
{
  "success": false,
  "message": "Failed to delete models: model1, model2",
}
```

### Pull Model

```http
POST /api/pull
```

Pulls a new model from Ollama. Returns a streaming response with progress updates.

**Request Body**
```json
{
  "model": "model-name"
}
```

**Streaming Response Format**
```json
{"status": "downloading", "completed": 1234, "total": 5678}
{"status": "verifying digest"}
{"status": "writing manifest"}
```

**Error Response** (400)
```json
{
  "success": false,
  "message": "Model name is required"
}
```

### Update Model

```http
POST /api/update-model
```

Updates an existing model. Returns a streaming response with progress updates.

**Request Body**
```json
{
  "modelName": "model-name"
}
```

**Streaming Response Format**
```json
{"status": "downloading", "completed": 1234, "total": 5678}
{"status": "verifying digest"}
{"status": "writing manifest"}
```

**Error Response** (400)
```json
{
  "success": false,
  "message": "Model name is required"
}
```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "Detailed error information (optional)"
}
```

## Streaming Responses

For endpoints that return streaming responses (pull and update-model):

1. The response is chunked and each chunk contains a JSON object
2. Each JSON object has a `status` field indicating the current operation
3. For download progress, the response includes `completed` and `total` bytes
4. The stream ends when the operation is complete or an error occurs
5. Error responses in streams include `status: "error"` and an `error` message
