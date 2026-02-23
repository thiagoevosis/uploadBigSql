const busboy = require('busboy');
const { exec } = require('child_process');
const mysql = require('mysql2/promise');

const winPrefix = process.platform === 'win32' ? 'chcp 65001 >NUL & ' : '';

async function dropTablesDirect(host, port, user, password, database) {
    const connection = await mysql.createConnection({
        host: host || '127.0.0.1',
        port: parseInt(port || '3306'),
        user: user || 'root',
        password: password || '',
        database: database
    });

    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length === 0) {
        await connection.end();
        return;
    }

    const tableNames = tables.map(t => Object.values(t)[0]);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const t of tableNames) {
        await connection.query(`DROP TABLE IF EXISTS \`${t}\``);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.end();
}

exports.uploadDirect = async (req, res) => {
    let host = '127.0.0.1';
    let port = '3306';
    let user = 'root';
    let password = '';
    let database = '';
    let dropData = false;

    const bb = busboy({ headers: req.headers });

    bb.on('field', (fieldname, val) => {
        if (fieldname === 'host') host = val;
        if (fieldname === 'port') port = val;
        if (fieldname === 'user') user = val;
        if (fieldname === 'password') password = val;
        if (fieldname === 'database') database = val;
        if (fieldname === 'dropData' && val === 'true') dropData = true;
    });

    // Strategy for non-docker native environments:
    // We will attempt to pipe to the local `mysql` CLI tool because it's insanely fast for huge files, just like docker exec.
    bb.on('file', async (name, file, info) => {
        file.pause();

        try {
            if (dropData) {
                console.log(`Dropping existing tables in direct DB ${database}...`);
                await dropTablesDirect(host, port, user, password, database);
                console.log(`Tables dropped successfully in direct DB ${database}.`);
            }
        } catch (dropErr) {
            console.error(`Error dropping tables direct DB: ${dropErr}`);
        }

        const passwordFlag = password ? `-p"${password}"` : '';
        const portFlag = port ? `-P ${port}` : '';
        const hostFlag = host ? `-h ${host}` : '';

        const cmd = `${winPrefix}mysql -u ${user} ${passwordFlag} ${hostFlag} ${portFlag} ${database}`;

        const child = exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Local MySQL pipe error: ${error.message}`);
                const logDetails = stderr ? ` | Detalhes: ${stderr}` : '';
                return res.status(500).json({ success: false, error: 'Falha no import DB: ' + error.message + logDetails });
            }
            res.status(200).json({ success: true, message: 'Upload via conexão direta finalizado!' });
        });


        file.pipe(child.stdin);
        file.resume();

        child.stdin.on('error', (err) => {
            if (err.code === 'EPIPE') {
                console.warn('MySQL CLI stdin EPIPE expected on early abort (e.g., table already exists)');
            } else {
                console.error('Stdin error on mysql CLI:', err);
            }
        });
    });

    req.pipe(bb);
};


exports.testDirectConnection = async (req, res) => {
    const { host, port, user, password } = req.body;
    try {
        const connection = await mysql.createConnection({
            host: host || '127.0.0.1',
            port: parseInt(port || '3306'),
            user: user || 'root',
            password: password || ''
        });

        const [rows] = await connection.query('SHOW DATABASES');
        await connection.end();

        const dbs = rows.map(r => Object.values(r)[0]).filter(d => !['information_schema', 'performance_schema', 'sys', 'mysql'].includes(d));
        res.json(dbs);
    } catch (err) {
        res.status(500).json({ error: 'Erro de Autenticação/TCP: ' + err.message });
    }
};

exports.createDirectDatabase = async (req, res) => {
    const { host, port, user, password, database } = req.body;
    try {
        const connection = await mysql.createConnection({
            host: host || '127.0.0.1',
            port: parseInt(port || '3306'),
            user: user || 'root',
            password: password || ''
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await connection.end();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Falha ao criar DB: ' + err.message });
    }
};

exports.checkTablesDirectRoute = async (req, res) => {
    const { host, port, user, password, database } = req.body;
    try {
        const connection = await mysql.createConnection({
            host: host || '127.0.0.1',
            port: parseInt(port || '3306'),
            user: user || 'root',
            password: password || '',
            database: database
        });

        const [tables] = await connection.query('SHOW TABLES');
        await connection.end();
        res.json({ hasTables: tables.length > 0 });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao verificar tabelas: ' + err.message });
    }
};
