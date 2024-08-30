require('dotenv').config();
const axios = require('axios');
const express = require('express');

//create a server 
const app = express();

app.get('/', (req, res) => {
  res.send('Your server is running.');
});

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/import', async (req, res) => {
  try {
    const response = await axios.post('https://api.hubapi.com/crm/v3/imports/', req.body, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(error.response ? error.response.status : 500).send(error.response ? error.response.data : 'Server Error');
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
