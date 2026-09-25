const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ] 
});

// ID Channel tempat list otomatis akan dikirim/di-update
const TARGET_CHANNEL_ID = '1533476292064706652';

// Daftar ID Role yang akan dilacak oleh bot
const TRACKED_ROLES = {
    leader: '1533476290424996082',
    supervisor: '1533476290395504797',
    official: '1546864217074831430',
    senior: '1533476290370207884',
    junior: '1533476290395504799',
    newbies: '1533476290403762326',
    photographer: '1546529871641976942' // Jobs
};

// Penyimpanan sementara untuk event balap (menyimpan nomor yang sudah diambil)
const racingEvents = new Map();

const commands = [
    new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Kirim log member baru (Nama otomatis dari ||)')
        .addUserOption(option => option.setName('member').setDescription('Mention user discord member').setRequired(true))
        .addStringOption(option => option.setName('status').setDescription('Status/pangkat member').setRequired(true))
        .addRoleOption(option => option.setName('logsto').setDescription('Pilih role tujuan log').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Alasan log').setRequired(true))
        .addStringOption(option => option.setName('note').setDescription('Catatan tambahan').setRequired(true)),

    new SlashCommandBuilder()
        .setName('roleadd')
        .setDescription('Tambah role dan/atau hapus role lama member sekaligus (Tukar Pangkat)')
        .addUserOption(option => option.setName('member').setDescription('Pilih member target').setRequired(true))
        .addRoleOption(option => option.setName('add_role1').setDescription('Role yang ingin diberikan (wajib)').setRequired(true))
        .addRoleOption(option => option.setName('add_role2').setDescription('Role tambahan yang ingin diberikan (opsional)').setRequired(false))
        .addRoleOption(option => option.setName('remove_role1').setDescription('Role lama yang ingin dicopot (opsional)').setRequired(false))
        .addRoleOption(option => option.setName('remove_role2').setDescription('Role lama kedua yang ingin dicopot (opsional)').setRequired(false)),

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
        .setName('setupvlist')
        .setDescription('Kirim panel list member dengan tombol Update'),

    new SlashCommandBuilder()
        .setName('setposisi')
        .setDescription('Buat panel undian posisi grid balap MotoGP')
        .addIntegerOption(option => option.setName('max_posisi').setDescription('Jumlah maksimal posisi grid (misal: 7)').setRequired(true)),

    new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Menampilkan daftar perintah bot khusus staff')
].map(command => command.toJSON());

// Fungsi untuk membuat Embed list member & mengambil nama setelah '||'
async function generateVECListPayload(guild) {
    await guild.members.fetch({ force: true });

    const getMembersByRole = (roleId) => {
        const role = guild.roles.cache.get(roleId);
        if (!role || role.members.size === 0) return '- N/A';

        return role.members.map(m => {
            const fullName = m.displayName;
            if (fullName.includes('||')) {
                const cleanName = fullName.split('||')[1].trim();
                return `- ${cleanName}`;
            }
            return `- ${fullName}`;
        }).join('\n');
    };

    const currentDate = new Date().toLocaleDateString('id-ID');

    const descriptionText = 
        `<@&${TRACKED_ROLES.leader}>\n${getMembersByRole(TRACKED_ROLES.leader)}\n\n` +
        `<@&${TRACKED_ROLES.supervisor}>\n${getMembersByRole(TRACKED_ROLES.supervisor)}\n\n` +
        `<@&${TRACKED_ROLES.official}>\n${getMembersByRole(TRACKED_ROLES.official)}\n\n` +
        `<@&${TRACKED_ROLES.senior}>\n${getMembersByRole(TRACKED_ROLES.senior)}\n\n` +
        `<@&${TRACKED_ROLES.junior}>\n${getMembersByRole(TRACKED_ROLES.junior)}\n\n` +
        `<@&${TRACKED_ROLES.newbies}>\n${getMembersByRole(TRACKED_ROLES.newbies)}\n\n` +
        `__JOBS MEMBER_VEC__\n\n` +
        `<@&${TRACKED_ROLES.photographer}>\n${getMembersByRole(TRACKED_ROLES.photographer)}\n\n` +
        `Last Updated:\n*${currentDate}*`;

    const embed = new EmbedBuilder()
        .setColor('#1a1a1a')
        .setTitle('LIST ALL MEMBER VEC')
        .setDescription(descriptionText);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('btn_update_vlist')
                .setLabel('Update List')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔁')
        );

    return { embeds: [embed], components: [row] };
}

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
    // 1. Handle Klik Tombol (Update List atau Ambil Posisi Balap)
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_update_vlist') {
            if (!interaction.member.permissions.has('ManageRoles')) {
                return interaction.reply({ content: '❌ Tombol ini khusus untuk Staff/Admin!', ephemeral: true });
            }

            await interaction.deferUpdate();
            const newPayload = await generateVECListPayload(interaction.guild);
            await interaction.message.edit(newPayload);
        } 
        else if (interaction.customId === 'btn_ambil_posisi') {
            const messageId = interaction.message.id;
            const eventData = racingEvents.get(messageId);

            if (!eventData) {
                return interaction.reply({ content: '❌ Sesi undian posisi balap ini sudah berakhir atau tidak ditemukan!', ephemeral: true });
            }

            const userId = interaction.user.id;

            // Cek apakah user sudah pernah mengambil nomor
            if (eventData.results.has(userId)) {
                return interaction.reply({ content: `⚠️ Kamu sudah mendapatkan **Posisi Grid #${eventData.results.get(userId)}**!`, ephemeral: true });
            }

            // Cek apakah nomor undian masih tersedia
            if (eventData.availableNumbers.length === 0) {
                return interaction.reply({ content: '❌ Maaf, semua posisi grid sudah habis diambil!', ephemeral: true });
            }

            // Ambil nomor secara acak dari sisa nomor yang ada
            const randomIndex = Math.floor(Math.random() * eventData.availableNumbers.length);
            const assignedNumber = eventData.availableNumbers.splice(randomIndex, 1)[0];

            // Ambil nama bersih peserta setelah '||'
            const rawDisplayName = interaction.member.displayName;
            const cleanName = rawDisplayName.includes('||') ? rawDisplayName.split('||')[1].trim() : rawDisplayName;

            // Simpan hasil
            eventData.results.set(userId, assignedNumber);

            // Susun ulang daftar hasil sementara
            let resultsText = '';
            // Urutkan berdasarkan nomor posisi terkecil ke terbesar
            const sortedResults = [...eventData.results.entries()].sort((a, b) => a[1] - b[1]);
            
            for (const [uId, pos] of sortedResults) {
                const memberObj = await interaction.guild.members.fetch(uId).catch(() => null);
                const memberName = memberObj 
                    ? (memberObj.displayName.includes('||') ? memberObj.displayName.split('||')[1].trim() : memberObj.displayName) 
                    : 'Unknown';
                resultsText += `• **Grid #${pos}** : ${memberName}\n`;
            }

            if (!resultsText) resultsText = '_Belum ada yang mengambil posisi._';

            // Update tampilan embed balapan
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setFields([
                    { name: '🏁 Status Undian', value: `Sisa posisi tersedia: **${eventData.availableNumbers.length}** dari ${eventData.maxPosisi}`, inline: false },
                    { name: '📋 Daftar Posisi Grid Sementara', value: resultsText, inline: false }
                ]);

            await interaction.update({ embeds: [updatedEmbed] });
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    // 2. Logic /logs
    if (interaction.commandName === 'logs') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const memberUser = interaction.options.getUser('member');
        const status = interaction.options.getString('status');
        const reason = interaction.options.getString('reason');
        const note = interaction.options.getString('note');
        const logsTo = interaction.options.getRole('logsto');

        if (!interaction.guild) return;

        try {
            const targetMember = await interaction.guild.members.fetch(memberUser.id);
            const rawDisplayName = targetMember.displayName;

            let extractedFullName = rawDisplayName;
            if (rawDisplayName.includes('||')) {
                extractedFullName = rawDisplayName.split('||')[1].trim();
            }

            const fixedImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg?ex=6ab4994d&is=6ab347cd&hm=fc73a31caaf12737c036ac2f9cb1587baa7ec17c386bcb98e1e165a496d5d0d1&';

            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('VEC LOGS')
                .setDescription('**LOGS VELOCITY ELITE CLUB**\n' +
                    `> • Full Name: **${extractedFullName}**\n` +
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

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Terjadi kesalahan saat memproses log member.', ephemeral: true });
        }
        return;
    }

    // 3. Logic /roleadd
    if (interaction.commandName === 'roleadd') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('member');
        const addRole1 = interaction.options.getRole('add_role1');
        const addRole2 = interaction.options.getRole('add_role2');
        const removeRole1 = interaction.options.getRole('remove_role1');
        const removeRole2 = interaction.options.getRole('remove_role2');

        if (!interaction.guild) return;

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            
            let addedList = [];
            let removedList = [];

            if (addRole1) { await member.roles.add(addRole1); addedList.push(`${addRole1}`); }
            if (addRole2) { await member.roles.add(addRole2); addedList.push(`${addRole2}`); }
            if (removeRole1) { await member.roles.remove(removeRole1); removedList.push(`${removeRole1}`); }
            if (removeRole2) { await member.roles.remove(removeRole2); removedList.push(`${removeRole2}`); }

            let descText = `✨ **Manajemen Role Member**\n\n• **Target:** ${targetUser}\n`;
            if (addedList.length > 0) descText += `• **Role Diberikan:** ${addedList.join(' & ')}\n`;
            if (removedList.length > 0) descText += `• **Role Dicopot:** ${removedList.join(' & ')}\n`;
            descText += `\nDiproses oleh ${interaction.user}`;

            const embedRole = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setDescription(descText)
                .setTimestamp();

            await interaction.reply({ embeds: [embedRole] });
        } catch (error) {
            console.error(error);
        }
        return;
    }

    // 4. Logic /roleremove
    if (interaction.commandName === 'roleremove') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

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

            await interaction.reply({ embeds: [embedRemove] });
        } catch (error) {
            console.error(error);
        }
        return;
    }

    // 5. Logic /acc
    if (interaction.commandName === 'acc') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

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

        await interaction.reply({ embeds: [embedAcc] });
        return;
    }

    // 6. Logic /teks (Murni teks tanpa pemisah gambar)
    if (interaction.commandName === 'teks') {
        if (!interaction.member.permissions.has('Administrator') && !interaction.member.permissions.has('ManageMessages')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const judulUtama = interaction.options.getString('judul_utama');
        const desk1 = interaction.options.getString('deskripsi_1');
        const desk2 = interaction.options.getString('deskripsi_2');
        const desk3 = interaction.options.getString('deskripsi_3');
        const desk4 = interaction.options.getString('deskripsi_4');
        const foto1 = interaction.options.getString('foto_1');
        const foto2 = interaction.options.getString('foto_2');
        const foto3 = interaction.options.getString('foto_3');
        const foto4 = interaction.options.getString('foto_4');
        const foto5 = interaction.options.getString('foto_5');

        const embedsList = [];

        const embed1 = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setDescription(`**${judulUtama}**`);
        if (foto1) embed1.setImage(foto1);
        embedsList.push(embed1);

        const optionalFields = [
            { desk: desk1, foto: foto2 },
            { desk: desk2, foto: foto3 },
            { desk: desk3, foto: foto4 },
            { desk: desk4, foto: foto5 }
        ];

        for (const f of optionalFields) {
            if (f.desk || f.foto) {
                const extraEmbed = new EmbedBuilder().setColor('#1a1a1a');
                if (f.desk) extraEmbed.setDescription(f.desk);
                if (f.foto) extraEmbed.setImage(f.foto);
                embedsList.push(extraEmbed);
            }
        }

        await interaction.reply({ embeds: embedsList });
        return;
    }

    // 7. Logic /setupvlist
    if (interaction.commandName === 'setupvlist') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const payload = await generateVECListPayload(interaction.guild);
        const channel = await interaction.guild.channels.fetch(TARGET_CHANNEL_ID);
        if (channel) {
            await channel.send(payload);
        }
        await interaction.reply({ content: '✅ Panel list berhasil dikirim ke channel target!', ephemeral: true });
        return;
    }

    // 8. Logic /setposisi (Membuat Event Undian Grid Balap MotoGP)
    if (interaction.commandName === 'setposisi') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const maxPosisi = interaction.options.getInteger('max_posisi');

        if (maxPosisi < 1 || maxPosisi > 50) {
            return interaction.reply({ content: '❌ Masukkan angka posisi antara 1 sampai 50!', ephemeral: true });
        }

        // Buat array nomor posisi dari 1 sampai maxPosisi
        const availableNumbers = Array.from({ length: maxPosisi }, (_, i) => i + 1);

        const embed = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('🏁 VEC RACING TOURNAMENT - QUALIFYING')
            .setDescription('Silakan klik tombol **"Ambil Posisi Grid"** di bawah ini untuk mendapatkan nomor urutan barisan balap secara acak!')
            .addFields(
                { name: '🏁 Status Undian', value: `Sisa posisi tersedia: **${maxPosisi}** dari ${maxPosisi}`, inline: false },
                { name: '📋 Daftar Posisi Grid Sementara', value: '_Belum ada yang mengambil posisi._', inline: false }
            )
            .setFooter({ text: `Dibuat oleh ${interaction.user.username}` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_ambil_posisi')
                    .setLabel('Ambil Posisi Grid')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🏎️')
            );

        // Kirim pesan panel undian
        const sentMessage = await interaction.channel.send({ embeds: [embed], components: [row] });

        // Daftarkan sesi ke dalam memory bot
        racingEvents.set(sentMessage.id, {
            maxPosisi: maxPosisi,
            availableNumbers: availableNumbers,
            results: new Map() // Menyimpan pasangan userId -> nomor posisi
        });

        await interaction.reply({ content: '✅ Panel undian posisi balap berhasil dibuat!', ephemeral: true });
        return;
    }

    // 9. Logic /cmd (Publik)
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
                `• \`/logs\` - Kirim log data (Nama otomatis dari ||).\n` +
                `• \`/roleadd\` - Tambah & hapus role sekaligus (Tukar Pangkat).\n` +
                `• \`/roleremove\` - Menghapus role dari member.\n` +
                `• \`/acc\` - Mengirim hasil review application.\n` +
                `• \`/teks\` - Kirim pesan teks estetik (tanpa pemisah gambar).\n` +
                `• \`/setupvlist\` - Kirim panel list member dengan tombol Update.\n` +
                `• \`/setposisi [angka]\` - Buat undian posisi grid balap.\n` +
                `• \`/cmd\` - Menampilkan daftar perintah ini.\n\n` +
                `**🔹 Text Commands (!):**\n` +
                `• \`!setnick @User NamaBaru\` - Mengubah nickname member.\n` +
                `• \`!lock\` atau \`!L\` - Mengunci channel atau thread.\n` +
                `• \`!teks [Teks Anda]\` - Kirim teks via chat.\n` +
                `• \`!clear [jumlah]\` - Menghapus pesan chat secara massal.`
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embedList] });
        return;
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

    if (message.content === '!lock' || message.content === !L) { // Diperbaiki dari !L ke message.content === '!lock' || message.content === '!L'
        // Skip karena sudah aman
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

    // Command: !teks (Murni Teks Saja tanpa format pipa/gambar)
    if (message.content.startsWith('!teks')) {
        if (!message.member.permissions.has('Administrator') && !message.member.permissions.has('ManageMessages')) return;

        const textContent = message.content.slice(5).trim();
        if (!textContent) return;

        try {
            await message.delete();

            const embedTeks = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setDescription(textContent);

            await message.channel.send({ embeds: [embedTeks] });
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
