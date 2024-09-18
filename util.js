require('dotenv').config();
const axios = require('axios');
const Papa = require('papaparse');
const FormData = require('form-data');

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';

async function createNewRecords(contactData, companyData, contactsCache, broadcastProgress) {
  try {
    let successCount = 0;
    let failureCount = 0;
    const totalRecords = contactData.length;
    console.log(`This is the total records: ${totalRecords}`);
    
    // Function to update progress
    const updateProgress = (currentIndex) => {
      const progressPercentage = Math.round((currentIndex / totalRecords) * 100);
      broadcastProgress(progressPercentage);
    };
    
    for (const [index,contact] of contactData.entries()) {
      const contactID = await checkContactRecord(contact, contactsCache);
      if (contactID !== 0){
        const companyID = await checkCompanyRecord(contact, contactID);
        const dealID = await checkDealRecord(contact, contactID);        //check if the deal already existed or create a new one, returns id
        if(dealID && companyID){
          try {
            await associateCompanyToDeal(companyID,dealID);             
            await associateContactToDeal(contactID,dealID);   
            successCount++;          
          } catch (error) {
            console.log("Failed creating associations for contacts, company and deals.");
            failureCount++;
          }
        }else{
          console.log("Company ID or Deal ID is undefined.");
          failureCount++;
        }
      }else{
        console.log("Contact ID is undefined. Checking For Deal Records Failed.");
        failureCount++;
      }

      updateProgress(index + 1);
    }

    updateProgress(contactData.length);

    if (successCount > 0 && failureCount === 0) {
      return "Successfully imported all data.";
    } else if (successCount > 0 && failureCount > 0) {
      return `Partial success: ${successCount} records imported successfully, ${failureCount} failed.`;
    } else {
      return "Import failed. No records were successfully imported.";
    }

  } catch (error) {
    console.log(`Upload contacts failed. Error: ${error}`);
    return "Import failed due to an internal error. Please try again.";
  }
}

//Function that search for recently created contacts with their ids & information
async function getAllContactsToCache(){
  let allContacts = [];
  let hasMore = true;
  let after = null;
  const [startOfDayGMT, endOfDayGMT] = await retrieveDate(); 

  while(hasMore){
    try {
      const requestBody = {
        "filters": [
          {
            "propertyName": "createdate",
            "operator": "BETWEEN",
            "value": startOfDayGMT,
            "highValue": endOfDayGMT,
          },
        ],
        "sorts": [{
            "propertyName": "createdate",
            "direction": "DESCENDING"
          }],
        "properties": [
          "id",
          "name",
          "createdate",
        ],
        "limit": 100,
      };

      if(after){
        requestBody.after = after;
      }
    
      const response = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, requestBody, {
        headers: {
          'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        }
      });

      allContacts = allContacts.concat(response.data.results);
      console.log(JSON.stringify(response.data.results,null,1));

     
      if(response.data.paging && response.data.paging.next){
        after = response.data.paging.next.after;
      }else{
        hasMore = false;
      }
      return allContacts;
    } catch (error) {
      console.error("Error fetching contacts:", error.response ? error.response.data : error.message);
      hasMore = false;
    }
  }

}

