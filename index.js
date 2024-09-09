require('dotenv').config();

const {createNewRecords,parseCsvBuffer,importToHubspot} = require('./util')
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

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
  // origin: 'https://react-tws-hubspot-fe-b3d36e68376c.herokuapp.com',                              //replace during prod
  origin: 'http://localhost:3000',                              //replace during prod
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/upload/contacts', upload.array('files', 3), async (req, res) => {
  try {
    const contactBuffer = req.files[0].buffer;
    const companyBuffer = req.files[1].buffer;
    const contactBuffer2 = req.files[2].buffer;
    const filename = req.body.filename;
    const Contact = await parseCsvBuffer(contactBuffer);
    const Company = await parseCsvBuffer(companyBuffer);
    
    //first import using the import API
    const importResponse = await importToHubspot(filename, contactBuffer2, companyBuffer);

    // Function to add delay
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // Add a delay before creating new records
    await delay(10000); // Delay for 10 seconds (10000 milliseconds)
    
    if(importResponse !== 0){
      const response = await createNewRecords(Contact, Company);
      res.status(200).send(response);
    }else{
      res.status(400).send({ message: 'Import failed, no records were created.' });
    }

  }catch (error){
    console.error(error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).send(error.response ? error.response.data : 'Server Error');
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
