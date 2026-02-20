import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import UploadWizard from './components/UploadWizard';
import './index.css';

function App() {
  return (
    <div>
      <h1>UploadSql</h1>
      <p className="subtitle">Envie arquivos SQL massivos direto para instâncias Docker ou Conexões Manuais Locais / Remotas</p>

      <div className="app-grid">
        <UploadWizard />

        <div className="glass-panel" style={{ background: 'rgba(17, 24, 39, 0.4)' }}>
          <h2>Como Funciona</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem' }}>⚡ Zero Gargalo de Memória RAM</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Ao invés de carregar o arquivo na memória, este app transmite o upload byte por byte direto para o processo <code style={{ color: 'var(--accent-color)', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>docker exec</code> via stdin (Ou via conexão TCP nativa no Modo Manual).
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem' }}>🐳 Integração Universal</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Conecta nativamente no seu Docker local ou em servidores web como XAMPP e Laragon. Cria bancos de dados e injeta comandos SQL sem ocupar cache intermediário de disco.
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '1rem' }}>💎 Projetado para Bancos Gigantes</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                Não importa se é um patch de 10MB ou um dump de produção de 50GB. O processo não irá congelar a interface.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="compact-footer">
        <p>
          Criado por <strong>Thiago Silva</strong> | <a href="https://buildpages.com.br" target="_blank" rel="noopener noreferrer">buildpages.com.br</a>
        </p>
        <div className="pix-badge">
          <div className="pix-text">
            <span>☕ Me pague um café! Leia o QR Code 👉</span>
            <span>Chave PIX: <strong>001.562.612-19</strong></span>
          </div>
          <div className="qr-wrapper">
            <QRCodeSVG value="001.562.612-19" size={50} bgColor={"#ffffff"} fgColor={"#000000"} level={"L"} />
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
