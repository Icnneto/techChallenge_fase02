const express = require('express');
const postRoutes = require('./routes/postRoutes');

const app = express();

app.use(express.json());

app.use('/posts', postRoutes);

app.get('/', (req, res) => {
    res.status(200).send('API is running');
});

module.exports = app;