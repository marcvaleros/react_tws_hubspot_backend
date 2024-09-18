require('dotenv').config();
const { google } = require('googleapis');
const path = require('path');
const {getCredentials} = require('./decrypt');

async function authenticateDrive(){
  const credentialsString = getCredentials();
  const credentials = JSON.parse(credentialsString);

  console.log(`This is the type of creds: ${credentials}`);
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

/**Function to upload invalid contacts to google drive */
async function uploadInvalidContacts(fileName, csvStream){
  const drive = await authenticateDrive();
  
  const fileMetadata = {
    name: fileName,
    parents: ['1_mEcGvBMQ9iDHeIhDiKjnD-TpQoQeEil'],
    mimeType: 'application/vnd.google-apps.spreadsheet', // automatically convert it to google sheet format
  };

  const media = {
    mimeType: 'text/csv',
    body: csvStream,
  }

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink',
  });

  console.log('File uploaded to Google Drive:', response.data.webViewLink);
  return response.data.webViewLink; // Return the link to the uploaded file
}

module.exports = {
  uploadInvalidContacts
}