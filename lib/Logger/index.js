const chalk = require('chalk');

const Logger = {
  lastMessage: {
    message: '',
    count: 1,
  },
  debug: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.debug} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.debug} ${prefixes.pipe} ${value}`);
  },
  info: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.info} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.info} ${prefixes.pipe} ${value}`);
  },
  warn: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.warn} ${prefixes.pipe} ${value}[x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.warn} ${prefixes.pipe} ${value}`);
  },
  error: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.error} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.error} ${prefixes.pipe} ${value}`);
  },
  success: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.success} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.success} ${prefixes.pipe} ${value}`);
  },
  fail: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.fail} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.fail} ${prefixes.pipe} ${value}`);
  },
  launch: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.launch} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.launch} ${prefixes.pipe} ${value}`);
  },
  wait: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.wait} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.wait} ${prefixes.pipe} ${value}`);
  },
  end: (value) => {
    const { lastMessage, prefixes } = Logger;
    if (lastMessage.message === value) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.end} ${prefixes.pipe} ${value} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = value;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.end} ${prefixes.pipe} ${value}`);
  },
  prefixes: {
    debug: '  🔵  ',
    info: '  🟡  ',
    warn: '  🟠  ',
    error: '  🔴  ',
    pipe: chalk.bold('|'),
    success: '  ✅  ',
    fail: '  ❌  ',
    launch: '  🚀  ',
    wait: '  ⏱️  ',
    end: '  🎉  ',
  },
};

module.exports = Logger;
