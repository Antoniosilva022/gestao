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
        
        // Etapa 1: Limpa o admin antigo se ele já existir
        const queryDelete = "DELETE FROM usuarios WHERE email = 'admin@empresa.com';";
        await pool.query(queryDelete);
        
        // Etapa 2: Insere o admin novo com a senha zerada e correta
        const queryInsert = `
            INSERT INTO usuarios (empresa_id, nome, email, senha, ativo)
            VALUES (1, 'Administrador', 'admin@empresa.com', $1, true);
        `;
        await pool.query(queryInsert, [senhaCriptografada]);

        console.log('🎉 Perfeito! Usuário admin@empresa.com recriado com sucesso na Render!');
        console.log('🔑 Senha de acesso atualizada para: admin123');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
    } finally {
        await pool.end();
    }
}