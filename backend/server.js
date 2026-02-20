const express = require('express');
const cors = require('cors');
const dockerController = require('./controllers/dockerController');
const uploadController = require('./controllers/uploadController');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/containers', dockerController.getContainers);
app.get('/api/containers/:container/databases', dockerController.getDatabases);
app.post('/api/containers/:container/databases', dockerController.createDatabase);
app.post('/api/containers/:container/databases/:database/import', uploadController.uploadSql);

const universalUploadController = require('./controllers/universalUploadController');
app.post('/api/universal/test-connection', universalUploadController.testDirectConnection);
app.post('/api/universal/create-database', universalUploadController.createDirectDatabase);
app.post('/api/universal/import', universalUploadController.uploadDirect);

app.listen(port, () => {
    console.log(`UploadSql backend listening on port ${port}`);
});
