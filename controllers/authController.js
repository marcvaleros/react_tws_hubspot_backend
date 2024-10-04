const app = require('../index');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const generateToken = require('../utils/generateToken');


const generateMagicLinkData = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30); //link valid for 30 mins
  return {token, expiry};
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL, 
    pass: process.env.PASSWORD, 
  },
});

const signup = async(req,res) => {
  const {email} = req.body;

  if(!email) return res.status(400).json({message: 'All fields are required'});

  try {
    const userExists = await User.findOne({where: { email }});
    if(userExists) return res.status(400).json({message: 'User already exists'});

    //only continues if there user does not exists in db
    const newUser = User.create({email, role: 'agent'});

    //generate magic link
    const {token, expiry} = generateMagicLinkData();

    newUser.magicLinkToken = token;
    newUser.magicLinkExpires = expiry;

    await newUser.save();

    //send the link through email 
    await sendMagicLink(email, token);
    res.status(201).json({message: 'User created. Magic link sent to your email.'});
  } catch (error) {
    res.status(500).json({message:' Database error', error});
  }
}

const login = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'User does not exist' });

    // Generate magic link token and expiry
    const { token, expiry } = generateMagicLinkData();
    user.magicLinkToken = token;
    user.magicLinkExpires = expiry;
    await user.save();

    // Send the magic link via email
    await sendMagicLink(email, token);

    res.status(200).json({ message: 'Magic link sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error });
  }
};

const verifyMagicLink = async (req, res) => {
  const {token} = req.params;

  try {
    //find user by token
    const user = await User.findOne({where: {magicLinkToken: token}});

    if(!user || user.magicLinkExpires < new Date()) {
      return res.status(400).json({message: 'Invalid or expired magic link'});
    }

    //generate JWT token 
    const jwtToken = generateToken(user);

    user.magicLinkToken = null;
    user.magicLinkToken = null;
    await user.save();

    res.json({token: jwtToken});
  } catch (error) {
    res.status(500).json({message: 'Database error', error });    
  }
}

const sendMagicLink = async (email, token) => {
  const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/login/${token}`;
  
  //send magic link through email
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your Magic Link ✨',
    text: `Click on the following link to log in or verify your email: ${magicLinkUrl}`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error('Failed to send email');
  }
}

module.exports = {signup, login, verifyMagicLink};