const { UserAgent } = require('../models');
const Logger = require('../lib/Logger');
// eslint-disable-next-line operator-linebreak

exports.getUserAgent = async (req, res) => {
  try {
    const findUserAgent = await UserAgent.findOne({
      where: {
        id: 1,
      },
    });
    if (findUserAgent) {
      return res.status(200).json(findUserAgent);
    }
    return res.status(404).json({ message: 'UserAgent not found' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Cannot get the UserAgent. Please try again.' });
  }
  return true;
};

exports.createUserAgent = async (req, res) => {
  // Vérification du format du contenu envoyé
  try {
    const userAgent = UserAgent.create({
      browser: req.useragent.browser,
      useragent: req.useragent.source,
    });
    if (userAgent) {
      return res.status(201).json({ message: 'userAgent Created' });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the userAgent creation process, please try again',
    });
  }
  return true;
};

exports.updateUserAgent = async (req, res) => {
  const userAgentFind = await UserAgent.findOne({ where: { id: 1 } });
  if (!userAgentFind) {
    return res.status(404).json({ message: 'userAgent not found' });
  }
  // Vérification du format du contenu envoyé
  try {
    const userAgentUpdate = await UserAgent.update(
      {
        browser: req.body.browser,
        useragent: req.body.useragent,
      },
      { where: { id: 1 } },
    );
    if (userAgentUpdate) {
      return res.status(200).json({ message: 'userAgent has been modified' });
    }
  } catch (error) {
    return res.status(500).json({
      message:
        'Something happened during the userAgent modification process, please try again',
    });
  }
  return true;
};
