const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function exportarBackup() {
    try {
        console.log('Conectando ao banco da Render para gerar backup...');
        let sqlDump = `-- Backup Gerado em: ${new Date().toLocaleString()}\n\n`;

        // 1. Busca todas as tabelas públicas do banco
        const tabelasRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `);

        const tabelas = tabelasRes.rows.map(r => r.table_name);

        for (const tabela of tabelas) {
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `-- Estrutura e Dados da tabela: ${tabela}\n`;
            sqlDump += `-- --------------------------------------------------------\n\n`;

            // 2. Busca os dados de cada tabela
            const dadosRes = await pool.query(`SELECT * FROM "${tabela}";`);
            
            if (dadosRes.rows.length > 0) {
                for (const linha of dadosRes.rows) {
                    const colunas = Object.keys(linha).map(c => `"${c}"`).join(', ');
                    const valores = Object.values(linha).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        return val;
                    }).join(', ');

                    sqlDump += `INSERT INTO "${tabela}" (${colunas}) VALUES (${valores});\n`;
                }
                sqlDump += `\n`;
            }
        }

        // 3. Salva o arquivo no seu computador
        fs.writeFileSync('backup_bijuteria.sql', sqlDump);
        console.log('🎉 Perfeito! O arquivo "backup_bijuteria.sql" foi gerado com sucesso na pasta do seu backend!');

    } catch (error) {
        console.error('❌ Erro ao gerar backup:', error.message);
    } finally {
        await pool.end();
    }
}

exportarBackup();
