require('dotenv').config();

const axios = require('axios');
const {createNewRecords,importToHubspot, getAllContactsToCache, getAllDealsToCache, parseCsvBuffer } = require('./utils/util');
const Queue = require('bull');

const fileProcessingQueue = new Queue('file-processing', {
  redis: process.env.REDISCLOUD_URL
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const downloadFile = async (presignedUrl) => {
  try {
    const response = await axios.get(presignedUrl, { responseType: 'arrayBuffer'});
    return response.data;
  } catch (error) {
    console.error('Error Downloading file from S3', error);
    throw new Error('Failed to download file');
  }
}

fileProcessingQueue.process(async (job) => {
  try{
    console.log('Job Data:', JSON.stringify(job.data, null, 2));
    if (!job.data) {
      throw new Error('Job data is undefined or null');
    }
    const { filename, fileUrls, deal_stage, hubspot_api_key } = job.data;
    if (!fileUrls || !fileUrls.contact || !fileUrls.company) {
      throw new Error('Missing or invalid fileUrls in the job data');
    }

    const contactBuffer = await downloadFile(fileUrls.contact);
    const contactBuffer2 = await downloadFile(fileUrls.contact2);
    const companyBuffer = await downloadFile(fileUrls.company);
    const projectBuffer = await downloadFile(fileUrls.project);

    console.log('Parsing contact CSV');
    const Contact = await parseCsvBuffer(contactBuffer);
    
    console.log('Parsing company CSV');
    const Company = await parseCsvBuffer(companyBuffer);

    console.log('Importing to HubSpot');
    const importResponse = await importToHubspot(filename, contactBuffer2, companyBuffer, projectBuffer, hubspot_api_key);
    
    console.log('Waiting for operations to complete');
    await delay(12000);

    console.log('Fetching contacts cache');
    const contactsCache = await getAllContactsToCache(hubspot_api_key);
    
    console.log('Fetching deals cache');
    const dealsCache = await getAllDealsToCache(hubspot_api_key);
    
    console.log(JSON.stringify(contactsCache,null,2));
    console.log(JSON.stringify(dealsCache,null,2));
    
    if(importResponse !== 0){
      const response = await createNewRecords(Contact, Company, contactsCache, dealsCache, hubspot_api_key, deal_stage);
      return {message: response}
    }else{
      return {message:'Import failed, no records were created.' }
    }
  }catch(error){
     console.error('Error processing job:', error);
  }
})

fileProcessingQueue.on('completed', (job,result) => {
  console.log(`Job ${job.id} completed with result: ${JSON.stringify(result,null,2)}`);
})

fileProcessingQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});

fileProcessingQueue.on('error', (err) => {
  console.error('Redis error:', err);
});

fileProcessingQueue.on('error', (error) => {
  console.error('Redis error:', error);
});


module.exports = {
  fileProcessingQueue
}
