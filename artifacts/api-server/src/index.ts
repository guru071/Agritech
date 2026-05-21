<<<<<<< HEAD
import "dotenv/config"; // Load .env before any other imports that read process.env
import app from "./app";
import { logger } from "./lib/logger";


const rawPort = process.env["PORT"] || "3000";
const port = Number(rawPort);

=======
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

>>>>>>> 56261fb4a8c736aef1d597c94e452828e0844ca1
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
