const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ] 
});

const commands = [
    new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Kirim log member baru')
        .addStringOption(option => option.setName('fullname').setDescription('Nama lengkap member').setRequired(true))
        .addStringOption(option => option.setName('status').setDescription('Status/pangkat member').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan log').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('Catatan tambahan').setRequired(true))
        .addUserOption(option => option.setName('member').setDescription('Mention user discord member').setRequired(true))
        .addRoleOption(option => option.setName('logsto').setDescription('Pilih role tujuan log').setRequired(true)),

    new SlashCommandBuilder()
        .setName('roleadd')
        .setDescription('Menambahkan 1 atau 2 role sekaligus ke member')
        .addUserOption(option => option.setName('member').setDescription('Pilih member target').setRequired(true))
        .addRoleOption(option => option.setName('role1').setDescription('Role pertama yang ingin diberikan').setRequired(true))
        .addRoleOption(option => option.setName('role2').setDescription('Role kedua (opsional)').setRequired(false)),

    new SlashCommandBuilder()
        .setName('roleremove')
        .setDescription('Menghapus 1 atau 2 role sekaligus dari member')
        .addUserOption(option => option.setName('member').setDescription('Pilih member target').setRequired(true))
        .addRoleOption(option => option.setName('role1').setDescription('Role pertama yang ingin dihapus').setRequired(true))
        .addRoleOption(option => option.setName('role2').setDescription('Role kedua (opsional)').setRequired(false)),

    new SlashCommandBuilder()
        .setName('acc')
        .setDescription('Kirim hasil application accepted')
        .addUserOption(option => option.setName('applicant').setDescription('Pilih member yang diaplikasi').setRequired(true))
        .addStringOption(option => option.setName('status').setDescription('Status aplikasi (misal: accept)').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('Role yang diberikan').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('Catatan tambahan').setRequired(true))
].map(command => command.toJSON());

client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} sudah online!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Berhasil mendaftarkan semua slash commands!');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // 1. Logic /logs
    if (interaction.commandName === 'logs') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();

        const fullName = interaction.options.getString('fullname');
        const memberUser = interaction.options.getUser('member');
        const status = interaction.options.getString('status');
        const reason = interaction.options.getString('reason');
        const note = interaction.options.getString('note');
        const logsTo = interaction.options.getRole('logsto');

        const fixedImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg?ex=6ab4994d&is=6ab347cd&hm=fc73a31caaf12737c036ac2f9cb1587baa7ec17c386bcb98e1e165a496d5d0d1&';

        const embed = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('VEC LOGS')
            .setDescription('**LOGS VELOCITY ELITE CLUB**\n' +
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

        await interaction.channel.send({ embeds: [embed] });
    }

    // 2. Logic /roleadd
    if (interaction.commandName === 'roleadd') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();

        const targetUser = interaction.options.getUser('member');
        const role1 = interaction.options.getRole('role1');
        const role2 = interaction.options.getRole('role2');

        if (!interaction.guild) return;

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            if (role1) await member.roles.add(role1);
            if (role2) await member.roles.add(role2);

            let addedRolesText = role2 ? `${role1} & ${role2}` : `${role1}`;

            const embedRole = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setDescription(
                    `✨ **Role Diberikan**\n\n` +
                    `• **Server Role / Target:** ${addedRolesText}\n` +
                    `• **Berhasil Di Berikan Kepada:** ${targetUser}\n\n` +
                    `Diberikan oleh ${interaction.user}`
                )
                .setTimestamp();

            await interaction.channel.send({ embeds: [embedRole] });
        } catch (error) {
            console.error(error);
        }
    }

    // 3. Logic /roleremove
    if (interaction.commandName === 'roleremove') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();

        const targetUser = interaction.options.getUser('member');
        const role1 = interaction.options.getRole('role1');
        const role2 = interaction.options.getRole('role2');

        if (!interaction.guild) return;

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            if (role1) await member.roles.remove(role1);
            if (role2) await member.roles.remove(role2);

            let removedRolesText = role2 ? `${role1} & ${role2}` : `${role1}`;

            const embedRemove = new EmbedBuilder()
                .setColor('#e74c3c')
                .setDescription(
                    `🗑️ **Role Dicopot / Dihapus**\n\n` +
                    `• **Server Role / Target:** ${removedRolesText}\n` +
                    `• **Berhasil Dicopot Dari:** ${targetUser}\n\n` +
                    `Dicopot oleh ${interaction.user}`
                )
                .setTimestamp();

            await interaction.channel.send({ embeds: [embedRemove] });
        } catch (error) {
            console.error(error);
        }
    }

    // 4. Logic /acc
    if (interaction.commandName === 'acc') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();

        const applicant = interaction.options.getUser('applicant');
        const status = interaction.options.getString('status');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason');
        const note = interaction.options.getString('note');

        const fixedAccImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg?ex=6ab4994d&is=6ab347cd&hm=fc73a31caaf12737c036ac2f9cb1587baa7ec17c386bcb98e1e165a496d5d0d1&';

        const embedAcc = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('Velocity Elite Club\nApplication Result')
            .setDescription(
                `Dear, Mr/Mrs ${applicant}\n\n` +
                `*Application has been reviewed successfully.*\n\n` +
                `> • **Applicant:** ${applicant}\n` +
                `> • **Status:** ${status}\n` +
                `> • **Role:** ${role}\n` +
                `> • **Reason:** ${reason}\n` +
                `> • **Note:** ${note}\n\n` +
                `Regards : ${interaction.user}`
            )
            .setImage(fixedAccImageUrl)
            .setTimestamp();

        await interaction.channel.send({ embeds: [embedAcc] });
    }
});

