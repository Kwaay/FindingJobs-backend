const chalk = require('chalk');

const Logger = {
  lastMessage: {
    message: '',
    count: 1,
  },
  debug: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.debug} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.debug} ${prefixes.pipe} ${valueToPrint}`);
  },
  info: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.info} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.info} ${prefixes.pipe} ${valueToPrint}`);
  },
  warn: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.warn} ${prefixes.pipe} ${valueToPrint}[x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.warn} ${prefixes.pipe} ${valueToPrint}`);
  },
  error: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.error} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.error} ${prefixes.pipe} ${valueToPrint}`);
  },
  success: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.success} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stdout.write(
      `${prefixes.success} ${prefixes.pipe} ${valueToPrint}`,
    );
  },
  fail: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.fail} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.fail} ${prefixes.pipe} ${valueToPrint}`);
  },
  launch: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(
        `${prefixes.launch} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stdout.write(`${prefixes.launch} ${prefixes.pipe} ${valueToPrint}`);
  },
  wait: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.wait} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.wait} ${prefixes.pipe} ${valueToPrint}`);
  },
  end: (value) => {
    const { lastMessage, prefixes } = Logger;
    const valueToPrint = typeof value === 'object' ? value.toString() : value;
    if (lastMessage.message === valueToPrint) {
      lastMessage.count += 1;
      process.stderr.clearLine(0);
      process.stderr.cursorTo(0);
      process.stderr.write(
        `${prefixes.end} ${prefixes.pipe} ${valueToPrint} [x${lastMessage.count}]`,
      );
      return;
    }
    process.stdout.write('\n');
    lastMessage.message = valueToPrint;
    lastMessage.count = 1;
    process.stderr.write(`${prefixes.end} ${prefixes.pipe} ${valueToPrint}`);
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
