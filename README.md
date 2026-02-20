<div align="center">
  <img src="build/icon.png" width="150" alt="UploadSql Logo">
  <h1>⚡ UploadSql (UploadBigSql)</h1>
  <p><strong>Envie arquivos SQL massivos direto para instâncias Docker ou Conexões Manuais Locais / Remotas – Rápido, direto e sem travar seu PC.</strong></p>

  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
  [![Electron](https://img.shields.io/badge/Electron-40-blue)](https://www.electronjs.org/)
  [![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org/)
</div>

---

O **UploadSql** é uma aplicação Desktop moderna (construída com Electron, React, e Node.js) desenvolvida para resolver um problema clássico de infraestrutura e desenvolvimento: a importação de dumps gigantescos de banco de dados (`.sql`). 

Aplicativos tradicionais como phpMyAdmin ou as ferramentas nativas muitas vezes congestionam a memória RAM do servidor ou congelam a interface quando o arquivo tem gigabytes de tamanho. O UploadSql resolve isso utilizando comandos nativos de sistema de leitura via fluxo de dados (*streams*), processando "byte-por-byte" sem alocação massiva de disco ou RAM.

## ✨ Principais Funcionalidades

- 🐳 **Autodescoberta Docker**: O aplicativo acha automaticamente todos os containers Docker locais rodando MySQL/MariaDB.
- 🔌 **Conexão Universal (Modo Dual)**: Aceita qualquer banco baseado em MySQL/MariaDB (XAMPP, Laragon, AWS RDS, DigitalOcean, etc), bastando fornecer Host, Porta e Senhas.
- 🚀 **Zero Gargalo de Memória RAM**: Os arquivos `.sql` de entrada sofrem *pipe* direto para a interface do `docker exec` (no modo Docker) ou via stream TCP nativa (no modo Manual), não importa se eles têm 10MB ou 50GB.
- 💎 **Design de Alto Padrão**: Uma UI responsiva e premium desenhada utilizando metodologias de *Glassmorphism* (fundo envidraçado) e gradientes neon em Dark Mode nativo.
- 📁 **Gerenciamento de Bancos**: Crie e visualize todos os seus *Databases* de destino direto pela interface antes do *upload*.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18, Vite, CSS Vanilla (Glassmorphism), qrcode.react
- **Backend / Processamento**: Node.js (Child Processes, Streams), Express, BusBoy, mysql2
- **Desktop Wrapper**: Electron, Electron-Builder (binários em AppImage e NSIS .exe). 

## 📦 Como Usar (Instalação e Execução)

Vá até a aba [Releases](../../releases) do GitHub e baixe o instalador mais recente para a sua máquina:

* **Windows**: Baixe o `UploadSql Setup.exe` e instale normalmente.
* **Linux**: Baixe o `UploadSql.AppImage`, clique com o botão direito -> Propriedades -> Permissões -> "Permitir execução", e dê um duplo clique.

Se você preferir rodar em ambiente de desenvolvimento interativo local:

```bash
# Clone o repositório
git clone https://github.com/thiagoevosis/uploadBigSql.git
cd uploadBigSql

# Instale as dependências (Raiz, Backend e Frontend)
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Inicie tudo com um único comando (Electron + Vite + Express interno)
npm run dev
```

## 🏗️ Como Construir / Buildar

Os binários são fáceis de compilar usando o `electron-builder`:

```bash
# Compilar para o seu SO Nativo (ex: Linux para Linux, Mac para Mac)
npm run build

# Para cruzar builds - compilando o Windows .exe a partir de um Host Linux (Requer Wine ou Docker)
npm run build:win
```

## ☕ Apoie o Projeto

Se esta ferramenta salvou as horas do seu projeto com dumps massivos, considere pagar um café pro desenvolvedor! 

**Chave Pix:** `001.562.612-19`  
**Autor:** Thiago Silva | [buildpages.com.br](https://buildpages.com.br)

## 📄 Licença
Distribuído sob a licença **ISC**.
