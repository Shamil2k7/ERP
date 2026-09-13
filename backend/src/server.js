import http from "http";
import dotenv from "dotenv";
dotenv.config();

import prisma from "./config/prisma.js";
import app from "./app.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await prisma.$connect();
    console.log(" Database Connected");

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(` ERP Server Running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(" Database Connection Failed");
    console.error(error);
    process.exit(1);
  }
}

startServer();