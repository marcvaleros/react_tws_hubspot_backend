require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { User } = require('../models');
const generateToken = require('../utils/generateToken');


const signup = async (req, res) => {
  const { email } = req.body;

  console.log(email);
  
  if (!email) return res.status(400).json({ message: 'All fields are required' });

  try {
    const userExists = await User.findOne({ where: { email } });

    if (userExists) {
      // Generate new magic link for existing user
      const { token, expiry } = await generateMagicLinkData();

      userExists.magicLinkToken = token;
      userExists.magicLinkExpires = expiry;

      await userExists.save();

      // Send the new magic link through email
      await sendMagicLink(email, token);
      return res.status(200).json({ message: 'Magic link sent to your email.' });
    } else {
      // Only continue if the user does not exist in the database
      const newUser = await User.create({ email, role: 'agent' });

      // Generate magic link for the new user
      const { token, expiry } = await generateMagicLinkData();

      newUser.magicLinkToken = token;
      newUser.magicLinkExpires = expiry;

      await newUser.save();

      // Send the magic link through email
      await sendMagicLink(email, token);
      return res.status(201).json({ message: 'User created. Magic link sent to your email.' });
    }
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: 'Database error', error });
  }
};

const verifyMagicLink = async (req, res) => {
  const {token} = req.params;

  try {
    //find user by token
    const user = await User.findOne({where: {magicLinkToken: token}});

    if(!user || user.magicLinkExpires < Date.now()) {
      return res.status(400).json({message: 'Invalid or expired magic link'});
    }

    //generate JWT token 
    const jwtToken = await generateToken(user);

    user.magicLinkToken = null;
    user.magicLinkExpires = null;
    await user.save();

    res.json({token: jwtToken});
  } catch (error) {
    res.status(500).json({message: 'Database error', error });    
  }
}

const sendMagicLink = async (email, token) => {
  const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/login/${token}`;
  console.log(`This is the magic link url: ${magicLinkUrl}`);
  
  //send magic link through email
  try {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.EMAIL_PASSWORD, 
    },
  });
    
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your Magic Link ✨',
    text: `Click on the following link to log in or verify your email: ${magicLinkUrl}`
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
  });

  } catch (error) {
    console.log(error);
    
  }
}

const generateMagicLinkData = async () => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30); //link valid for 30 mins
  return {token, expiry};
}

module.exports = {signup, verifyMagicLink};