import fetch from 'node-fetch';

async function createAdmin() {
  try {
    const baseURL = 'http://0.0.0.0:3001';  

    console.log('Criando usuário administrador...');
    const response = await fetch(`${baseURL}/api/setup-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Falha ao criar admin: ${await response.text()}`);
    }

    const result = await response.json();
    console.log('Usuário administrador criado com sucesso:', result);

  } catch (error) {
    console.error('Erro durante o processo:', error);
    if (error instanceof Error) {
      console.error('Detalhes do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

createAdmin().catch(console.error);