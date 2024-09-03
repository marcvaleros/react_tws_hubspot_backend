require('dotenv').config();
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const FormData = require('form-data');

//create a server 
const app = express();
const port = process.env.PORT || 8080;


// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.get('/', (req, res) => {
  res.send('Your server is running.');
});

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: 'https://react-tws-hubspot-fe-b3d36e68376c.herokuapp.com',                              //replace during prod
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/api/import', upload.array('files', 5), async (req, res) => {
  try {
    console.log('Files Details:', req.files);
    console.log('Body Details:', req.body.importRequest);

    let data = new FormData();

    data.append('importRequest', req.body.importRequest);

    req.files.forEach(file => {
      data.append('files', file.buffer, {filename:file.originalname, contentType: 'text/csv'});
    });
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.hubapi.com/crm/v3/imports',
      headers: { 
        'Content-Type': 'multipart/form-data', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`, 
        ...data.getHeaders()
      },
      data : data
    };
    
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data,null,1));
    res.status(200).json(response.data);
    
    // res.status(200).send("Success!");
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).send(error.response ? error.response.data : 'Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
