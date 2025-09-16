const express = require('express');
const cors = require('cors');
const postRoutes = require('./routes/postRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors()); 

app.use(express.json());

app.use('/posts', postRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.status(200).send('API is running');
});

module.exports = app;