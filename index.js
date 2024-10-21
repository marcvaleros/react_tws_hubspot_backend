require('dotenv').config();

const { parseCsvBuffer } = require('./utils/util')
const { uploadInvalidContacts } = require('./google_api');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Readable } = require('stream');
const http = require('http');
const {keepDynoAlive} = require('./self_ping');
const authRoutes = require('./routes/authRoutes');
const morgan = require('morgan');
const { fileProcessingQueue } = require('./worker');
const path = require('path');
const AWS = require('aws-sdk');

const app = express();
const port = process.env.PORT || 8080;

const server = http.createServer(app);
let hubspot_api_key;

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

async function uploadToS3(buffer,filename){
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: `files/${Date.now()}_${filename}`,
    Body: buffer,
    ContentType: 'text/csv',
  }

  try{
    const data = await s3.upload(params).promise();
    console.log(`File Upload Successfuly at ${data.Location}`);
    return data.Location;    
  }catch(error){
    console.log(error);
    throw err;
  }
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${file.originalname}`;
    cb(null, uniqueFilename); 
  }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Your server is running.');
});


// Middleware to parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS', 'PUT'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use('/api/auth', authRoutes);

app.post('/upload/contacts', upload.array('files', 4), async (req, res) => {
  try {
    const filename = req.body.filename;
    const deal_stage = req.body.deal_stage;
    const hubspot_api_key = req.body.hubspot_api_key;

    // Upload each file to S3 and get their URLs
    const contactUrl = await uploadToS3(req.files[0].buffer, req.files[0].originalname);
    const companyUrl = await uploadToS3(req.files[1].buffer, req.files[1].originalname);
    const contact2Url = await uploadToS3(req.files[2].buffer, req.files[2].originalname);
    const projectUrl = await uploadToS3(req.files[3].buffer, req.files[3].originalname);

    const fileUrls = {
      contact: contactUrl,
      company: companyUrl,
      contact2: contact2Url,
      project: projectUrl    
    };

    res.status(200).send({message: 'Processing started, you will be notified once completed.'});
  }catch (error){
    console.log(error);
    console.error(error.response ? error.response.data : error.message);
    res.status(error.response ? error.response.status : 500).send(error.response ? error.response.data : 'Server Error');
  }
})


// app.post('/webhook', async (req, res) => {
//   console.log(req.body);

//   for (const event of req.body){
//     if(event.subscriptionType === "contact.creation"){
//       console.log(event.objectId);
//       try {
//         await normalizedPhoneNumber(event.objectId, hubspot_api_key);
//       } catch (error) {
//         console.log(`Failed normalizing phone number format. ${error}`);
//       }
//     }
//   }

//   res.status(200).send("Successfully Formatted Phone Number");
// })

// app.post('/upload-to-drive', upload.single('file'),async (req, res) => {
//   const { file } = req;

//   if (!file) {
//     return res.status(400).send('No file uploaded');
//   }
  
//   const csvBuffer = Buffer.from(file.buffer); 
//   const fileStream = new Readable();
//   fileStream.push(csvBuffer);
//   fileStream.push(null);
  
//   try {
//     const webViewLink = await uploadInvalidContacts(file.originalname, fileStream);
    
//     if (webViewLink) {
//       res.json({ webViewLink });
//     } else {
//       res.status(400).send("Failed to upload the file to Google Drive");
//     }
//   } catch (error) {
//     console.error("Error during file upload:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });


// Call the keepDynoAlive function every 25 minutes to avoid the dyno sleeping
setInterval(keepDynoAlive, 25 * 60 * 1000);  // Ping every 25 minutes (in milliseconds)


module.exports = {app};

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`WebSocket Server is running on port ${port}`);
})
