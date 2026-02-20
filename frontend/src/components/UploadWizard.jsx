import React, { useState, useEffect, useRef } from 'react';

export default function UploadWizard() {
    const [containers, setContainers] = useState([]);
    const [selectedContainer, setSelectedContainer] = useState('');
    const [databases, setDatabases] = useState([]);
    const [selectedDatabase, setSelectedDatabase] = useState('');
    const [newDbName, setNewDbName] = useState('');

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const fileInputRef = useRef(null);
    const API_URL = 'http://localhost:3001/api';

    const [activeTab, setActiveTab] = useState('docker'); // 'docker' or 'manual'

    // Manual DB State
    const [manualHost, setManualHost] = useState('127.0.0.1');
    const [manualPort, setManualPort] = useState('3306');
    const [manualUser, setManualUser] = useState('root');
    const [manualPassword, setManualPassword] = useState('');
    const [manualDatabase, setManualDatabase] = useState('');

    useEffect(() => {
        if (activeTab === 'docker') {
            fetch(`${API_URL}/containers`)
                .then(async res => {
                    let data;
                    try { data = await res.json(); } catch (e) { throw new Error('Servidor interno indisponível.'); }
                    if (!res.ok) throw new Error(data.error || 'Falha de comunicação');
                    return data;
                })
                .then(data => {
                    setContainers(data || []);
                    if (!data || data.length === 0) {
                        setStatus({ type: 'error', message: 'Ocorreu um erro: Nenhum container Docker ativo foi detectado localmente.' });
                    } else {
                        setStatus({ type: '', message: '' });
                    }
                })
                .catch(err => setStatus({ type: 'error', message: `🔍 Docker Erro: ${err.message}. Se seu banco for XAMPP/Laragon, acesse a aba "Conexão Manual" acima.` }));
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedContainer && activeTab === 'docker') {
            setDatabases([]);
            setSelectedDatabase('');
            fetch(`${API_URL}/containers/${selectedContainer}/databases`)
                .then(res => res.json())
                .then(data => {
                    const dbs = Array.isArray(data) ? data : [];
                    const filtered = dbs.filter(d => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(d));
                    setDatabases(filtered);
                })
                .catch(err => setStatus({ type: 'error', message: 'Failed to fetch DBs.' }));
        }
    }, [selectedContainer, activeTab]);

    const handleCreateDbDocker = async () => {
        if (!newDbName || !selectedContainer) return;
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch(`${API_URL}/containers/${selectedContainer}/databases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ database: newDbName })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setDatabases(prev => [...prev, newDbName]);
                setSelectedDatabase(newDbName);
                setNewDbName('');
                setStatus({ type: 'success', message: `Database ${newDbName} criado!` });
            } else {
                setStatus({ type: 'error', message: data.error || 'Failed to create DB' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
    };

    const handleCreateDbManual = async () => {
        if (!newDbName || !manualHost) return;
        setUploading(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch(`${API_URL}/universal/create-database`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host: manualHost, port: manualPort, user: manualUser, password: manualPassword, database: newDbName })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setManualDatabase(newDbName);
                setNewDbName('');
                setStatus({ type: 'success', message: `Database ${newDbName} criado na base manual!` });
            } else {
                setStatus({ type: 'error', message: data.error || 'Falha ao criar Banco' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setUploading(false);
    };

    const handleTestManualConnection = async () => {
        setUploading(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch(`${API_URL}/universal/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host: manualHost, port: manualPort, user: manualUser, password: manualPassword })
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setDatabases(data);
                setStatus({ type: 'success', message: 'Conexão estabelecida com sucesso!' });
            } else {
                setStatus({ type: 'error', message: data.error || 'Falha ao conectar' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setUploading(false);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUploadDocker = async (formData) => {
        const res = await fetch(`${API_URL}/containers/${selectedContainer}/databases/${selectedDatabase}/import`, {
            method: 'POST',
            body: formData
        });
        return res;
    };

    const handleUploadManual = async (formData) => {
        formData.append('host', manualHost);
        formData.append('port', manualPort);
        formData.append('user', manualUser);
        formData.append('password', manualPassword);
        formData.append('database', manualDatabase);

        const res = await fetch(`${API_URL}/universal/import`, {
            method: 'POST',
            body: formData
        });
        return res;
    };

    const handleUpload = async () => {
        if (!file) return;
        if (activeTab === 'docker' && (!selectedContainer || !selectedDatabase)) return;
        if (activeTab === 'manual' && !manualDatabase) return;

        setUploading(true);
        setStatus({ type: '', message: '' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const startTime = Date.now();
            let res;

            if (activeTab === 'docker') {
                res = await handleUploadDocker(formData);
            } else {
                res = await handleUploadManual(formData);
            }

            const data = await res.json();
            const elapsed = Math.round((Date.now() - startTime) / 1000);

            if (res.ok && data.success) {
                setStatus({ type: 'success', message: `Importação concluída com sucesso em ${elapsed}s!` });
                setFile(null);
            } else {
                setStatus({ type: 'error', message: data.error || 'Upload failed' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        }
        setUploading(false);
    };

    return (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>Configurar Importação</h2>
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'docker' ? 'active' : ''}`}
                    onClick={() => setActiveTab('docker')}
                    disabled={uploading}
                >
                    🐳 Autodescoberta Docker
                </button>
                <button
                    className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                    disabled={uploading}
                >
                    🔌 Conexão Manual (XAMPP/Web)
                </button>
            </div>

            {activeTab === 'docker' && (
                <>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label>Containers Docker Ativos</label>
                        <select value={selectedContainer} onChange={e => setSelectedContainer(e.target.value)} disabled={uploading}>
                            <option value="">Selecione um container...</option>
                            {containers.map((c, idx) => (
                                <option key={idx} value={c.Names}>{c.Names} ({c.Image})</option>
                            ))}
                        </select>
                    </div>

                    {selectedContainer && (
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label>Banco de Dados de Destino</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <select value={selectedDatabase} onChange={e => setSelectedDatabase(e.target.value)} disabled={uploading} style={{ flex: '1 1 200px' }}>
                                    <option value="">Selecione um banco...</option>
                                    {databases.map(db => (
                                        <option key={db} value={db}>{db}</option>
                                    ))}
                                </select>
                                <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 200px' }}>
                                    <input
                                        type="text"
                                        placeholder="Nome do novo DB"
                                        value={newDbName}
                                        onChange={e => setNewDbName(e.target.value)}
                                        disabled={uploading}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="secondary" onClick={handleCreateDbDocker} style={{ width: 'auto', marginTop: 0 }} disabled={!newDbName || uploading}>Criar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'manual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ flex: 2, marginBottom: 0 }}>
                            <label>Host</label>
                            <input type="text" value={manualHost} onChange={e => setManualHost(e.target.value)} placeholder="127.0.0.1" disabled={uploading} />
                        </div>
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label>Porta</label>
                            <input type="text" value={manualPort} onChange={e => setManualPort(e.target.value)} placeholder="3306" disabled={uploading} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label>Usuário</label>
                            <input type="text" value={manualUser} onChange={e => setManualUser(e.target.value)} placeholder="root" disabled={uploading} />
                        </div>
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                            <label>Senha</label>
                            <input type="password" value={manualPassword} onChange={e => setManualPassword(e.target.value)} placeholder="(vazio)" disabled={uploading} />
                        </div>
                    </div>

                    <button className="secondary" onClick={handleTestManualConnection} disabled={uploading} style={{ padding: '0.5rem' }}>
                        Testar Conexão e Listar Bancos
                    </button>

                    <div className="input-group" style={{ marginBottom: 0, marginTop: '0.5rem' }}>
                        <label>Banco de Dados de Destino (Obrigatório)</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <select value={manualDatabase} onChange={e => setManualDatabase(e.target.value)} disabled={uploading} style={{ flex: '1 1 200px' }}>
                                <option value="">Selecione ou digite abaixo...</option>
                                {databases.map(db => (
                                    <option key={db} value={db}>{db}</option>
                                ))}
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 200px' }}>
                                <input
                                    type="text"
                                    placeholder="Nome Deste Novo BD"
                                    value={newDbName}
                                    onChange={e => setNewDbName(e.target.value)}
                                    disabled={uploading}
                                    style={{ flex: 1 }}
                                />
                                <button className="secondary" onClick={handleCreateDbManual} style={{ width: 'auto', marginTop: 0 }} disabled={!newDbName || uploading}>Criar DB</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(activeTab === 'docker' && selectedDatabase) || (activeTab === 'manual' && manualDatabase) ? (
                <>
                    <div
                        className={`dropzone ${file ? 'active' : ''}`}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleFileDrop}
                        onClick={() => !uploading && fileInputRef.current.click()}
                    >
                        <input
                            type="file"
                            accept=".sql"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                        <div className="icon">📁</div>
                        {file ? (
                            <p>Selecionado: <span style={{ color: '#f3f4f6', fontWeight: 600 }}>{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                        ) : (
                            <p>Arraste seu arquivo SQL massivo aqui, ou <span className="browse">clique para buscar</span></p>
                        )}
                    </div>

                    <button
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? 'Transmitindo SQL...' : 'Iniciar Importação Super Rápida'}
                    </button>
                </>
            ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '2rem 0' }}>
                    {activeTab === 'docker' && !selectedContainer && 'Selecione um Docker ou use a Conexão Manual para continuar.'}
                    {activeTab === 'docker' && selectedContainer && !selectedDatabase && 'Selecione ou crie um banco de dados para continuar.'}
                    {activeTab === 'manual' && !manualDatabase && 'Defina o banco de destino acima para liberar o upload.'}
                </p>
            )}

            {uploading && (
                <div className="progress-container" style={{ marginTop: 0 }}>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill streaming"></div>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--accent-color)' }}>
                        Processando fluxo contínuo de dados em tempo real...
                    </p>
                </div>
            )}

            {status.message && (
                <p style={{ textAlign: 'center', margin: 0 }} className={status.type === 'success' ? 'status-success' : 'status-error'}>
                    {status.message}
                </p>
            )}
        </div>
    );
}
