const busboy = require('busboy');
const { spawn } = require('child_process');

async function dropTablesDocker(container, database) {
    return new Promise((resolve, reject) => {
        const cmd = process.platform === 'win32' ? 'cmd.exe' : 'docker';
        const args = process.platform === 'win32'
            ? ['/c', 'chcp 65001 >NUL && docker', 'exec', '-i', container, 'mysql', '-N', '-s', '-e', 'SHOW TABLES;', database]
            : ['exec', '-i', container, 'mysql', '-N', '-s', '-e', 'SHOW TABLES;', database];

        const getTablesCmd = spawn(cmd, args, { shell: process.platform === 'win32' });

        let tables = '';
        getTablesCmd.stdout.on('data', data => tables += data.toString());

        getTablesCmd.on('close', code => {
            if (code !== 0) return reject(new Error('Failed to fetch tables'));

            const tableList = tables.trim().split('\n').filter(t => t);
            if (tableList.length === 0) return resolve();

            const dropQuery = `SET FOREIGN_KEY_CHECKS = 0; ${tableList.map(t => `DROP TABLE IF EXISTS \`${t}\`;`).join(' ')} SET FOREIGN_KEY_CHECKS = 1;`;

            const dropArgs = process.platform === 'win32'
                ? ['/c', 'chcp 65001 >NUL && docker', 'exec', '-i', container, 'mysql', database]
                : ['exec', '-i', container, 'mysql', database];

            const dropCmd = spawn(cmd, dropArgs, { shell: process.platform === 'win32' });

            dropCmd.stdin.write(dropQuery);
            dropCmd.stdin.end();

            dropCmd.on('close', dropCode => {
                if (dropCode !== 0) return reject(new Error('Failed to drop tables'));
                resolve();
            });
        });
    });
}

exports.uploadSql = (req, res) => {
    const { container, database } = req.params;

    if (!container || !database) {
        return res.status(400).json({ error: 'Missing container or database' });
    }

    let errorMessage = '';
    let dropData = false;

    try {
        const bb = busboy({ headers: req.headers });

        bb.on('field', (fieldname, val) => {
            if (fieldname === 'dropData' && val === 'true') {
                dropData = true;
            }
        });

        bb.on('file', async (name, file, info) => {
            console.log(`Receiving file: ${info.filename} to ${container} ${database}. DropData: ${dropData}`);

            // Pause stream while we handle the DB drop if requested
            file.pause();

            try {
                if (dropData) {
                    console.log(`Dropping existing tables in ${database}...`);
                    await dropTablesDocker(container, database);
                    console.log(`Tables dropped successfully in ${database}.`);
                }
            } catch (dropErr) {
                errorMessage += `Error dropping tables: ${dropErr.message}. `;
            }

            // Start import regardless (it will just overwrite if drop failed or wasn't requested)
            const cmd = process.platform === 'win32' ? 'cmd.exe' : 'docker';
            const importArgs = process.platform === 'win32'
                ? ['/c', 'chcp 65001 >NUL && docker', 'exec', '-i', container, 'mysql', database]
                : ['exec', '-i', container, 'mysql', database];

            const dockerCmd = spawn(cmd, importArgs, { shell: process.platform === 'win32' });


            file.pipe(dockerCmd.stdin);
            // Resume stream as pipe is active
            file.resume();

            dockerCmd.on('close', (code) => {
                if (code !== 0) {
                    errorMessage += `Docker command failed with code ${code}. `;
                }
            });

            dockerCmd.stderr.on('data', (data) => {
                console.error(`docker stderr: ${data}`);
                if (!data.toString().includes('password')) {
                    errorMessage += data.toString();
                }
            });

            dockerCmd.on('error', (err) => {
                console.error('Failed to start docker spawn.', err);
                errorMessage += err.message;
            });

            dockerCmd.stdin.on('error', (err) => {
                if (err.code === 'EPIPE') {
                    console.warn('Docker stdin EPIPE expected on early abort (e.g., table already exists)');
                } else {
                    console.error('Docker stdin error:', err);
                    errorMessage += err.message;
                }
            });
        });

        bb.on('close', () => {
            if (errorMessage && !errorMessage.trim().split('\n').every(line => line.includes('insecure'))) {
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

exports.checkTablesDockerRoute = (req, res) => {
    const { container, database } = req.params;
    if (!container || !database) return res.status(400).json({ error: 'Missing container or database' });

    const cmd = process.platform === 'win32' ? 'cmd.exe' : 'docker';
    const args = process.platform === 'win32'
        ? ['/c', 'chcp 65001 >NUL && docker', 'exec', '-i', container, 'mysql', '-N', '-s', '-e', 'SHOW TABLES;', database]
        : ['exec', '-i', container, 'mysql', '-N', '-s', '-e', 'SHOW TABLES;', database];

    const getTablesCmd = spawn(cmd, args, { shell: process.platform === 'win32' });

    let tables = '';
    getTablesCmd.stdout.on('data', data => tables += data.toString());

    getTablesCmd.on('close', code => {
        if (code !== 0) return res.status(500).json({ error: 'Falha ao buscar tabelas do Docker' });
        const tableList = tables.trim().split('\n').filter(t => t);
        res.json({ hasTables: tableList.length > 0 });
    });
};
