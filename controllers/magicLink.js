const app = require('../index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const generateToken = require('../utils/generateToken');


const signup = async(req,res) => {
  const {email} = req.body;

  if(!email) return res.status(400).json({message: 'All fields are required'});

  try {
    const userExists = await User.findOne({where: { email }});
    if(userExists) return res.status(400).json({message: 'User already exists'});

    //only continues if there user does not exists in db
    const newUser = User.create({email, role: 'agent'});

    //generate magic link
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 120);

    newUser.magicLinkToken = token;
    newUser.magicLinkExpires = expiry;

    await newUser.save();

    //send the link through email 
    await sendMagicLink(email, token);

  } catch (error) {
    
  }
}


app.post('/auth/request-magic-link', async(req,res) => {
  const {email} = req.body;

  const user = await User.findOne({where: {email}});
  if (!user){
    user = await User.create({
      email,
    });
  }

  //generate magic link token
  const token = crypto.randomBytes(32).toString('hex');

  //set token expiry 
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 60);

  //save to database
  user.magicLinkToken = token;
  user.magicLinkExpires = expiry;
  await user.save();

  
  //send magic link through email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    }
  });

  const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/login/${token}`;
  const mailOptions = {
    from: process.env.EMAIL,
    to: user.email,
    subject: 'Your Magic Link ✨',
    text: `You requested a magic link for Zach-o-Matic. Click on the following link to be redirected: ${magicLinkUrl}`
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if(err) return res.status(500).send('Error sending email');
    return res.status(200).json({
      message: 'Magic link sent to your email!'
    })
  })

});

app.post('/auth/login/:token', async (req,res) => {
  const token = req.params;

  const user = await User.findOne({
    where: {
      magicLinkToken: token,
      magicLinkExpires: {[Op.gt] : new Date()} // token not expired
    }
  });

  if(!user) return res.status(400).send('Invalid or expired magic link');


  res.staus(200).send(`Welcome, ${user.email}!`);
  
  user.magicLinkToken = null;
  user.magicLinkExpires = null;

  await user.save();

});