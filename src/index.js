require('dotenv').config();

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

const { DISCORD_TOKEN, CHANNEL_ID, ROLE_NAME } = process.env;

if (!DISCORD_TOKEN || !CHANNEL_ID || !ROLE_NAME) {
  throw new Error('Defina DISCORD_TOKEN, CHANNEL_ID e ROLE_NAME no arquivo .env.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function createPanel() {
  const embed = new EmbedBuilder()
    .setTitle('Registro')
    .setDescription('Clique no botão abaixo para preencher seu registro.')
    .setColor(0x5865f2);

  const button = new ButtonBuilder()
    .setCustomId('register')
    .setLabel('Registre-se')
    .setStyle(ButtonStyle.Primary);

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(button)],
  };
}

async function publishPanel() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!channel || !channel.isTextBased() || !('messages' in channel)) {
    throw new Error(`O canal ${CHANNEL_ID} não existe ou não aceita mensagens.`);
  }

  const recentMessages = await channel.messages.fetch({ limit: 100 });
  const existingPanel = recentMessages.find(
    (message) =>
      message.author.id === client.user.id &&
      message.components.some((row) =>
        row.components.some((component) => component.customId === 'register'),
      ),
  );

  if (existingPanel) {
    await existingPanel.edit(createPanel());
    console.log(`Painel atualizado no canal ${CHANNEL_ID}.`);
    return;
  }

  const message = await channel.send(createPanel());
  console.log(`Painel publicado no canal ${CHANNEL_ID} (mensagem ${message.id}).`);
}

function createRegistrationModal() {
  const nameInput = new TextInputBuilder()
    .setCustomId('character_name')
    .setLabel('Nome do personagem')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(32)
    .setRequired(true);

  const idInput = new TextInputBuilder()
    .setCustomId('character_id')
    .setLabel('ID do personagem (FiveM)')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(32)
    .setRequired(true);

  const recruiterInput = new TextInputBuilder()
    .setCustomId('recruiter')
    .setLabel('Quem recrutou você?')
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(64)
    .setRequired(true);

  return new ModalBuilder()
    .setCustomId('registration_form')
    .setTitle('Formulário de registro')
    .addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(idInput),
      new ActionRowBuilder().addComponents(recruiterInput),
    );
}

async function handleRegistration(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply('O registro só pode ser feito dentro do servidor.');
    return;
  }

  const name = interaction.fields.getTextInputValue('character_name').trim();
  const characterId = interaction.fields.getTextInputValue('character_id').trim();
  const recruiter = interaction.fields.getTextInputValue('recruiter').trim();

  if (!name || !characterId || !recruiter) {
    await interaction.editReply('Preencha todos os campos antes de enviar o registro.');
    return;
  }

  const matchingRoles = await guild.roles.fetch();
  const roleMatches = matchingRoles.filter((role) => role.name === ROLE_NAME);

  if (roleMatches.size !== 1) {
    throw new Error(
      `Esperava encontrar exatamente um cargo chamado "${ROLE_NAME}", mas encontrei ${roleMatches.size}.`,
    );
  }

  const role = roleMatches.first();
  const botMember = await guild.members.fetchMe();

  if (
    !botMember.permissions.has(PermissionFlagsBits.ManageRoles) ||
    !botMember.permissions.has(PermissionFlagsBits.ManageNicknames) ||
    !role.editable
  ) {
    throw new Error(
      `Confira se o bot tem Gerenciar cargos e Gerenciar apelidos, e se o cargo do bot está acima de "${ROLE_NAME}".`,
    );
  }

  const member = await guild.members.fetch(interaction.user.id);
  let nicknameUpdated = false;
  let roleAssigned = false;

  try {
    await member.setNickname(name, 'Registro pelo painel de registro');
    nicknameUpdated = true;

    await member.roles.add(role, 'Registro pelo painel de registro');
    roleAssigned = true;
  } catch (error) {
    console.error('Falha ao aplicar os dados do registro:', error);

    if (nicknameUpdated && !roleAssigned) {
      await interaction.editReply(
        'Seu apelido foi atualizado, mas não consegui atribuir o cargo. Avise a equipe do servidor.',
      );
      return;
    }

    if (!nicknameUpdated && roleAssigned) {
      await interaction.editReply(
        'O cargo foi atribuído, mas não consegui atualizar seu apelido. Avise a equipe do servidor.',
      );
      return;
    }

    throw error;
  }

  await interaction.editReply(
    `Registro concluído! Apelido atualizado e cargo **${role.name}** atribuído.`,
  );
  console.log(`Registro concluído para o usuário ${interaction.user.id}.`);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot conectado como ${readyClient.user.tag}.`);
  publishPanel().catch((error) => {
    console.error('Não foi possível publicar o painel:', error);
    readyClient.destroy();
    process.exitCode = 1;
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === 'register') {
      await interaction.showModal(createRegistrationModal());
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'registration_form') {
      await handleRegistration(interaction);
    }
  } catch (error) {
    console.error('Falha ao processar a interação:', error);

    const response = {
      content: 'Não consegui concluir essa ação. Confira as permissões e configurações do bot.',
      ephemeral: true,
    };

    if (interaction.deferred) {
      await interaction.editReply(response);
    } else if (interaction.replied) {
      await interaction.followUp(response);
    } else if (interaction.isRepliable()) {
      await interaction.reply(response);
    }
  }
});

client.login(DISCORD_TOKEN);
