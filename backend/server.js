require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');
const shareRoutes = require('./routes/shareRoutes');
const boardRoutes = require('./routes/board');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://taskmanagementapp-sakshibishnoi.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials']
}));
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === 'https://taskmanagementapp-sakshibishnoi.netlify.app' || 
      origin === 'http://localhost:3000') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB Atlas', err));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/share', shareRoutes);
app.use('/api/board', boardRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
