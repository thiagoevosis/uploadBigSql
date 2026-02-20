const busboy = require('busboy');
const { spawn } = require('child_process');

exports.uploadSql = (req, res) => {
    const { container, database } = req.params;

    if (!container || !database) {
        return res.status(400).json({ error: 'Missing container or database' });
    }

    let errorMessage = '';

    try {
        const bb = busboy({ headers: req.headers });

        bb.on('file', (name, file, info) => {
            console.log(`Receiving file: ${info.filename} to ${container} ${database}`);

            const dockerCmd = spawn('docker', ['exec', '-i', container, 'mysql', database]);

            file.pipe(dockerCmd.stdin);

            dockerCmd.on('close', (code) => {
                if (code !== 0) {
                    errorMessage += `Docker command failed with code ${code}. `;
                }
            });

            dockerCmd.stderr.on('data', (data) => {
                console.error(`docker stderr: ${data}`);
                // ignore mysql warning: Using a password on the command line interface can be insecure.
                if (!data.toString().includes('password')) {
                    errorMessage += data.toString();
                }
            });

            dockerCmd.on('error', (err) => {
                console.error('Failed to start docker spawn.', err);
                errorMessage += err.message;
            });
        });

        bb.on('close', () => {
            if (errorMessage && !errorMessage.trim().split('\n').every(line => line.includes('insecure'))) {
                // If there's an error not related to insecure password warming
                res.status(500).json({ success: false, error: errorMessage });
            } else {
                res.status(200).json({ success: true, message: 'Import successful' });
            }
        });

        req.pipe(bb);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
