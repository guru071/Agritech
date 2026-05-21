import "dotenv/config"; // Load .env before any other imports that read process.env
import app from "./app";
import { logger } from "./lib/logger";


const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
