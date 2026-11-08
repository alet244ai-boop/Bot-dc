# Bot de registro para Discord

O bot publica um painel no canal configurado. O botão **Registre-se** abre um formulário para:

- nome do personagem (usado como apelido no servidor);
- ID do personagem no FiveM;
- quem recrutou a pessoa.

Depois do envio, o bot atualiza o apelido e atribui o cargo configurado. O bot não salva o ID do personagem nem o nome do recrutador; eles são usados apenas durante o processamento do formulário.

## Preparação

1. Instale o [Node.js](https://nodejs.org/) 18 ou superior.
2. No [Discord Developer Portal](https://discord.com/developers/applications), crie uma aplicação e adicione um bot.
3. Convide o bot para o servidor com o escopo `bot`. Ele precisa das permissões **Ver canal**, **Enviar mensagens**, **Incorporar links**, **Ler histórico de mensagens**, **Gerenciar apelidos** e **Gerenciar cargos**.
4. Copie `.env.example` para `.env` e preencha `DISCORD_TOKEN`. O canal já está configurado com o ID informado; `ROLE_NAME` precisa corresponder exatamente ao nome do cargo.
5. No servidor, coloque o cargo do bot acima do cargo `✨┃Luxx Club` na hierarquia de cargos.
6. No terminal, dentro da pasta do projeto, execute:

   ```sh
   npm install
   npm start
   ```

Ao iniciar, o bot publica o painel no canal configurado. Se encontrar o painel entre as 100 mensagens mais recentes, ele o atualiza em vez de publicar outro.

## Observações

- Mantenha o token privado. Se ele vazar, gere outro no Developer Portal.
- O bot precisa estar online para receber os cliques e processar formulários.
- O nome informado deve ter até 32 caracteres, limite de apelidos do Discord.
- Se o cadastro falhar, confira as permissões do bot, a posição do cargo dele e os erros exibidos no terminal.
