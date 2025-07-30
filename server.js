import express from 'express';
import cors from 'cors';
import router from './src/routes/event.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/events', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
