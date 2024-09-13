require('dotenv').config();

const {createNewRecords,parseCsvBuffer,importToHubspot,normalizedPhoneNumber} = require('./util');
const {uploadInvalidContacts} = require('./google_api');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const {Readable} = require('stream');

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
  origin: 'https://react-tws-hubspot-fe-b3d36e68376c.herokuapp.com',                           //replace during prod
  // origin: 'http://localhost:3000',                                                                
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/upload/contacts', upload.array('files', 4), async (req, res) => {
  try {
    const contactBuffer = req.files[0].buffer;
    const companyBuffer = req.files[1].buffer;
    const contactBuffer2 = req.files[2].buffer;
    const projectBuffer = req.files[3].buffer;
    const filename = req.body.filename;
    const Contact = await parseCsvBuffer(contactBuffer);
    const Company = await parseCsvBuffer(companyBuffer);
    
    const importResponse = await importToHubspot(filename, contactBuffer2, companyBuffer, projectBuffer);

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(20000);
    
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


app.post('/webhook', async (req, res) => {
  console.log(req.body);

  for (const event of req.body){
    if(event.subscriptionType === "contact.creation"){
      console.log(event.objectId);
      try {
        await normalizedPhoneNumber(event.objectId);
      } catch (error) {
        console.log(`Failed normalizing phone number format. ${error}`);
      }
    }
  }

  res.status(200).send("Successfully Formatted Phone Number");
})


app.post('/upload-to-drive', upload.single('file'),async (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).send('No file uploaded');
  }
  
  const csvBuffer = Buffer.from(file.buffer); 
  const fileStream = new Readable();
  fileStream.push(csvBuffer);
  fileStream.push(null);
  
  try {
    const webViewLink = await uploadInvalidContacts(file.originalname, fileStream);
    
    if (webViewLink) {
      res.json({ webViewLink });
    } else {
      res.status(400).send("Failed to upload the file to Google Drive");
    }
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})
