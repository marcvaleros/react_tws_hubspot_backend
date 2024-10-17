require('dotenv').config();
const Bull = require('bull');
const {createNewRecords,parseCsvBuffer,importToHubspot,normalizedPhoneNumber, getAllContactsToCache, getAllDealsToCache} = require('./utils/util');

const fileProcessingQueue = new Bull('file-processing', {
  redis: process.env.REDISCLOUD_URL
});

fileProcessingQueue.process( async (job) => {
  const {files, body} = job.data;
  const contactBuffer = files[0].buffer;
  const companyBuffer = files[1].buffer;
  const contactBuffer2 = files[2].buffer;
  const projectBuffer = files[3].buffer;
  const filename = body.filename;
  const deal_stage = body.deal_stage;
  hubspot_api_key = body.hubspot_api_key;

  console.log('Parsing contact CSV');
  const Contact = await parseCsvBuffer(contactBuffer);
  
  console.log('Parsing company CSV');
  const Company = await parseCsvBuffer(companyBuffer);
  
  console.log('Importing to HubSpot');
  const importResponse = await importToHubspot(filename, contactBuffer2, companyBuffer, projectBuffer, hubspot_api_key);
  
  console.log('Waiting for operations to complete');
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  await delay(12000);

  console.log('Fetching contacts cache');
  const contactsCache = await getAllContactsToCache(hubspot_api_key);
  
  console.log('Fetching deals cache');
  const dealsCache = await getAllDealsToCache(hubspot_api_key);
  
  console.log(JSON.stringify(contactsCache,null,2));
  console.log(JSON.stringify(dealsCache,null,2));
  
  
  if(importResponse !== 0){
    const response = await createNewRecords(Contact, Company, contactsCache, dealsCache, broadcastProgress, hubspot_api_key, deal_stage);
    res.status(200).send({message: response});
  }else{
    res.status(400).send({ message: 'Import failed, no records were created.' });
  }

})

fileProcessingQueue.on('completed', (job,result) => {
  console.log(`Job ${job.id} completed with result: ${result}`);
})

module.exports={
  fileProcessingQueue
}
