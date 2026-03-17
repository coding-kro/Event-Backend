import 'dotenv/config';
import { app } from './src/app.js';
import { connectDB } from './src/database/db.js';

connectDB();
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