//Function to check if there are existing companies associated for the contact, if not create the company 
async function checkCompanyRecord(contact, contactID){
  try {
    const domain = getDomainName(contact.Email, contact.Website);
    requestBody = {
      "filters": [
        {
          "propertyName": "domain",
          "operator": "CONTAINS_TOKEN",
          "value": domain
        }
      ],
      "sorts": [{
          "propertyName": "createdate",
          "direction": "DESCENDING"
        }],
      "properties": [
        "id",
        "domain",
        "name",
        "createdate",
      ],
      "limit": 1,
    };

    const res = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/companies/search`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if(res.data && res.data.total > 0){
      console.log(`Associated Company Found. Returning Company ID: ${res.data.results[0].id}`);
      return res.data.results[0].id;
    }else{
      console.log(`Did not found associated company. Creating New Company...`);
      try {
        const companyID = await createNewCompany(contact);
        console.log(`Successfully created a new company record with ID: ${companyID}`);
        return companyID;
      } catch (error) {
        console.log(`Creation of New Company Failed. Error: ${error}`);
      }
    }
    
  } catch (error) {
    console.log(`Failed to fetch associated company information. Company may not exist. Error: ${error}`);
  }
}

//Function to create a new company and returns the id of newly created company
async function createNewCompany(contact){
  const {Company, Phone, Email, Website, City, State, ZIP} = contact;
  const Domain = getDomainName(Email, Website);
  const industry = contact["Project Category"].toUpperCase();
  
  const requestBody = {
    "properties": {
      "name": Company,
      "domain": Domain,
      "city": City,
      "industry": industry,
      "phone": Phone,
      "state": State,
      "zip": ZIP,
    }
  }
  
  try {
    const createResponse = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/companies`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    console.log("This is the company create response: ", JSON.stringify(createResponse.data,null,1));
    
    if(createResponse.data){
      console.log(`Created new company with ID: ${createResponse.data.id}`);
      return createResponse.data.id;
    }else{
      console.log(`Failed to create new company.`);
    }

  } catch (error) {
    console.log(`An error occurred while creating a company. ${error}`);
  }
}

