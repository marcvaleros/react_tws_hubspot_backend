const app = require('../index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');


app.post('/auth/request-magic-link', async(req,res) => {
  const {email} = req.body;

  const user = await User.findOne({where: {email}});
  if (!user) 

})