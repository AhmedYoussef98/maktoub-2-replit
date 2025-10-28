const express = require('express');
const axios = require('axios');
const https = require('https');
const formidable = require('formidable');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from multiple directories
app.use('/src', express.static('src'));
app.use('/public', express.static('public'));
app.use('/attached_assets', express.static('attached_assets'));
app.use('/css', express.static('css'));
app.use('/api', express.static('api'));

// Serve remaining static files from root (logo.svg, styles.css, etc.)
app.use(express.static('.', {
    index: false,  // Don't auto-serve index.html from root
    extensions: ['css', 'js', 'png', 'jpg', 'svg', 'ico']
}));

// HTML page routes - serve from pages/ directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'));
});

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'signup.html'));
});

app.get('/forgot-password.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'forgot-password.html'));
});

app.get('/create-letter.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'create-letter.html'));
});

app.get('/letter-history.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'letter-history.html'));
});

app.get('/review-letter.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'review-letter.html'));
});

app.get('/admin-panel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin-panel.html'));
});

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.all('/api/proxy', async (req, res) => {
    if (!['GET', 'PUT', 'POST', 'DELETE'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const API_BASE_URL = 'https://128.140.37.194:5018';
        
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        if (req.method === 'GET') {
            const { endpoint, session_id, category, letter_id, limit, offset, include_expired, page, page_size, sort_by, sort_order, submission_id } = req.query;

            let targetUrl;
            switch (endpoint) {
                case 'letter-categories':
                    targetUrl = `${API_BASE_URL}/api/v1/letter/categories`;
                    break;
                case 'letter-template':
                    targetUrl = `${API_BASE_URL}/api/v1/letter/templates/${category}`;
                    break;
                case 'chat-sessions':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions`;
                    if (include_expired) targetUrl += `?include_expired=${include_expired}`;
                    break;
                case 'chat-history':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions/${session_id}/history`;
                    const params = new URLSearchParams();
                    if (limit) params.append('limit', limit);
                    if (offset) params.append('offset', offset);
                    if (params.toString()) targetUrl += `?${params.toString()}`;
                    break;
                case 'chat-status':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions/${session_id}/status`;
                    break;
                case 'memory-stats':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/memory/stats`;
                    break;
                case 'memory-instructions':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/memory/instructions`;
                    const memParams = new URLSearchParams();
                    if (category) memParams.append('category', category);
                    if (session_id) memParams.append('session_id', session_id);
                    if (memParams.toString()) targetUrl += `?${memParams.toString()}`;
                    break;
                case 'archive-status':
                    targetUrl = `${API_BASE_URL}/api/v1/archive/status/${letter_id}`;
                    break;
                case 'submissions':
                    targetUrl = `${API_BASE_URL}/api/v1/submissions`;
                    const submissionsParams = new URLSearchParams();
                    if (page) submissionsParams.append('page', page);
                    if (page_size) submissionsParams.append('page_size', page_size);
                    if (sort_by) submissionsParams.append('sort_by', sort_by);
                    if (sort_order) submissionsParams.append('sort_order', sort_order);
                    if (submissionsParams.toString()) targetUrl += `?${submissionsParams.toString()}`;
                    break;
                case 'submissions-stats':
                    targetUrl = `${API_BASE_URL}/api/v1/submissions/stats`;
                    break;
                case 'submissions-single':
                    targetUrl = `${API_BASE_URL}/api/v1/submissions/${submission_id}`;
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid GET endpoint' });
            }

            try {
                console.log('GET request to:', targetUrl);

                // Prepare headers with Authorization if present
                const headers = {};
                if (req.headers.authorization) {
                    headers['Authorization'] = req.headers.authorization;
                    console.log('Forwarding Authorization header');
                }

                const response = await axios.get(targetUrl, {
                    headers,
                    httpsAgent: agent,
                    timeout: 30000
                });
                
                console.log('GET API success:', response.status);
                return res.status(200).json(response.data);
            } catch (axiosError) {
                console.error(`GET ${endpoint} API error:`, axiosError.message);
                if (axiosError.response) {
                    return res.status(axiosError.response.status).json({
                        error: `${endpoint} API error`,
                        message: axiosError.response.data || axiosError.message
                    });
                } else {
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: `Failed to call ${endpoint} endpoint`
                    });
                }
            }
        }

        if (req.method === 'DELETE') {
            const { endpoint, session_id } = req.query;

            let targetUrl;
            switch (endpoint) {
                case 'delete-chat-session':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions/${session_id}`;
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid DELETE endpoint' });
            }

            try {
                console.log('DELETE request to:', targetUrl);

                // Prepare headers with Authorization if present
                const headers = {};
                if (req.headers.authorization) {
                    headers['Authorization'] = req.headers.authorization;
                    console.log('Forwarding Authorization header');
                }

                const response = await axios.delete(targetUrl, {
                    headers,
                    httpsAgent: agent,
                    timeout: 30000
                });
                
                console.log('DELETE API success:', response.status);
                return res.status(200).json(response.data);
            } catch (axiosError) {
                console.error(`DELETE ${endpoint} API error:`, axiosError.message);
                if (axiosError.response) {
                    return res.status(axiosError.response.status).json({
                        error: `${endpoint} API error`,
                        message: axiosError.response.data || axiosError.message
                    });
                } else {
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: `Failed to call ${endpoint} endpoint`
                    });
                }
            }
        }

        if (req.method === 'PUT') {
            console.log('Processing PUT request');
            
            let requestData;
            try {
                requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return res.status(400).json({ error: 'Invalid JSON in request body' });
            }
            
            const { endpoint, data } = requestData;
            
            let targetUrl;
            switch (endpoint) {
                case 'update-archive':
                    targetUrl = `${API_BASE_URL}/api/v1/archive/update`;
                    break;
                default:
                    console.log('Invalid PUT endpoint:', endpoint);
                    return res.status(400).json({ error: 'Invalid endpoint' });
            }
            
            try {
                console.log(`Attempting ${endpoint} PUT call to:`, targetUrl);
                console.log('Payload:', data);

                // Prepare headers with Authorization if present
                const headers = {
                    'Content-Type': 'application/json',
                };
                if (req.headers.authorization) {
                    headers['Authorization'] = req.headers.authorization;
                    console.log('Forwarding Authorization header');
                }

                const response = await axios.put(targetUrl, data, {
                    headers,
                    httpsAgent: agent,
                    timeout: 30000,
                });
                
                console.log(`${endpoint} PUT success:`, response.status);
                return res.status(200).json(response.data);
                
            } catch (axiosError) {
                console.error(`${endpoint} PUT error:`, axiosError.message);
                if (axiosError.response) {
                    console.error(`${endpoint} PUT response data:`, axiosError.response.data);
                    console.error(`${endpoint} PUT response status:`, axiosError.response.status);
                    return res.status(axiosError.response.status).json({
                        error: `${endpoint} PUT error`,
                        message: axiosError.response.data || axiosError.message
                    });
                } else {
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: `Failed to call ${endpoint}. Please try again later.`
                    });
                }
            }
        }

        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('multipart/form-data')) {
            console.log('Processing FormData request for archive-letter');
            
            const form = new formidable.IncomingForm({
                multiples: true,
                keepExtensions: true,
                maxFileSize: 50 * 1024 * 1024,
            });

            form.parse(req, async (err, fields, files) => {
                if (err) {
                    console.error('Formidable error:', err);
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: 'Failed to parse form data.'
                    });
                }

                console.log('Parsed fields:', fields);
                console.log('Parsed files:', Object.keys(files));

                const targetUrl = `${API_BASE_URL}/api/v1/archive/letter`;
                const formData = new FormData();

                for (const key in fields) {
                    if (key !== 'endpoint') {
                        const value = fields[key];
                        
                        if (Array.isArray(value)) {
                            if (value.length > 0) {
                                formData.append(key, value[0]);
                                console.log(`Added field (from array): ${key} = ${value[0]}`);
                            }
                        } else {
                            formData.append(key, value);
                            console.log(`Added field: ${key} = ${value}`);
                        }
                    }
                }

                for (const key in files) {
                    const file = files[key];
                    
                    if (Array.isArray(file)) {
                        file.forEach((f, index) => {
                            if (f && f.filepath) {
                                const fileKey = file.length > 1 ? `${key}_${index}` : key;
                                formData.append(fileKey, fs.createReadStream(f.filepath), {
                                    filename: f.originalFilename || 'file',
                                    contentType: f.mimetype || 'application/octet-stream'
                                });
                                console.log(`Added file (from array): ${fileKey} = ${f.originalFilename}`);
                            }
                        });
                    } else {
                        if (file && file.filepath) {
                            formData.append(key, fs.createReadStream(file.filepath), {
                                filename: file.originalFilename || 'file',
                                contentType: file.mimetype || 'application/octet-stream'
                            });
                            console.log(`Added file: ${key} = ${file.originalFilename}`);
                        }
                    }
                }

                try {
                    console.log('Sending request to:', targetUrl);

                    // Prepare headers with Authorization if present
                    const headers = {
                        ...formData.getHeaders(),
                    };
                    if (req.headers.authorization) {
                        headers['Authorization'] = req.headers.authorization;
                        console.log('Forwarding Authorization header');
                    }

                    const response = await axios.post(targetUrl, formData, {
                        headers,
                        httpsAgent: agent,
                        timeout: 30000,
                    });
                    
                    console.log('Archive API success:', response.status);
                    return res.status(200).json(response.data);
                    
                } catch (axiosError) {
                    console.error('Archive API error:', axiosError.message);
                    if (axiosError.response) {
                        console.error('Archive API response data:', axiosError.response.data);
                        console.error('Archive API response status:', axiosError.response.status);
                        return res.status(axiosError.response.status).json({
                            error: 'Archive API error',
                            message: axiosError.response.data || axiosError.message
                        });
                    } else {
                        return res.status(500).json({
                            error: 'Internal server error',
                            message: 'Failed to archive letter. Please try again later.'
                        });
                    }
                }
            });
            
        } else {
            console.log('Processing JSON request');
            
            let requestData;
            try {
                requestData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return res.status(400).json({ error: 'Invalid JSON in request body' });
            }
            
            const { endpoint, data } = requestData;
            
            let targetUrl;
            switch (endpoint) {
                case 'generate-letter':
                    targetUrl = `${API_BASE_URL}/api/v1/letter/generate`;
                    break;
                case 'validate-letter':
                    targetUrl = `${API_BASE_URL}/api/v1/letter/validate`;
                    break;
                case 'edit-letter':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions/${data.session_id}/edit`;
                    break;
                case 'create-chat-session':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions`;
                    break;
                case 'extend-chat-session':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/sessions/${data.session_id}/extend`;
                    break;
                case 'cleanup-chat':
                    targetUrl = `${API_BASE_URL}/api/v1/chat/cleanup`;
                    break;
                case 'archive-letter':
                    targetUrl = `${API_BASE_URL}/api/v1/archive/letter`;
                    break;
                case 'update-archive':
                    targetUrl = `${API_BASE_URL}/api/v1/archive/update`;
                    break;
                default:
                    console.log('Invalid endpoint:', endpoint);
                    return res.status(400).json({ error: 'Invalid endpoint' });
            }
            
            try {
                console.log(`Attempting ${endpoint} API call to:`, targetUrl);
                console.log('Payload:', data);

                // Prepare headers with Authorization if present
                const headers = {
                    'Content-Type': 'application/json',
                };
                if (req.headers.authorization) {
                    headers['Authorization'] = req.headers.authorization;
                    console.log('Forwarding Authorization header');
                }

                const response = await axios.post(targetUrl, data, {
                    headers,
                    httpsAgent: agent,
                    timeout: 30000,
                });
                
                console.log(`${endpoint} API success:`, response.status);
                return res.status(200).json(response.data);
                
            } catch (axiosError) {
                console.error(`${endpoint} API error:`, axiosError.message);
                if (axiosError.response) {
                    console.error(`${endpoint} API response data:`, axiosError.response.data);
                    console.error(`${endpoint} API response status:`, axiosError.response.status);
                    return res.status(axiosError.response.status).json({
                        error: `${endpoint} API error`,
                        message: axiosError.response.data || axiosError.message
                    });
                } else {
                    return res.status(500).json({
                        error: 'Internal server error',
                        message: `Failed to call ${endpoint}. Please try again later.`
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// User authentication proxy endpoints
app.post('/api/auth/login', async (req, res) => {
    try {
        const API_BASE_URL = 'https://128.140.37.194:5018';
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Email and password are required'
            });
        }

        const targetUrl = `${API_BASE_URL}/api/v1/user/validate`;
        
        console.log('Login request to:', targetUrl);
        
        const response = await axios.post(targetUrl, {
            email,
            password
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            httpsAgent: agent,
            timeout: 30000
        });
        
        console.log('Login API success:', response.status);
        return res.status(200).json(response.data);
        
    } catch (error) {
        console.error('Login API error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Login failed',
                message: error.response.data?.message || 'Invalid credentials'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to connect to authentication server'
            });
        }
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const API_BASE_URL = 'https://128.140.37.194:5018';
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const { email, password, full_name, phone_number } = req.body;
        
        if (!email || !password || !full_name) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                message: 'Email, password, and full name are required'
            });
        }

        const targetUrl = `${API_BASE_URL}/api/v1/user/create-user`;
        
        console.log('Signup request to:', targetUrl);
        
        const response = await axios.post(targetUrl, {
            email,
            password,
            full_name,
            phone_number: phone_number || ''
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            httpsAgent: agent,
            timeout: 30000
        });
        
        console.log('Signup API success:', response.status);
        return res.status(201).json(response.data);
        
    } catch (error) {
        console.error('Signup API error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json({
                error: 'Signup failed',
                message: error.response.data?.message || 'Failed to create account'
            });
        } else {
            return res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to connect to authentication server'
            });
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
