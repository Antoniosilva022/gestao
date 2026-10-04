/**
 * Script para verificar se o usuário admin existe no banco do Render
 * Use assim:
 *   DATABASE_URL="postgresql://usuario:senha@host/banco" node check-admin-user.js
 * 
 * Não compartilhe a DATABASE_URL em público; use localmente ou em CI/CD seguro.
 */

const { Client } = require('pg');

async function checkAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não definida');
    console.error('Use: DATABASE_URL="postgresql://..." node check-admin-user.js');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('🔍 Conectando ao banco...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Verifica se a tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'usuarios'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela "usuarios" não existe. A migração ainda não foi executada.');
      console.log('Execute: npm run migrate\n');
      process.exit(1);
    }

    // Busca o usuário admin (sem revelar senha)
    const result = await client.query(`
      SELECT id, nome, email, perfil, ativo, empresa_id, criado_em
      FROM usuarios
      WHERE LOWER(email) = 'admin@empresa.com'
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  Usuário admin@empresa.com NÃO encontrado.');
      console.log('Execute a migração para criar o usuário padrão:');
      console.log('  npm run migrate\n');
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ Usuário encontrado:\n');
    console.log(`  ID:         ${user.id}`);
    console.log(`  Nome:       ${user.nome}`);
    console.log(`  Email:      ${user.email}`);
    console.log(`  Perfil:     ${user.perfil}`);
    console.log(`  Ativo:      ${user.ativo ? '✅ Sim' : '❌ Não'}`);
    console.log(`  Empresa:    ${user.empresa_id}`);
    console.log(`  Criado em:  ${user.criado_em}\n`);

    if (!user.ativo) {
      console.log('⚠️  ATENÇÃO: O usuário está INATIVO. Ative-o com:');
      console.log('  UPDATE usuarios SET ativo = true WHERE id = ' + user.id + ';');
      console.log('');
    }

    if (user.empresa_id !== 1) {
      console.log('⚠️  ATENÇÃO: O usuário está na empresa ' + user.empresa_id + ', não na 1.');
      console.log('');
    }

    console.log('Para resetar a senha para admin123, execute este comando SQL:');
    console.log("  UPDATE usuarios SET senha = '$2a$10$MYhWkSU/7E8KWjP88MkuuO5rGC2L.Y0CnO1t9EbVHxGANrejU4UpC' WHERE id = " + user.id + ';');
    console.log('');
  } catch (err) {
    console.error('❌ Erro ao conectar/consultar:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkAdminUser();
