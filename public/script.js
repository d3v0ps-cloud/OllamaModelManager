let selectedModels = new Set();

/* eslint-disable no-unused-vars */
function updateSelectedModels(checkbox) {
    if (checkbox.checked) {
        selectedModels.add(checkbox.value);
    } else {
        selectedModels.delete(checkbox.value);
    }
    updateBulkActionButtons();
}

function updateBulkActionButtons() {
    const updateSelectedBtn = document.getElementById('updateSelectedBtn');
    if (updateSelectedBtn) {
        updateSelectedBtn.disabled = selectedModels.size === 0;
    }
}

async function updateSelectedModelsInBulk() {
    const models = Array.from(selectedModels);
    const updatePromises = models.map(modelName => updateModel(modelName));
    await Promise.all(updatePromises);
    selectedModels.clear();
    updateBulkActionButtons();
}

function displayModels(models) {
/* eslint-enable no-unused-vars */
    const container = document.getElementById('modelsListContent');
    container.innerHTML = `
        <div class="bulk-actions">
            <button id="updateSelectedBtn" onclick="updateSelectedModelsInBulk()" disabled>Update Selected Models</button>
        </div>
    `;

    models.forEach(model => {
        const row = document.createElement('div');
        row.className = 'model-row';
        row.innerHTML = `
            <div class="checkbox-col">
                <input type="checkbox" value="${model.name}" onchange="updateSelectedModels(this)">
            </div>
            <div class="name-col">${model.name}</div>
            <div class="size-col">${formatBytes(model.size)}</div>
            <div class="param-col">${model.parameter_size || 'N/A'}</div>
            <div class="family-col">${model.family || 'N/A'}</div>
            <div class="format-col">${model.format || 'N/A'}</div>
            <div class="quant-col">${model.quantization_level || 'N/A'}</div>
            <div class="actions-col">
                <button class="update-btn" onclick="updateModel('${model.name}')">Update</button>
                <div id="status-${model.name}" class="update-status"></div>
            </div>
        `;
        container.appendChild(row);
    });
}

async function updateModel(modelName) {
    const statusElement = document.getElementById(`status-${modelName}`);
    statusElement.textContent = 'Starting update...';
    
    try {
        const response = await fetch('/api/update-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ modelName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to start update');
        }

        const reader = response.body.getReader();
        let lastStatus = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const update = JSON.parse(line);
                        
                        if (update.status === 'error') {
                            throw new Error(update.error || 'Update failed');
                        }
                        
                        if (update.status === 'downloading') {
                            const progress = ((update.completed / update.total) * 100).toFixed(1);
                            statusElement.textContent = `Downloading: ${progress}%`;
                        } else if (update.status === 'verifying digest') {
                            statusElement.textContent = 'Verifying download...';
                        } else if (update.status === 'writing manifest') {
                            statusElement.textContent = 'Finalizing update...';
                        } else if (update.status !== lastStatus) {
                            statusElement.textContent = update.status;
                            lastStatus = update.status;
                        }
                    } catch (e) {
                        if (e.message === 'Update failed') {
                            throw e;
                        }
                        console.error('Error parsing update:', e);
                    }
                }
            }
        }
        
        statusElement.textContent = 'Update complete';
        setTimeout(() => {
            statusElement.textContent = '';
            refreshModels();
        }, 2000);
        
    } catch (error) {
        console.error('Update error:', error);
        statusElement.textContent = `Error: ${error.message}`;
        setTimeout(() => {
            statusElement.textContent = '';
        }, 5000);
    }
}