//Function that associates the company with the deal using their ids
async function associateCompanyToDeal(companyID, dealID){
  const fromObjectType = 'companies';
  const fromObjectId = companyID;
  const toObjectType = 'deals';
  const toObjectId = dealID;

  try {
    const res = await axios.put(`${HUBSPOT_BASE_URL}/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/default/${toObjectType}/${toObjectId}`,{}, {
      headers: {
        'Authorization' : `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Company ID ${companyID} associated with Deal ID ${dealID}`);
    // console.log("Create association result: ", res.data);
    
  } catch (error) {
    console.log("Error Associating Company with Deals ", error);
  }
}

//Function that associates the contact with the deal using their ids
async function associateContactToDeal(contactID, dealID){
  const fromObjectType = 'contact';
  const fromObjectId = contactID;
  const toObjectType = 'deals';
  const toObjectId = dealID;

  try {
    const res = await axios.put(`${HUBSPOT_BASE_URL}/crm/v4/objects/${fromObjectType}/${fromObjectId}/associations/default/${toObjectType}/${toObjectId}`,{}, {
      headers: {
        'Authorization' : `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Contact ID ${contactID} associated with Deal ID ${dealID}`);
    // console.log("Create association result: ", JSON.stringify(res.data,null,1));
    
  } catch (error) {
    console.log("Error Associating Contact with Deals ", error);
  }
}

// Function to check if the deal already exists, and create a new deal if not
async function checkDealRecord(contact, contactID) {
  try {
    const dealName = `${contact["Project Title"]}_${contact["Project ID"]}`;
    console.log("THIS IS THE DEAL NAME: ", dealName);
    
    const requestBody = {
      "filters": [
        {
          "propertyName": "project_id",
          "operator": "EQ",
          "value": contact["Project ID"]
        }
      ],
      "properties": [
        "project_id",
        "dealname",
        "amount",
        "dealstage",
        "closedate",
        "pipeline"
      ],
      "sorts": [
        {
            "propertyName": "createdate", 
            "direction": "DESCENDING"
        }
      ],
      "limit": 1
    };

    const response = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/deals/search`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.total > 0) {
      console.log(`Existing deal found with ID: ${response.data.results[0].id}`);
      return response.data.results[0].id;
    } else {
      console.log("No existing deal found. Printing the response data. Creating a new deal...");
      console.log(`Deal Record Search Response: ${JSON.stringify(response.data,null,1)}`);
      
      const newDealID = await createNewDeal(contact, contactID);
      return newDealID;
    }

  } catch (error) {
    console.error(`Error checking or creating deal: ${error}`);
  }
}

// Function to create a new deal
async function createNewDeal(contact, contactID) {
  try {
    const dealName = `${contact["Project Title"]}_${contact["Project ID"]}`; 
    const descriptions =  `Project Title: ${contact["Project Title"]}\nProject Types: ${contact["Project Types"]}\nBuilding Uses: ${contact["Building Uses"]}\nProject Category: ${contact["Project Category"]}\nProject Description: ${contact["Project Description"]}\n
    `;

    const requestBody = {
      "properties": {
        "dealname": dealName,
        "pipeline": "default",
        "dealstage": "239936678",            // Default stage, adjust as needed
        "description": descriptions,
      }
    };

    // Make the API request to create the new deal
    const response = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/deals`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`New deal created with ID: ${response.data.id}`);

    //create asscoations here
    return response.data.id;

  } catch (error) {
    console.error(`Error creating new deal: ${error}`);
  }
}

//Function that returns the id of the existing or newly created contact 
async function checkContactRecord(contact, contactsCache){
  try {
    let email = contact.Email;
    let phone = contact.Phone;


    let requestBody = {
      "filters": [],
      "sorts": [{
        "propertyName": "createdate",
        "direction": "DESCENDING"
      }],
      "properties": [
        "id",
        "phone",
        "email",
        "firstname",
        "lastname",
        "createdate",
        "hs_lead_status",
      ],
      "limit": 1,
    };

    console.log(`Email: ${email} & Phone: ${phone}`);

    if(email){
      requestBody.filters.push({
        "propertyName": "email",
        "operator": "CONTAINS_TOKEN",
        "value": email
      });
    }else if(phone){
      requestBody.filters.push({
        "propertyName": "phone",
        "operator": "CONTAINS_TOKEN",
        "value": phone
      });
    }

    const response = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if(response.data.total > 0){  
      console.log(`${response.data.results[0].id}`);
      return response.data.results[0].id;  
    }else{
      console.log("\nThere are no associated contact data, create a new contact.");
      try {
        const newContactID = await createNewContact(contact);  //create a new hubspot contact and returns the id
        return newContactID;
      } catch (error) {
        console.log(`An error occured while creating a contact: ${error}`);
        return 0;
      }
    }

  } catch (error) {
      console.log(`Failed to fetch contact information. Contact does not exist yet. Error: ${error}`);
      return 0;
  }
}

//Function to create a new contact and return the contact id
async function createNewContact(contact){
  const {Email, Phone, Name, Role, Address, City, State, ZIP } = contact;
  const requestBody = {
    "properties": {
      firstname: Name || '',
      jobtitle: Role || '',
      phone: Phone || '',
      email: Email || '',
      address: Address || '',
      city: City || '',
      state: State || '',
      zip: ZIP || '',
    }
  }
  
  try {
    const createResponse = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    
    if(createResponse.data){
      console.log(`Created new contact with ID: ${createResponse.data.id}`);
      return createResponse.data.id;
    }else{
      console.log(`Failed to create new contact.`);
      return 0;
    }

  } catch (error) {
    console.log(`An error occurred while creating a contact. ${error}`);
    return 0;
  }
}

async function importToHubspot (fileName, contactBuffer, companyBuffer, projectBuffer) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName = fileName.replace('.csv', '');
  const formattedFileName = `${baseFileName}_${timestamp}`;

  let importRequest = {
    "name": formattedFileName,
    "importOperations": {
      "0-1": "UPSERT",
      "0-3": "UPSERT",
    },
    "files": [
    {
      "fileName": `Construct Connect Contacts.csv`,
      "fileFormat": "CSV",
      "fileImportPage": {
        "hasHeader": true,
        "columnMappings": [
          {
            "columnObjectTypeId": "0-1",
            "columnName": "Name",
            "propertyName": "firstname"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "Role",
            "propertyName": "jobtitle"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "Phone",
            "propertyName": "phone"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "Email",
            "propertyName": "email",
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "Website",
            "propertyName": "website"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "Address",
            "propertyName": "address"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "City",
            "propertyName": "city"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "State",
            "propertyName": "state"
          },
          {
            "columnObjectTypeId": "0-1",
            "columnName": "ZIP",
            "propertyName": "zip"
          },
        ]
      }
    },
    {
      "fileName" : `Construct Connect Projects.csv`,
      "fileFormat": "CSV",
      "fileImportPage": {
        "hasHeader": true,
        "columnMappings": [
          {
            "columnObjectTypeId": "0-3",
            "columnName": "Project ID",
            "propertyName": "project_id",
            "columnType": "HUBSPOT_ALTERNATE_ID" 
          },
          {
            "columnObjectTypeId": "0-3",
            "columnName": "Dealname",
            "propertyName": "dealname",
          },
          {
            "columnObjectTypeId": "0-3",
            "columnName": "Pipeline",
            "propertyName": "pipeline",
          },
          {
            "columnObjectTypeId": "0-3",
            "columnName": "Dealstage",
            "propertyName": "dealstage",
          },
          {
            "columnObjectTypeId": "0-3",
            "columnName": "Description",
            "propertyName": "description",
          },
        ]
      }
    },
    ]
  }

  let form = new FormData();

  form.append('files', contactBuffer, 'Construct Connect Contacts.csv');
  form.append('files', projectBuffer, 'Construct Connect Projects.csv');
  form.append('importRequest', JSON.stringify(importRequest));

  try {
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.hubapi.com/crm/v3/imports',
      headers: { 
        'Content-Type': 'multipart/form-data', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`, 
        ...form.getHeaders()
      },
      data : form
    };
    
    const response = await axios.request(config);
    // console.log(JSON.stringify(response.data,null,1)); // import response
    return 1;
  } catch (error) {
    console.log("Error Importing to Hubspot", error.response ? error.response.data : error.message);
    return 0;
  } 
}

async function normalizedPhoneNumber(contactID){

  const containsSymbols = (number) => /[-() ]/.test(number);

  try {
    const res = await axios.get(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${contactID}?properties=phone`, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    if(res.data && res.data.properties.phone !== null){
      let phone = res.data.properties.phone;
      // console.log(`This is the response ${JSON.stringify(res.data,null,1)}`);
      if(containsSymbols(phone)){
        const formattedPhone = formatPhoneNumber(phone);
        const payload = {
          "properties": {
            phone: formattedPhone
          }
        }
  
        try {
          const patchResponse = await axios.patch(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${contactID}`, payload, {
            headers: {
              'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
              'Content-Type': 'application/json',
            }
          });
          // console.log(`This is the patchResponse: ${JSON.stringify(patchResponse.data,null,1)}`);
        } catch (error) {
          console.log(`Error Updating the Phone Number`, error);
        }
      }else{
        console.log("The phone number is already the right format.");
        return;
      }
      
    }else{
      console.log("Phone number has a null value");
    }
  } catch (error) {
    console.log(`Failed to search contacts with given ID`);
  }
}

const getDomainName = (email, website) => {
  const getDomainFromEmail = (email) => {
    return email.substring(email.indexOf("@") + 1);
  };

  const getDomainFromWebsite = (website) => {
    const domain = website.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/i);
    return domain ? domain[1] : '';
  };

  if (email) {
    return getDomainFromEmail(email);
  } else if (website) {
    return getDomainFromWebsite(website);
  } else {
    return ''; 
  }
};

function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const csvString = buffer.toString('utf8');

    Papa.parse(csvString, {
      header: true, 
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error),
    });
  });
}

function formatPhoneNumber(phone){
  return phone.replace(/[-() ]/g,'');
}


function formatDateToGMT8(date) {
  const offset = 8 * 60 * 60 * 1000; // GMT+8 offset in milliseconds
  const gmt8Date = new Date(date.getTime() + offset);
  
  // Format date to YYYY-MM-DDTHH:mm:ss.SSSZ
  return gmt8Date.toISOString().slice(0, -1) + 'Z';
}

async function retrieveDate(){
  const now = new Date();

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const startOfDayGMT = formatDateToGMT8(startOfDay);

  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfDayGMT = formatDateToGMT8(endOfDay);

  // console.log('Start of Day (GMT+8):', startOfDayGMT);
  // console.log('End of Day (GMT+8):', endOfDayGMT);

  return [startOfDayGMT, endOfDayGMT];
}

module.exports  = {
  createNewRecords,
  parseCsvBuffer,
  importToHubspot,
  normalizedPhoneNumber,
  retrieveDate,
  getAllContactsToCache
}