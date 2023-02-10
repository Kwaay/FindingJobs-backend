const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');
const fetch = require('node-fetch');
const fsp = require('fs/promises');
const { User } = require('../models');
const Logger = require('../lib/Logger');

const regexUsername =
  /^[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ_-]{4,20}$/;
const regexEmail =
  /((?:[\w-]+(?:\.[\w-]+)*)@(?:[\w-]+(?:\.[\w-]+)*)\.(?:[a-z.]{2,}))/gi;
const regexPassword =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/;
const regexQuestion =
  /^[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ,.?"'/ _-]{4,15}$/;
const regexAwswer =
  /^[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœ,.'"/ _-]{4,15}$/;

exports.signup = async (req, res) => {
  if (!regexUsername.test(req.body.username)) {
    return res.status(400).json({ message: 'Username format is incorrect' });
  }
  if (!regexEmail.test(req.body.email)) {
    return res.status(400).json({ message: 'Email format is incorrect' });
  }
  if (!regexPassword.test(req.body.password)) {
    return res.status(400).json({ message: 'Password format is incorrect' });
  }
  if (!regexQuestion.test(req.body.question)) {
    return res.status(400).json({ message: 'Question format is incorrect' });
  }
  if (!regexAwswer.test(req.body.awswer)) {
    return res.status(400).json({ message: 'Awswer format is incorrect' });
  }
  delete req.body.avatar;
  delete req.body.rank;
  const emailExist = await User.findOne({ where: { email: req.body.email } });
  if (emailExist) {
    return res.status(409).json({ message: 'Email already exists' });
  }
  const usernameExist = await User.findOne({
    where: { username: req.body.username },
  });
  if (usernameExist) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  // try {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  if (req.files) {
    const userCreationWithAvatar = await User.create({
      avatar: `${req.protocol}://${req.get('host')}/images/${
        req.files.avatar[0].filename
      }`,
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
      question: req.body.question,
      awswer: req.body.awswer,
      rank: 3,
    });
    if (userCreationWithAvatar) {
      return res.status(201).json({
        message: 'User Created Successfully with an Uploaded Image',
      });
    }
  } else {
    const hashEmail = cryptoJS.MD5(req.body.email).toString().toLowerCase();
    if (
      typeof hashEmail !== 'string' ||
      hashEmail === null ||
      hashEmail === undefined ||
      hashEmail.length === 0
    ) {
      return false;
    }
    // deepcode ignore Ssrf: <The request has been santitized in the condition just up there ⬆️>
    const gravatar = await fetch(
      `https://www.gravatar.com/avatar/${hashEmail}`,
      {
        method: 'GET',
      },
    );
    if (!gravatar) {
      return res.status(500).json({ message: 'Fetch Gravatar Failed' });
    }
    const gravatarImage = gravatar.url;
    const userCreationWithGravatar = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
      avatar: gravatarImage,
      question: req.body.question,
      awswer: req.body.awswer,
      rank: 3,
    });
    if (userCreationWithGravatar) {
      return res.status(201).json({
        message: 'User Created Successfully with an Gravatar image',
      });
    }
  }
  /* } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the user creation process, please try again',
    });
  } */
  return false;
};
exports.login = async (req, res) => {
  if (!regexPassword.test(req.body.password)) {
    return res.status(400).json({ message: 'Password format is incorrect' });
  }
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, 'username')) {
      if (!regexUsername.test(req.body.username)) {
        return res
          .status(400)
          .json({ message: 'Username format is incorrect' });
      }

      const user = await User.findOne({
        where: { username: req.body.username },
      });
      if (!user) {
        return res.status(404).json({ message: 'Username not found' });
      }
      const valid = await bcrypt.compare(req.body.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Failed to login' });
      }
      const token = jwt.sign(
        {
          UserId: user.id,
          rank: user.rank,
        },
        process.env.SECRET_KEY_JWT,
        {
          expiresIn: '24h',
        },
      );
      res.status(200).json({
        user,
        token,
      });
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'email')) {
      if (!regexEmail.test(req.body.email)) {
        return res.status(400).json({ message: 'Email format is incorrect' });
      }
      const user = await User.findOne({
        where: { email: req.body.email },
      });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }
      const valid = await bcrypt.compare(req.body.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Failed to login' });
      }
      const token = jwt.sign(
        {
          UserId: user.id,
          rank: user.rank,
        },
        process.env.SECRET_KEY_JWT,
        {
          expiresIn: '24h',
        },
      );
      res.status(200).json({
        user,
        token,
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Something happened during the login process, please try again',
    });
  }

  return false;
};
exports.forgot = async (req, res) => {
  if (!regexEmail.test(req.body.email)) {
    return res.status(400).json({ message: 'Email format is incorrect' });
  }
  try {
    const user = await User.findOne({
      where: { email: req.body.email },
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Email not related to an account' });
    }
    return res.status(200).json({
      response: user.question,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Something happened during the forgot process, please try again',
    });
  }
};
exports.forgotModify = async (req, res) => {
  if (!regexEmail.test(req.body.email)) {
    return res.status(400).json({ message: 'Email format is incorrect' });
  }
  if (!regexAwswer.test(req.body.awswer)) {
    return res.status(400).json({ message: 'Awswer format is incorrect' });
  }
  if (!regexPassword.test(req.body.password)) {
    return res.status(400).json({ message: 'Password format is incorrect' });
  }
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Email isn't related to an account" });
    }
    if (user.awswer !== req.body.awswer) {
      return res.status(400).json({ message: 'This awswer is false' });
    }
    const checkOldPassword = await bcrypt.compare(
      req.body.password,
      user.password,
    );
    if (checkOldPassword) {
      return res.status(409).json({
        message: 'Your new password cannot be the same than your old password',
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
    if (!hashPassword) {
      return res
        .status(500)
        .json({ message: 'Failed to hash your password, please try again' });
    }
    const updatePassword = User.update(
      { password: hashPassword },
      { where: { id: user.id } },
    );
    if (updatePassword) {
      return res.status(200).json({ message: 'Password updated successfully' });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the login password reset process, please try again',
    });
  }
  return false;
};
exports.getAllUsers = async (req, res) => {
  const findAllUsers = await User.findAll({
    order: [['createdAt', 'ASC']],
  });
  if (!findAllUsers) {
    return res.status(500).json({
      message: 'Something happened during getting all users, please try again',
    });
  }
  return res.status(200).json(findAllUsers);
};
exports.createUser = async (req, res) => {
  if (!regexUsername.test(req.body.username)) {
    return res.status(400).json({ message: 'Username format is incorrect' });
  }
  if (!regexEmail.test(req.body.email)) {
    return res.status(400).json({ message: 'Email format is incorrect' });
  }
  if (!regexPassword.test(req.body.password)) {
    return res.status(400).json({ message: 'Password format is incorrect' });
  }
  if (!regexQuestion.test(req.body.question)) {
    return res.status(400).json({ message: 'Question format is incorrect' });
  }
  if (!regexAwswer.test(req.body.awswer)) {
    return res.status(400).json({ message: 'Awswer format is incorrect' });
  }
  delete req.body.avatar;
  delete req.body.rank;
  const emailExist = await User.findOne({ where: { email: req.body.email } });
  if (emailExist) {
    return res.status(409).json({ message: 'Email already exists' });
  }
  const usernameExist = await User.findOne({
    where: { username: req.body.username },
  });
  if (usernameExist) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  // try {
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  if (req.files) {
    const userCreationWithAvatar = await User.create({
      avatar: `${req.protocol}://${req.get('host')}/images/${
        req.files.avatar[0].filename
      }`,
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
      question: req.body.question,
      awswer: req.body.awswer,
      rank: 3,
    });
    if (userCreationWithAvatar) {
      return res.status(201).json({
        message: 'User Created Successfully with an Uploaded Image',
      });
    }
  } else {
    const hashEmail = cryptoJS.MD5(req.body.email).toString().toLowerCase();
    if (
      typeof hashEmail !== 'string' ||
      hashEmail === null ||
      hashEmail === undefined ||
      hashEmail.length === 0
    ) {
      return false;
    }
    // deepcode ignore Ssrf: <The request has been santitized in the condition just up there ⬆️>
    const gravatar = await fetch(
      `https://www.gravatar.com/avatar/${hashEmail}`,
      {
        method: 'GET',
      },
    );
    if (!gravatar) {
      return res.status(500).json({ message: 'Fetch Gravatar Failed' });
    }
    const gravatarImage = gravatar.url;
    const userCreationWithGravatar = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: hashPassword,
      avatar: gravatarImage,
      question: req.body.question,
      awswer: req.body.awswer,
      rank: 3,
    });
    if (userCreationWithGravatar) {
      return res.status(201).json({
        message: 'User Created Successfully with an Gravatar image',
      });
    }
  }
  /* } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the user creation process, please try again',
    });
  } */
  return false;
};
exports.getMyUser = async (req, res) => {
  const user = await User.findOne({ where: { id: req.token.UserId } });
  if (!user) {
    return res.status(404).json({ message: "User doesn't exist" });
  }
  if (user.id !== req.token.UserId) {
    return res
      .status(403)
      .json({ message: "You don't are the person you pretend to be" });
  }
  return res.status(200).json(user);
};
exports.getOneUser = async (req, res) => {
  const findOneUser = await User.findOne({
    where: { id: req.params.UserId },
  });
  if (!findOneUser) {
    return res.status(404).json({
      message: 'User not found',
    });
  }
  return res.status(200).json(findOneUser);
};
exports.modifyOneUser = async (req, res) => {
  const user = await User.findOne({ where: { id: req.params.UserId } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  delete req.body.rank;
  if (
    req.body.username !== undefined &&
    !regexUsername.test(req.body.username)
  ) {
    return res.status(400).json({ message: 'Username format is incorrect' });
  }
  if (req.body.email !== undefined && !regexEmail.test(req.body.email)) {
    return res.status(400).json({ message: 'Email format is incorrect' });
  }
  if (
    req.body.password !== undefined &&
    !regexPassword.test(req.body.password)
  ) {
    return res.status(400).json({ message: 'Password format is incorrect' });
  }
  if (
    req.body.question !== undefined &&
    !regexQuestion.test(req.body.question)
  ) {
    return res.status(400).json({ message: 'Question format is incorrect' });
  }
  if (req.body.awswer !== undefined && !regexAwswer.test(req.body.awswer)) {
    return res.status(400).json({ message: 'Awswer format is incorrect' });
  }
  try {
    if (req.body.email.length < 1) {
      const checkEmail = await User.findOne({
        where: { email: req.body.email },
      });
      if (checkEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }
      let userModified = {};
      if (req.files) {
        userModified = {
          ...JSON.stringify(req.body),
          avatar: `${req.protocol}://${req.get('host')}/images/${
            req.files.avatar[0].filename
          }`,
        };
        if (user.avatar.length < 1 || user.avatar.includes('gravatar')) {
          const filename = user.avatar.split('/images/')[1];
          await fsp.unlink(`./images/${filename}`);
        }
      } else {
        userModified = { ...req.body };
      }
      const updateUser = await User.update(
        { ...userModified },
        { where: { id: req.params.UserId } },
      );
      if (updateUser) {
        return res.status(200).json({ message: 'User has been modified' });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during modifying the user selected, please try again',
    });
  }
  return false;
};
exports.deleteOneUser = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.UserId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.avatar.length && !user.avatar.includes('gravatar')) {
      const filename = user.avatar.split('/images/')[1];
      await fsp.unlink(`./images/${filename}`);
    }
    const deleteUser = await User.destroy({ where: { id: req.params.UserId } });
    if (deleteUser) {
      return res.status(200).json({ message: 'User has been deleted' });
    }
    return true;
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during deleting the user selected, please try again',
    });
  }
};
