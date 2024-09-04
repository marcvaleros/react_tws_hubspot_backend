require('dotenv').config();
const axios = require('axios');

const HUBSPOT_BASE_URL = 'https://api.hubapi.com'; 


async function createNewRecords(contactData, companyData){
  try {

    Object.values(contactData).forEach(async (contact)=> {
      console.log('\nEmail: ',contact.Email);
      console.log('\nPhone: ',contact.Phone);
      const contactID = await createContactRecord(contact);
      // console.log(contactID);
    })

    //search for associated companies if it exist and get id
    //search for associated deals if it already exist and get the id

  } catch (error) {
    console.log(`Upload contacts failed. Error: ${error}`);
  }
}


//returns the id of the existing or newly created contact 
async function createContactRecord(contact){
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
      console.log("\nThere are no associated data, better create a new contact.");

      //create a new hubspot contact here...
      try {
        const res = await createNewContact(contact);
      } catch (error) {
        console.log(`An error occured while creating a contact. ${error}`);
      }

    }else{
      console.log(`${response.data.results[0].id}`);
      return response.data.results[0].id;                 //return the id to be used for the associations 
    }

  } catch (error) {
      console.log(`Failed to fetch contact information. Contact probably does not exist yet. Error: ${error}`);
  }

}


async function createNewContact(contact){
  try {
    const requestBody = {
      "properties": {
        
      }
    }

  } catch (error) {
    
  }
}


module.exports  = {
  createNewRecords
}