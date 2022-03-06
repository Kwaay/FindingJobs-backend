const http = require("http");
const app = require("./app");

const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || "3000", "3001");
app.set("port", port);

const server = http.createServer(app);

const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  
  const address = server.address();
  const bind = typeof address === "string" ? `pipe ${address}` : port;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} Pas de permissions.`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`Port ${bind} déjà utilisé.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

server.on("error", errorHandler);
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? `pipe ${address}` : port;
  console.log(`🔍 Port en cours d'utilisation: ${bind}`);
});

server.listen(port);
