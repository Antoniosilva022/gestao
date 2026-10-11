const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config(); 

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

async function criarUsuarioAdmin() {
    try {
        console.log('Conectando ao banco da Render usando os dados do .env...');
        
        const senhaCriptografada = await bcrypt.hash('admin123', 10); 
        
        const query = `
            INSERT INTO usuarios (empresa_id, nome, email, senha, ativo)
            VALUES (1, 'Administrador', 'admin@empresa.com', $1, true);
        `;
        
        await pool.query(query, [senhaCriptografada]);
        console.log('🎉 Perfeito! Usuário admin@empresa.com criado com sucesso na Render!');
        console.log('🔑 Senha de acesso temporária: admin123');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
    } finally {
        await pool.end();
    }
}

criarUsuarioAdmin();