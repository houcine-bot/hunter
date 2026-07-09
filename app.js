require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 4 }
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/stats', require('./routes/stats'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));