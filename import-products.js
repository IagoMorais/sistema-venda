import { readFileSync } from 'fs';
import fetch from 'node-fetch';

// Lê o arquivo de produtos
const fileContent = readFileSync('./attached_assets/Pasted-Aqui-est-uma-lista-de-100-bebidas-com-nome-pre-o-quantidade-e-marca-gerados-aleatoriamente-1--1739937188042.txt', 'utf-8');

const lines = fileContent.split('\n');

const products = [];

// Processa cada linha do arquivo
lines.forEach(line => {
  // Ignora linhas vazias ou cabeçalhos
  if (!line.trim() || line.includes('Aqui está uma lista') || line.includes('Essa lista foi gerada')) {
    return;
  }

  // Remove o número do início e separa os campos
  const parts = line.replace(/^\d+\.\s*/, '').split(' - ');
  if (parts.length === 4) {
    const [name, priceStr, size, brand] = parts;
    // Remove 'R$ ' e converte vírgula para ponto
    const price = priceStr.replace('R$ ', '').replace(',', '.');

    products.push({
      name: `${name} ${size}`,
      price,
      brand,
      quantity: 50, // Quantidade padrão inicial
      minStockLevel: 10 // Nível mínimo de estoque padrão
    });
  }
});

async function importProducts() {
  try {
    const baseURL = 'http://0.0.0.0:3001';

    // Faz login primeiro
    console.log('Tentando fazer login...');
    const loginResponse = await fetch(`${baseURL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'adega',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Falha no login: ${await loginResponse.text()}`);
    }

    // Pega o cookie da sessão
    const sessionCookie = loginResponse.headers.get('set-cookie');
    if (!sessionCookie) {
      throw new Error('Não foi possível obter o cookie de sessão');
    }

    console.log('Login realizado com sucesso');

    // Importa produtos em lotes de 10 para evitar sobrecarga
    const batchSize = 10;
    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`Importando lote ${i / batchSize + 1} de ${Math.ceil(products.length / batchSize)}`);

      const importResponse = await fetch(`${baseURL}/api/products/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': sessionCookie
        },
        body: JSON.stringify(batch)
      });

      if (!importResponse.ok) {
        console.error(`Erro no lote ${i / batchSize + 1}:`, await importResponse.text());
        continue;
      }

      const result = await importResponse.json();
      results.success.push(...result.success);
      results.errors.push(...result.errors);
    }

    console.log('\nImportação concluída:');
    console.log(`Produtos importados com sucesso: ${results.success.length}`);
    if (results.errors.length > 0) {
      console.log(`Erros na importação: ${results.errors.length}`);
      results.errors.forEach((error) => {
        console.log(`- ${error.product}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('Erro durante o processo:', error);
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

importProducts().catch(console.error);