import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store the Ollama endpoint
let ollamaEndpoint = 'http://localhost:11434';

// Get endpoints from environment variable
const getEndpoints = () => {
    const endpoints = process.env.OLLAMA_ENDPOINTS || 'http://localhost:11434';
    return endpoints.split(',').map(endpoint => endpoint.trim());
};

// Endpoint to get available Ollama endpoints
app.get('/api/endpoints', (req, res) => {
    res.json(getEndpoints());
});

// Endpoint to set Ollama API URL
app.post('/api/set-endpoint', async (req, res) => {
    const { endpoint } = req.body;
    ollamaEndpoint = endpoint;
    try {
        // Test the connection
        await axios.get(`${endpoint}/api/tags`);
        res.json({ success: true, message: 'Endpoint set successfully' });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to connect to Ollama endpoint',
            error: error.message 
        });
    }
});

// Get models from Ollama
// Get running models from Ollama
app.get('/api/ps', async (req, res) => {
    try {
        const response = await axios.get(`${ollamaEndpoint}/api/ps`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch running models',
            error: error.message 
        });
    }
});

app.get('/api/models', async (req, res) => {
    try {
        const response = await axios.get(`${ollamaEndpoint}/api/tags`);
        
        // Get details for each model
        const modelsWithDetails = await Promise.all(response.data.models.map(async (model) => {
            try {
                const detailsResponse = await axios.post(`${ollamaEndpoint}/api/show`, {
                    name: model.name
                });
                return {
                    ...model,
                    details: {
                        parent_model: detailsResponse.data.details?.parent_model || '',
                        format: detailsResponse.data.details?.format || '',
                        family: detailsResponse.data.details?.family || '',
                        families: detailsResponse.data.details?.families || [],
                        parameter_size: detailsResponse.data.details?.parameter_size || '',
                        quantization_level: detailsResponse.data.details?.quantization_level || ''
                    }
                };
            } catch {
                // If we can't get details, return the model without them
                return model;
            }
        }));

        // Sort models alphabetically
        const sortedModels = modelsWithDetails.sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        res.json(sortedModels);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch models',
            error: error.message 
        });
    }
});

// Delete models from Ollama
app.delete('/api/models', async (req, res) => {
    const { models } = req.body;
    try {
        const results = await Promise.allSettled(models.map(model => 
            axios.delete(`${ollamaEndpoint}/api/delete`, {
                data: { name: model }
            })
        ));
        
        const failed = results
            .filter(r => r.status === 'rejected')
            .map((r, i) => models[i]);
            
        if (failed.length > 0) {
            res.status(500).json({ 
                success: false, 
                message: `Failed to delete models: ${failed.join(', ')}`,
            });
        } else {
            res.json({ success: true, message: 'Models deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Failed to process delete request',
            error: error.message 
        });
    }
});

// Endpoint to update a model
app.post('/api/update-model', async (req, res) => {
    const { modelName } = req.body;
    
    if (!modelName) {
        return res.status(400).json({ 
            success: false, 
            message: 'Model name is required' 
        });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    let hasEnded = false;
    const endResponse = (error) => {
        if (!hasEnded) {
            hasEnded = true;
            if (error) {
                res.write(JSON.stringify({
                    status: 'error',
                    error: error.message
                }) + '\n');
            }
            res.end();
        }
    };

    try {
        const response = await axios({
            method: 'post',
            url: `${ollamaEndpoint}/api/pull`,
            data: { model: modelName },
            responseType: 'stream'
        });

        response.data.on('data', (chunk) => {
            try {
                const lines = chunk.toString().split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        // Validate JSON before sending
                        try {
                            JSON.parse(line);
                            res.write(line + '\n');
                        } catch {
                            console.error('Invalid JSON in response:', line);
                        }
                    }
                });
            } catch (error) {
                console.error('Error processing chunk:', error);
                endResponse(error);
            }
        });

        response.data.on('end', () => {
            endResponse();
        });

        response.data.on('error', (error) => {
            console.error('Stream error:', error);
            endResponse(error);
        });

        // Handle client disconnect
        req.on('close', () => {
            endResponse();
        });

    } catch (error) {
        console.error('Failed to start update:', error);
        endResponse(error);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
