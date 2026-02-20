const busboy = require('busboy');
const { exec } = require('child_process');
const mysql = require('mysql2/promise');

exports.uploadDirect = async (req, res) => {
    let host = '127.0.0.1';
    let port = '3306';
    let user = 'root';
    let password = '';
    let database = '';

    const bb = busboy({ headers: req.headers });

    bb.on('field', (fieldname, val) => {
        if (fieldname === 'host') host = val;
        if (fieldname === 'port') port = val;
        if (fieldname === 'user') user = val;
        if (fieldname === 'password') password = val;
        if (fieldname === 'database') database = val;
    });

    // Strategy for non-docker native environments:
    // We will attempt to pipe to the local `mysql` CLI tool because it's insanely fast for huge files, just like docker exec.
    bb.on('file', (name, file, info) => {
        const passwordFlag = password ? `-p"${password}"` : '';
        const portFlag = port ? `-P ${port}` : '';
        const hostFlag = host ? `-h ${host}` : '';

        const cmd = `mysql -u ${user} ${passwordFlag} ${hostFlag} ${portFlag} ${database}`;

        const child = exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Local MySQL pipe error: ${error.message}`);
                return res.status(500).json({ success: false, error: 'Falha na conexão: ' + error.message });
            }
            res.status(200).json({ success: true, message: 'Upload via conexão direta finalizado!' });
        });

        file.pipe(child.stdin);

        child.stdin.on('error', (err) => {
            console.error('Stdin error on mysql CLI:', err);
            res.status(500).json({ success: false, error: 'O servidor MySQL rejeitou a carga (verifique credenciais).' });
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
