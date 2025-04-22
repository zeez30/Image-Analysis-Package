// Export Data Elements
export const exportDataButton = document.getElementById('exportDataButton');
export const exportedDataDisplay = document.getElementById('exportedDataDisplay');

// Function to fetch exported data
export async function fetchExportedData() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/export/data', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const formattedData = formatDataForDisplay(data);
                exportedDataDisplay.textContent = formattedData;
                if (exportDataButton) {
                    exportDataButton.style.display = 'block'; // Show the download button
                    exportedDataDisplay.dataset.exportedData = JSON.stringify(data);
                }
            } else {
                const errorData = await response.json();
                exportedDataDisplay.textContent = `Error fetching data: ${errorData.message || response.statusText}`;
                if (exportDataButton) {
                    exportDataButton.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error fetching export data:', error);
            exportedDataDisplay.textContent = 'An error occurred while fetching the data.';
            if (exportDataButton) {
                exportDataButton.style.display = 'none';
            }
        }
    } else {
        exportedDataDisplay.textContent = 'Please log in to export data.';
        if (exportDataButton) {
            exportDataButton.style.display = 'none';
        }
    }
}

// Helper function to format data for display
function formatDataForDisplay(data) {
    if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0]).join('\t') + '\n';
        const rows = data.map(item => Object.values(item).join('\t')).join('\n');
        return headers + rows;
    } else if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data, null, 2); // Pretty print JSON
    } else {
        return String(data);
    }
}

// Function to trigger CSV download
export function downloadCSV() {
    const data = exportedDataDisplay ? exportedDataDisplay.dataset.exportedData : null;
    if (data) {
        const jsonData = JSON.parse(data);
        const csvString = convertJsonToCsv(jsonData);
        downloadFile(csvString, 'exported_data.csv', 'text/csv;charset=utf-8;');
    } else {
        alert('No data to download.');
    }
}

// Helper function to convert JSON to CSV
function convertJsonToCsv(jsonData) {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return "";
    }

    const headers = Object.keys(jsonData[0]).join(',');
    const rows = jsonData.map(item => Object.values(item).join(',')).join('\n');

    return headers + '\n' + rows;
}

// Helper function to trigger file download
function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}