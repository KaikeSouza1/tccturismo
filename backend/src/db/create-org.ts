import { pool } from "../config/db";
import { createOrganizationWithAdmin } from "../modules/organizations/organizations.service";

/**
 * Cria uma nova organizacao (ex: prefeitura/associacao de turismo de outro
 * municipio) e sua primeira conta admin. Uso:
 *
 *   npm run create-org -- --org "Nome da Organizacao" --admin-name "Nome" --admin-email admin@exemplo.com --admin-password "senha123"
 *
 * Equivalente a criar pela tela "Organizacoes" do painel com a conta
 * platform_admin — este script continua existindo para uso via terminal.
 */

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const orgName = readArg("--org");
  const adminName = readArg("--admin-name");
  const adminEmail = readArg("--admin-email");
  const adminPassword = readArg("--admin-password");

  if (!orgName || !adminName || !adminEmail || !adminPassword) {
    console.error(
      'Uso: npm run create-org -- --org "Nome da Organizacao" --admin-name "Nome" --admin-email admin@exemplo.com --admin-password "senha123"'
    );
    process.exitCode = 1;
    return;
  }
  if (adminPassword.length < 6) {
    console.error("A senha do admin deve ter ao menos 6 caracteres.");
    process.exitCode = 1;
    return;
  }

  const organization = await createOrganizationWithAdmin({
    name: orgName,
    adminName,
    adminEmail,
    adminPassword,
  });

  console.log(`Organizacao criada: ${organization.name} (slug: ${organization.slug})`);
  console.log(`Admin criado: ${adminEmail} / senha: ${adminPassword}`);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Falha ao criar organizacao:", err.message ?? err);
    await pool.end();
    process.exit(1);
  });
