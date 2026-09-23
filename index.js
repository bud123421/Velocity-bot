const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Daftarkan Slash Command /logs
const commands = [
    new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Kirim log member baru')
        .addStringOption(option => option.setName('fullname').setDescription('Nama lengkap member').setRequired(true))
        .addStringOption(option => option.setName('status').setDescription('Status/pangkat member').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan log').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('Catatan tambahan').setRequired(true))
        .addUserOption(option => option.setName('member').setDescription('Mention user discord member').setRequired(true))
        .addAttachmentOption(option => option.setName('image').setDescription('Lampirkan bukti foto/screenshot').setRequired(true))
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} sudah online!`);
    
    // Deploy Slash Commands
    const rest = new REST({ version: '10' }).setToken('TOKEN_BOT_ANDA');
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('Berhasil mendaftarkan slash commands!');
    } catch (error) {
        console.error(error);
    }
});

// Eksekusi ketika command /logs dipanggil
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'logs') {
        const fullName = interaction.options.getString('fullname');
        const memberUser = interaction.options.getUser('member');
        const status = interaction.options.getString('status');
        const reason = interaction.options.getString('reason');
        const note = interaction.options.getString('note');
        const image = interaction.options.getAttachment('image');

        // Membuat Tampilan Embed (Mirip VEC LOGS di gambar)
        const embed = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('VEC LOGS')
            .setDescription('**LOGS VELOCITY ELITE CLUB**\n' +
                `• **Full Name:** ${fullName}\n` +
                `• **Discord:** <@${memberUser.id}>\n` +
                `• **Status:** ${status}\n` +
                `• **Logs To:** <@&ROLE_ID_TUJUAN>\n` +
                `• **Reason:** ${reason}\n` +
                `• **Note:** ${note}\n\n` +
                `• **Logs By:** <@${interaction.user.id}>`)
            .setImage(image.url)
            .setFooter({ text: `Signed By ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ content: 'Log berhasil dikirim!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);