// Text Commands (!setnick, !lock, dan !teks)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Command: !setnick
    if (message.content.startsWith('!setnick')) {
        if (!message.member.permissions.has('ManageNicknames')) return;

        const targetUser = message.mentions.users.first();
        const newNickname = message.content.replace('!setnick', '').replace(/<@!?\d+>/, '').trim();

        if (!targetUser || !newNickname) return;

        try {
            const member = await message.guild.members.fetch(targetUser.id);
            await member.setNickname(newNickname);

            const embedNick = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setDescription(
                    `✏️ **NICKNAME CHANGED**\n\n` +
                    `👤 **User:** ${targetUser}\n` +
                    `📝 **Nickname Baru:** ${newNickname}\n` +
                    `👮 **Moderator:** ${message.author}\n\n` +
                    `🖼️ Name Change Successful | ${new Date().toLocaleDateString()}`
                );

            await message.channel.send({ embeds: [embedNick] });
        } catch (error) {
            console.error(error);
        }
    }

    // Command: !lock atau !L
    if (message.content === '!lock' || message.content === '!L') {
        if (!message.member.permissions.has('ManageChannels')) return;

        try {
            if (message.channel.isThread()) {
                await message.channel.setLocked(true);
                await message.channel.setArchived(true);
            } else {
                await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
            }

            const embedLock = new EmbedBuilder()
                .setColor('#f39c12')
                .setDescription(
                    `🔒 **Thread Locked**\n\n` +
                    `💬 ${message.channel.name} telah dikunci.\n` +
                    `Dikunci oleh: ${message.author}\n\n` +
                    `${new Date().toLocaleString()}`
                );

            await message.channel.send({ embeds: [embedLock] });
        } catch (error) {
            console.error(error);
        }
    }

    // Command Baru: !teks (Bot mengirim pesan teks sesuai input admin dan menghapus pesan aslinya)
    if (message.content.startsWith('!teks')) {
        if (!message.member.permissions.has('Administrator') && !message.member.permissions.has('ManageMessages')) return;

        const textToSend = message.content.slice(5).trim();
        if (!textToSend) return;

        try {
            // Hapus pesan perintah !teks dari admin agar chat tetap bersih
            await message.delete();
            // Kirim teks murni melalui bot
            await message.channel.send(textToSend);
        } catch (error) {
            console.error(error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

