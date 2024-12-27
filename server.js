const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store the Ollama endpoint
let ollamaEndpoint = 'http://localhost:11434';

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
app.get('/api/models', async (req, res) => {
    try {
        const response = await axios.get(`${ollamaEndpoint}/api/tags`);
        // Sort models alphabetically
        const sortedModels = response.data.models.sort((a, b) => 
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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
