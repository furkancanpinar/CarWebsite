require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // or use built-in fetch in Node 18+

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI API endpoint
app.post('/api/chat', async (req, res) => {
    const API_KEY = process.env.OPENAI_API_KEY;
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    if (!API_KEY) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `API request failed`);
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});