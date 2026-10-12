const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração extraída diretamente do seu arquivo .env.example para o Docker
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'gestao_empresa', // 👈 Nome real do banco do seu Docker
    user: 'postgres', // 👈 Usuário real
    password: '1234', // 👈 Senha real extraída da imagem!
});

async function criarUsuario() {
    try {
        console.log('Conectando ao banco do seu Docker local...');
        
        // 1. Força a criação da coluna 'role' caso ela não exista no seu banco local
        await pool.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
        `);
        console.log('Column checking completed...');

        // Gerando a senha criptografada padrão
        const senhaCripto = await bcrypt.hash('admin123', 10);

        // 2. Insere o administrador na tabela local do contêiner
        await pool.query(`
            INSERT INTO usuarios (nome, email, senha, role) 
            VALUES ('Administrador Local', 'admin@empresa.com', \$1, 'admin')
            ON CONFLICT (email) DO UPDATE SET senha = \$1, role = 'admin';
        `, [senhaCripto]);

        console.log('🎉 SUCESSO TOTAL! O usuário admin@empresa.com foi gravado no banco de dados do seu Docker!');
    } catch (error) {
        console.error('❌ Erro ao criar usuário local:', error.message);
    } finally {
        await pool.end();
    }
}