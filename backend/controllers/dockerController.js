const { exec } = require('child_process');

exports.getContainers = (req, res) => {
    exec('docker ps --format \'{{json .}}\'', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        const containers = stdout.trim().split('\n').filter(Boolean).map(line => {
            try { return JSON.parse(line); } catch (e) { return null; }
        }).filter(Boolean);
        res.json(containers);
    });
};

exports.getDatabases = (req, res) => {
    const { container } = req.params;
    exec(`docker exec ${container} mysql -e "SHOW DATABASES;"`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: stderr || error.message });
        }
        const dbs = stdout.trim().split('\n').slice(1);
        res.json(dbs);
    });
};

exports.createDatabase = (req, res) => {
    const { container } = req.params;
    const { database } = req.body;
    if (!database) return res.status(400).json({ error: 'Database name required' });

    exec(`docker exec ${container} mysql -e "CREATE DATABASE IF NOT EXISTS \\\`${database}\\\`;"`, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: stderr || error.message });
        res.json({ success: true, database });
    });
};
