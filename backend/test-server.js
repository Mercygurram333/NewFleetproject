const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  credentials: true
}));
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Simple auth test endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Register endpoint hit!', req.body);
  res.json({
    success: true,
    message: 'Registration successful (test mode)',
    user: { id: '1', name: 'Test User', email: req.body.email, role: req.body.role },
    token: 'test-token-123'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for multiple ports`);
  console.log(`🔧 Test mode - simplified authentication`);
});
