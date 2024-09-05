require('dotenv').config();
const axios = require('axios');

const HUBSPOT_BASE_URL = 'https://api.hubapi.com';
// const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function createNewRecords(contactData, companyData) {
  try {
    for (const contact of Object.values(contactData)) {             
      const contactID = await checkContactRecord(contact);

      if (contactID){
        const dealID = await checkDealRecord(contact, contactID);   //check if the deal already existed or create a new one, get the id and associate
        if(dealID){
          await associateContactToDeal(contactID,dealID);             
        }else{
          console.log("Deal ID is undefined. Creating Associations Failed.");
        }
      }else{
        console.log("Contact ID is undefined. Creating Checking For Deal Records Failed.");
      }
      // await delay(100);                                             // Add a delay between each contact creation to avoid hitting API rate limits
    }
  } catch (error) {
    console.log(`Upload contacts failed. Error: ${error}`);
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
    console.log("Create association result: ", res);
    
  } catch (error) {
    console.log("Error Associating Contact with Deals ", error);
  }
}

// Function to check if the deal already exists, and create a new deal if not
async function checkDealRecord(contact, contactID) {
  try {
    const dealName = `${contact["Project Title"]}_${contact["Project ID"]}`; 

    const requestBody = {
      "filters": [
        {
          "propertyName": "dealname",
          "operator": "CONTAINS_TOKEN",
          "value": `**${dealName}`
        }
      ],
      "properties": [
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
      const newDealID = await createNewDeal(contact, contactID);
      console.log("No existing deal found. Created a new deal with ID: ",newDealID);
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
async function checkContactRecord(contact){
  try {
    let email = contact.Email;
    let phone = contact.Phone;
    let requestBody = {};
    if(email){
      requestBody = {
        "filters": [
          {
            "propertyName": "email",
            "operator": "CONTAINS_TOKEN",
            "value": `*${email}`
          }
        ],
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
    }else if(phone){
      requestBody = {
        "filters": [
          {
            "propertyName": "phone",
            "operator": "CONTAINS_TOKEN",
            "value": `*${phone}`
          }
        ],
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
    }

    const response = await axios.post(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/search`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    if(response.data.total === 0){
      console.log("\nThere are no associated contact data, create a new contact.");
      try {
        const newContactID = await createNewContact(contact);  //create a new hubspot contact and returns the id
        return newContactID;
      } catch (error) {
        console.log(`An error occured while creating a contact. ${error}`);   
      }
    }else{
      console.log(`${response.data.results[0].id}`);
      return response.data.results[0].id;                      //return the existing contact id to be used for the associations 
    }

  } catch (error) {
      console.log(`Failed to fetch contact information. Contact does not exist yet. Error: ${error}`);
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
    }

  } catch (error) {
    console.log(`An error occurred while creating a contact. ${error}`);
  }
}

module.exports  = {
  createNewRecords
}