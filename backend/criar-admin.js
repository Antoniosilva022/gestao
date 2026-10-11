const { pool } = require('./src/config/database'); // Ajuste o caminho se o seu arquivo database.js estiver em outro lugar
const bcrypt = require('bcrypt');

async function criarUsuarioAdmin() {
    try {
        console.log('Conectando ao banco da Render para criar o administrador...');
        
        // Criptografa a senha para salvar com segurança no banco
        const senhaCriptografada = await bcrypt.hash('admin123', 10); 
        
        const query = `
            INSERT INTO usuarios (empresa_id, nome, email, senha, ativo)
            VALUES (1, 'Administrador', 'admin@empresa.com', $1, true)
            ON CONFLICT (email) DO NOTHING;
        `;
        
        await pool.query(query, [senhaCriptografada]);
        console.log('🎉 Usuário admin@empresa.com criado com sucesso na Render!');
        console.log('🔑 Sua senha de acesso temporária é: admin123');
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error.message);
    } finally {
        await pool.end();
    }
}

criarUsuarioAdmin();