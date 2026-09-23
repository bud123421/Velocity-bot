const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Daftar Slash Command /logs (Attachment gambar dihapus, diganti otomatis di kodingan)
const commands = [
    new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Kirim log member baru')
        .addStringOption(option => option.setName('fullname').setDescription('Nama lengkap member').setRequired(true))
        .addStringOption(option => option.setName('status').setDescription('Status/pangkat member').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan log').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('Catatan tambahan').setRequired(true))
        .addUserOption(option => option.setName('member').setDescription('Mention user discord member').setRequired(true))
        .addRoleOption(option => option.setName('logsto').setDescription('Pilih role tujuan log').setRequired(true))
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} sudah online!`);

    // Deploy Slash Commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
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
        const logsTo = interaction.options.getRole('logsto');

        // URL Gambar tetap otomatis (Ganti link di bawah dengan link gambar pilihan Anda)
        const fixedImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg?ex=6ab4994d&is=6ab347cd&hm=fc73a31caaf12737c036ac2f9cb1587baa7ec17c386bcb98e1e165a496d5d0d1&';

        // Membuat Tampilan Embed
        const embed = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('VEC LOGS')
            .setDescription('__**LOGS VELOCITY ELITE CLUB**__\n' +
                `> • Full Name: **${fullName}**\n` +
                `> • Discord: **${memberUser}**\n` +
                `> • Status: **${status}**\n` +
                `> • Logs To: **${logsTo}**\n` +
                `> • Reason: **${reason}**\n` +
                `> • Note: **${note}**\n\n` +
                `> • Logs By: **${interaction.user}**`
            )
            .setImage(fixedImageUrl)
            .setFooter({ text: `Signed By ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ content: 'Log berhasil dikirim!', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
