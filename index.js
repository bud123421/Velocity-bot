const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
        .addStringOption(option => option.setName('note').setDescription('Catatan tambahan').setRequired(true)),

    new SlashCommandBuilder()
        .setName('teks')
        .setDescription('Kirim pesan estetik berselang-seling foto & deskripsi')
        .addStringOption(option => option.setName('judul_utama').setDescription('Judul utama / teks pertama').setRequired(true))
        .addStringOption(option => option.setName('foto_1').setDescription('Link foto utama (wajib)').setRequired(true))
        .addStringOption(option => option.setName('deskripsi_1').setDescription('Deskripsi ke-1 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_2').setDescription('Link foto ke-2 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('deskripsi_2').setDescription('Deskripsi ke-2 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_3').setDescription('Link foto ke-3 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('deskripsi_3').setDescription('Deskripsi ke-3 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_4').setDescription('Link foto ke-4 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('deskripsi_4').setDescription('Deskripsi ke-4 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_5').setDescription('Link foto ke-5 (opsional)').setRequired(false)),

    new SlashCommandBuilder()
        .setName('vlist')
        .setDescription('Kirim panel List All Member VEC dengan tombol interaktif'),

    new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Menampilkan daftar perintah bot khusus staff')
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
    if (interaction.isButton()) {
        if (interaction.customId === 'update_vec_list') {
            await interaction.reply({ content: '🔁 Fitur update list via tombol sedang disiapkan!', ephemeral: true });
        }
        return;
    }

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

    // 5. Logic /teks
    if (interaction.commandName === 'teks') {
        if (!interaction.member.permissions.has('Administrator') && !interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        await interaction.deleteReply();

        const judulUtama = interaction.options.getString('judul_utama');
        const foto1 = interaction.options.getString('foto_1');
        const desk1 = interaction.options.getString('deskripsi_1');
        const foto2 = interaction.options.getString('foto_2');
        const desk2 = interaction.options.getString('deskripsi_2');
        const foto3 = interaction.options.getString('foto_3');
        const desk3 = interaction.options.getString('deskripsi_3');
        const foto4 = interaction.options.getString('foto_4');
        const desk4 = interaction.options.getString('deskripsi_4');
        const foto5 = interaction.options.getString('foto_5');

        const embedsList = [];

        const embed1 = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setDescription(`**${judulUtama}**`)
            .setImage(foto1);
        embedsList.push(embed1);

        const pairs = [
            { desk: desk1, foto: foto2 },
            { desk: desk2, foto: foto3 },
            { desk: desk3, foto: foto4 },
            { desk: desk4, foto: foto5 }
        ];

        for (const p of pairs) {
            if (p.desk || p.foto) {
                const extraEmbed = new EmbedBuilder().setColor('#1a1a1a');
                if (p.desk) extraEmbed.setDescription(p.desk);
                if (p.foto) extraEmbed.setImage(p.foto);
                embedsList.push(extraEmbed);
            }
        }

        await interaction.channel.send({ embeds: embedsList });
    }

    // 6. Logic /vlist
    if (interaction.commandName === 'vlist') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const currentDate = new Date().toLocaleDateString('id-ID');

        const listContent = 
            `__**LIST ALL MEMBER VEC**__\n\n` +
            `<@&1533476290424996082>\n- \n\n` +
            `<@&1533476290395504797>\n- \n\n` +
            `<@&1546864217074831430>\n- \n\n` +
            `<@&1533476290370207884>\n- \n\n` +
            `<@&1533476290395504799>\n- \n\n` +
            `<@&1533476290403762326>\n-  \n\n` +
            `__JOBS MEMBER VEC__\n\n` +
            `<@&1546529871641976942>\n- \n\n` +
            `Last Updated:\n*${currentDate}*`;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('update_vec_list')
                    .setLabel('Update List')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔁')
            );

        await interaction.channel.send({ content: listContent, components: [row] });
        await interaction.reply({ content: '✅ List Member VEC berhasil dikirim!', ephemeral: true });
    }

    // 7. Logic /cmd (Publik)
    if (interaction.commandName === 'cmd') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const embedList = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('📜 VEC BOT COMMAND LIST')
            .setDescription(
                `Berikut adalah daftar perintah bot yang tersedia untuk Staff/Admin:\n\n` +
                `**🔹 Slash Commands (/):**\n` +
                `• \`/logs\` - Mengirim log data member baru.\n` +
                `• \`/roleadd\` - Menambahkan 1 atau 2 role sekaligus ke member.\n` +
                `• \`/roleremove\` - Menghapus 1 atau 2 role sekaligus dari member.\n` +
                `• \`/acc\` - Mengirim hasil review application.\n` +
                `• \`/teks\` - Kirim pesan estetik multi-embed berselang-seling.\n` +
                `• \`/vlist\` - Kirim panel List Member VEC.\n` +
                `• \`/cmd\` - Menampilkan daftar perintah ini.\n\n` +
                `**🔹 Text Commands (!):**\n` +
                `• \`!setnick @User NamaBaru\` - Mengubah nickname member.\n` +
                `• \`!lock\` atau \`!L\` - Mengunci channel atau thread.\n` +
                `• \`!teks [Judul] | [Foto1] | [Deskripsi] | [Foto2]\` - Kirim via chat.\n` +
                `• \`!clear [jumlah]\` - Menghapus pesan chat secara massal.`
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embedList] });
    }
});

// Text Commands (!setnick, !lock, !teks, dan !clear)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

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

    // Command: !teks (Text Command dengan pemisah |)
    if (message.content.startsWith('!teks')) {
        if (!message.member.permissions.has('Administrator') && !message.member.permissions.has('ManageMessages')) return;

        const fullContent = message.content.slice(5).trim();
        const parts = fullContent.split('|').map(p => p.trim());
        
        const judulAtas = parts[0] || '';
        const fotoAtas = parts[1] || '';
        const deskripsiBawah = parts[2] || '';
        const fotoBawah = parts[3] || '';

        if (!judulAtas && !fotoAtas) return;

        try {
            await message.delete();

            const embedsList = [];

            if (judulAtas || fotoAtas) {
                const embedAtas = new EmbedBuilder().setColor('#1a1a1a');
                if (judulAtas) embedAtas.setDescription(judulAtas);
                if (fotoAtas) embedAtas.setImage(fotoAtas);
                embedsList.push(embedAtas);
            }

            if (deskripsiBawah || fotoBawah) {
                const embedBawah = new EmbedBuilder().setColor('#1a1a1a');
                if (deskripsiBawah) embedBawah.setDescription(deskripsiBawah);
                if (fotoBawah) embedBawah.setImage(fotoBawah);
                embedsList.push(embedBawah);
            }

            if (embedsList.length > 0) {
                await message.channel.send({ embeds: embedsList });
            }
        } catch (error) {
            console.error(error);
        }
    }

    if (message.content.startsWith('!clear')) {
        if (!message.member.permissions.has('ManageMessages')) return;

        const args = message.content.split(' ');
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply('❌ Masukkan jumlah angka 1 sampai 100! Contoh: `!clear 10`').then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 4000);
            });
        }

        try {
            await message.delete().catch(() => {});
            const deleted = await message.channel.bulkDelete(amount, true);
            
            const notify = await message.channel.send(`🧹 Berhasil menghapus **${deleted.size}** pesan.`);
            setTimeout(() => notify.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error(error);
            message.reply('❌ Gagal menghapus pesan (pesan yang lebih dari 14 hari tidak bisa dihapus massal).');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
