const express = require('express');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const auth = require('../auth');
const { User, validateUser } = require('../models/user');
const { Weight } = require('../models/weight');


const router = express.Router();

router.get('/', async (req, res) => {
  const users = await User.find().lean();
  res.send(users);
});

router.get('/me', auth, async (req, res) => {
  // if auth has worked then req.user should be the token content

  const user = await User.findById(req.user._id);
  res.send(user);
});
router.get('/', async (req, res) => {
  const users = await User.find().lean();
  res.send(users);
});

router.post('/', async (req, res) => {
  // add validation joi here
  const { error } = validateUser(req.body);
  console.log(error);

  if (error) return res.status(400).send(error.details[0].message);

  let newUser = await User.findOne({ email: req.body.email });
  if (newUser) return res.status(400).send('User already registered.');
  // we use lodash pick to shorcut the  req.body object as commented below
  // newUser = new User(_.pick(req.body, ['name', 'email', 'password', 'languange', 'displayUnit']));


  newUser = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    language: req.body.language,
    displayUnit: req.body.displayUnit,
  });

  // salt is needed to complicate the easy passwords which otherwise would
  // have very common hash names
  const salt = await bcrypt.genSalt(10);
  newUser.password = await bcrypt.hash(newUser.password, salt);
  await newUser.save();

  const token = newUser.generateAuthToken();
  res.header('x-auth-token', token).send(_.pick(newUser, 'name', 'email', '_id'));
  res.send(`New user ${newUser.name} saved!`);
});

// router.put('/:id', async (req, res) => {
//   const user = await User.findById(req.params.id);
//   user.weights.push(new Weight({ weight: req.body.weight }));
//   user.save();
//   res.send(`this is ${user.name}`);
// });


module.exports = router;
