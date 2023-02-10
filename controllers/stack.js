const fsp = require('fs/promises');
const { Stack } = require('../models');

// eslint-disable-next-line operator-linebreak
const regexName =
  /^[0-9A-ZÀÈÌÒÙÁÉÍÓÚÝÂÊÎÔÛÃÑÕÄËÏÖÜŸÇßØÅÆa-zàèìòùáéíóúýâêîôûãñõäëïöüÿçøåæœ/.#+ ]{1,25}$/;

exports.getAllStacks = async (req, res) => {
  try {
    const findAllStacks = await Stack.findAll({
      order: [['type']],
      where: {
        visibility: true,
      },
    });
    if (findAllStacks) {
      return res.status(200).json(findAllStacks);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Cannot get Stacks. Please try again.' });
  }
  return true;
};

exports.createStack = async (req, res) => {
  // Vérification du format du contenu envoyé
  if (!regexName.test(req.body.name)) {
    return res.status(400).json({ message: 'Name format is incorrect' });
  }
  const nameExist = await Stack.findOne({
    where: {
      name: req.body.name,
    },
  });
  if (nameExist) {
    return res.status(409).json({ message: 'Name has already been used' });
  }
  // TODO: Ajouter check visibility boolean
  try {
    const stackCreation = await Stack.create({
      name: req.body.name,
      type: req.body.type,
      regex: req.body.regex,
      logo: `${req.protocol}://${req.get('host')}/images/${
        req.files.logo[0].filename
      }`,
      visibility: req.body.visibility,
    });
    if (stackCreation) {
      return res.status(201).json({ message: 'Stack Created' });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the stack creation process, please try again',
    });
  }
  return true;
};

exports.getOneStack = async (req, res) => {
  try {
    const findOneStack = await Stack.findOne({
      where: {
        id: req.params.StackId,
        visibility: true,
      },
    });
    if (findOneStack) {
      return res.status(200).json(findOneStack);
    }
    return res.status(404).json({ message: 'Stack not found' });
  } catch (error) {
    res.status(500).json({
      message:
        'Something happened during the getOneStack process, please try again',
    });
  }
  return true;
};

exports.updateOneStack = async (req, res) => {
  const stack = await Stack.findOne({ where: { id: req.params.StackId } });
  if (!stack) {
    return res.status(404).json({ message: 'Stack not found' });
  }
  // Vérification du format du contenu envoyé
  if (req.body.name !== undefined && !regexName.test(req.body.name)) {
    return res.status(400).json({ message: 'Name format is incorrect' });
  }
  try {
    if (req.body.name !== null && req.body.name !== undefined) {
      const checkStack = await Stack.findOne({
        where: { name: req.body.name },
      });
      if (checkStack) {
        return res.status(409).json({ message: 'Name already exists' });
      }
    }
    let stackObject = {};
    if (req.files) {
      stackObject = {
        ...JSON.stringify(req.body),
        logo: `${req.protocol}://${req.get('host')}/images/${
          req.files.logo[0].filename
        }`,
      };
      const filename = stack.logo.split('/images/')[1];
      if (filename !== undefined && filename !== null) {
        await fsp.unlink(`./images/${filename}`);
      }
    } else {
      stackObject = { ...req.body };
    }

    const updateStack = await Stack.update(
      { ...stackObject },
      { where: { id: req.params.StackId } },
    );
    if (updateStack) {
      return res.status(200).json({ message: 'Stack has been modified' });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during modifying the stack selected, please try again',
    });
  }
  return true;
};

exports.deleteOneStack = async (req, res) => {
  try {
    const stack = await Stack.findOne({ where: { id: req.params.StackId } });
    if (!stack) {
      return res.status(404).json({ message: 'Stack not found' });
    }
    const deleteStack = await Stack.destroy({
      where: { id: req.params.StackId },
    });
    if (deleteStack) {
      return res.status(200).json({ message: 'Stack has been deleted' });
    }
    return true;
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during deleting the stack selected, please try again',
    });
  }
};
