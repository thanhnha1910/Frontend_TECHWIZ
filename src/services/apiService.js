
const API_BASE_URL = 'http://localhost:5001/api';

const handleResponse = async (response) => {
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
};

const getHeaders = (includeContentType = true) => {
    const headers = {
        'credentials': 'include'
    };
    
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    
    return headers;
};

export const login = async (username, password, role) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
            username,
            password,
            role
        })
    });
    
    return handleResponse(response);
};

export const logout = async () => {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include'
    });
    
    return handleResponse(response);
};

export const getJobs = async () => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });
    
    return handleResponse(response);
};

export const createJobDescription = async (title, fullText) => {
    const response = await fetch(`${API_BASE_URL}/process-jd`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
            title,
            full_text: fullText
        })
    });
    
    return handleResponse(response);
};

export const getRankingsForJob = async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/rankings`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include'
    });
    
    return handleResponse(response);
};

export const applyForJob = async (jobId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/apply/${jobId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    });
    
    return handleResponse(response);
};

const healthCheck = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return await response.json();
    } catch (error) {
        console.error('Health check failed:', error);
        throw error;
    }
};

const downloadResume = async (resumeId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/resume/${resumeId}/download`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to download resume');
        }
        
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'resume.pdf';
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        return { blob, filename };
    } catch (error) {
        console.error('Download resume failed:', error);
        throw error;
    }
};

const exportJobRankings = async (jobId, format = 'excel') => {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/export?format=${format}`, {
            method: 'GET',
            headers: getHeaders(),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to export rankings');
        }
        
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `rankings.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        return { blob, filename };
    } catch (error) {
        console.error('Export rankings failed:', error);
        throw error;
    }
};

export default {
    login,
    logout,
    getJobs,
    createJobDescription,
    getRankingsForJob,
    applyForJob,
    healthCheck,
    downloadResume,
    exportJobRankings
};