require('dotenv').config();

const {createNewRecords,parseCsvBuffer,importToHubspot,normalizedPhoneNumber, getAllContactsToCache, getAllDealsToCache} = require('./utils/util')
const {uploadInvalidContacts} = require('./google_api');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const {Readable} = require('stream');
const WebSocket = require('ws');
const http = require('http');
const {keepDynoAlive} = require('./self_ping');
const authRoutes = require('./routes/authRoutes');
const morgan = require('morgan');


const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); // WebSocket server
let hubspot_api_key;

wss.on('connection', (ws) => {
  console.log('Client Connected');

  ws.on('message', (message)=>{
    console.log('Received Message:', message);
  });

  ws.on('close', () => {
    console.log('Client Disconnected');
  });
});


const broadcastProgress = (progress) => {
  wss.clients.forEach(client => {
    if(client.readyState === WebSocket.OPEN){
      client.send(JSON.stringify({progress}));
    }
  });
};


// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Your server is running.');
});

// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// app.use(cors());
app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,  
  methods: ['GET', 'POST', 'OPTIONS', 'PUT'], 
  credentials: true, 
}));

app.options('*', cors());

app.use('/api/auth', authRoutes);

app.post('/upload/contacts', upload.array('files', 4), async (req, res) => {
  try {
    const contactBuffer = req.files[0].buffer;
    const companyBuffer = req.files[1].buffer;
    const contactBuffer2 = req.files[2].buffer;
    const projectBuffer = req.files[3].buffer;
    const filename = req.body.filename;
    const deal_stage = req.body.deal_stage;
    hubspot_api_key = req.body.hubspot_api_key;

    const Contact = await parseCsvBuffer(contactBuffer);
    const Company = await parseCsvBuffer(companyBuffer);
    
    const importResponse = await importToHubspot(filename, contactBuffer2, companyBuffer, projectBuffer, hubspot_api_key);
    
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    await delay(12000);

    const contactsCache = await getAllContactsToCache(hubspot_api_key);
    const dealsCache = await getAllDealsToCache(hubspot_api_key);
    
    console.log(JSON.stringify(contactsCache,null,2));
    console.log(JSON.stringify(dealsCache,null,2));
    
    
    if(importResponse !== 0){
      const response = await createNewRecords(Contact, Company, contactsCache, dealsCache, broadcastProgress, hubspot_api_key, deal_stage);
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
        await normalizedPhoneNumber(event.objectId, hubspot_api_key);
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


// Call the keepDynoAlive function every 25 minutes to avoid the dyno sleeping
setInterval(keepDynoAlive, 25 * 60 * 1000);  // Ping every 25 minutes (in milliseconds)


module.exports = {app};

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket Server is running on port ${port}`);
})
