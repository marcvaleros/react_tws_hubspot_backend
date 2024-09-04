require('dotenv').config();
const axios = require('axios');


async function createNewRecords(contactData, companyData){
  try {

    Object.values(contactData).forEach(async (contact)=> {
      const contactID = await createContactRecord(contact.Email, contact.Phone); 
      console.log(contactID);
    })

    //search for associated companies if it exist and get id
    //search for associated deals if it already exist and get the id 

  } catch (error) {
    console.log(`Upload contacts failed. Error: ${error}`);
  }
}


//returns the id of the existing or newly created contact 
async function createContactRecord(email, phone){
  try {
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

    const response = await axios.post(`${BASE_URL}/crm/v3/objects/contacts/search`, requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(response.results[0].id);
    console.log(response.status);
    return response.results[0].id;
    
    //if not existed 



  } catch (error) {
      console.log(`Failed to fetch contact information. Contact probably does not exist yet. Error: ${error}`);
  }

}


module.exports  = {
  createNewRecords
}