import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

app.listen(port, host, () => {
  console.log(`Dashboard server is running on http://${host}:${port}`);
  console.log(`Use your machine IP on the same network to open it from other devices.`);
});
