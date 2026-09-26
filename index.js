const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ] 
});

const TARGET_CHANNEL_ID = '1533476292064706652';
const LOGS_CHANNEL_ID = '1533476291230171192';

const CIVILIAN_ROLE_ID = '1533476290445709493';
const NEWBIES_ROLE_ID = '1533476290403762326';
const MEMBER_ROLE_ID = '1533476290403762323';

const TRACKED_ROLES = {
    leader: '1533476290424996082',
    supervisor: '1533476290395504797',
    official: '1546864217074831430',
    senior: '1533476290370207884',
    junior: '1533476290395504799',
    newbies: '1533476290403762326',
    photographer: '1546529871641976942'
};

const racingEvents = new Map();
const activeGiveaways = new Map();
const activeAbsensi = new Map();

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
        .setName('unrole')
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
        .addStringOption(option => option.setName('deskripsi_1').setDescription('Deskripsi ke-1 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('deskripsi_2').setDescription('Deskripsi ke-2 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('deskripsi_3').setDescription('Deskripsi ke-3 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('deskripsi_4').setDescription('Deskripsi ke-4 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_1').setDescription('Link foto utama (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_2').setDescription('Link foto ke-2 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_3').setDescription('Link foto ke-3 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_4').setDescription('Link foto ke-4 (opsional)').setRequired(false))
        .addStringOption(option => option.setName('foto_5').setDescription('Link foto ke-5 (opsional)').setRequired(false)),

    new SlashCommandBuilder()
        .setName('setupvlist')
        .setDescription('Kirim panel list member dengan tombol Update'),

    new SlashCommandBuilder()
        .setName('setposisi')
        .setDescription('Buat panel undian posisi grid balap MotoGP')
        .addIntegerOption(option => option.setName('max_posisi').setDescription('Jumlah maksimal posisi grid (misal: 7)').setRequired(true)),

    new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Mulai sesi giveaway baru')
        .addStringOption(option => option.setName('hadiah').setDescription('Nama hadiah yang dibagikan').setRequired(true))
        .addIntegerOption(option => option.setName('pemenang').setDescription('Jumlah pemenang').setRequired(true))
        .addIntegerOption(option => option.setName('durasi').setDescription('Durasi waktu dalam menit').setRequired(true)),

    new SlashCommandBuilder()
        .setName('memberlist')
        .setDescription('Menampilkan daftar nama dan total member VEC'),

    new SlashCommandBuilder()
        .setName('absensi')
        .setDescription('Buat panel absensi member interaktif'),

    new SlashCommandBuilder()
        .setName('updatebot')
        .setDescription('Kirim informasi pembaruan sistem V-Bot terbaru'),

    new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('Menampilkan daftar perintah bot khusus staff')
].map(command => command.toJSON());

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
        `__JOBS MEMBER VEC__\n\n` +
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

async function generateAbsensiText(guild, absenPointsMap) {
    await guild.members.fetch({ force: true });
    const role = guild.roles.cache.get(MEMBER_ROLE_ID);

    if (!role || role.members.size === 0) {
        return { text: '__**LIST ABSENSI VELOCITY ELITE CLUB**__\n\n_Tidak ada member._\n\n__**ALL MEMBER LIST : 0**__\n*Last Update ' + new Date().toLocaleDateString('id-ID') + '*', total: 0 };
    }

    const membersArray = [...role.members.values()];
    
    let listLines = '';

    for (const m of membersArray) {
        const fullName = m.displayName;
        const cleanName = fullName.includes('||') ? fullName.split('||')[1].trim() : fullName;
        
        const points = absenPointsMap.get(m.id) || 0;

        listLines += `> - ${cleanName} [${points}]\n`;
    }

    const totalCount = membersArray.length;
    const currentDate = new Date().toLocaleDateString('id-ID');

    const fullText = 
        `__**LIST ABSENSI VELOCITY ELITE CLUB**__\n` +
        `${listLines}\n` +
        `__**ALL MEMBER LIST : ${totalCount}**__\n` +
        `*Last Update ${currentDate}*`;

    return { text: fullText, total: totalCount };
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
            let eventData = racingEvents.get(messageId);

            if (!eventData) {
                return interaction.reply({ content: '❌ Sesi undian posisi balap ini sudah berakhir atau bot sempat restart!', ephemeral: true });
            }

            const userId = interaction.user.id;

            if (eventData.results.has(userId)) {
                return interaction.reply({ content: `⚠️ Kamu sudah mendapatkan **Posisi Grid #${eventData.results.get(userId)}**!`, ephemeral: true });
            }

            if (eventData.availableNumbers.length === 0) {
                return interaction.reply({ content: '❌ Maaf, semua posisi grid sudah habis diambil!', ephemeral: true });
            }

            const randomIndex = Math.floor(Math.random() * eventData.availableNumbers.length);
            const assignedNumber = eventData.availableNumbers.splice(randomIndex, 1)[0];

            eventData.results.set(userId, assignedNumber);

            let resultsText = '';
            const sortedResults = [...eventData.results.entries()].sort((a, b) => a[1] - b[1]);
            
            for (const [uId, pos] of sortedResults) {
                const memberObj = await interaction.guild.members.fetch(uId).catch(() => null);
                const memberName = memberObj 
                    ? (memberObj.displayName.includes('||') ? memberObj.displayName.split('||')[1].trim() : memberObj.displayName) 
                    : 'Unknown';
                resultsText += `• **Grid #${pos}** :${memberName}\n`;
            }

            if (!resultsText) resultsText = '_Belum ada yang mengambil posisi._';

            const isFull = eventData.availableNumbers.length === 0;

            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setFields([
                    { name: '🏁 Status Undian', value: isFull ? '✅ **Semua posisi grid sudah terisi!**' : `Sisa posisi tersedia: **${eventData.availableNumbers.length}** dari ${eventData.maxPosisi}`, inline: false },
                    { name: '📋 Daftar Posisi Grid Sementara', value: resultsText, inline: false }
                ]);

            if (isFull) {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btn_grid_full')
                            .setLabel('Grid Full')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                            .setEmoji('🔒')
                    );
                await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });

                let finalListText = `🏁 **FINAL GRID STARTING LINE - VEC RACING TOURNAMENT** 🏁\n\n`;
                for (const [uId, pos] of sortedResults) {
                    const memberObj = await interaction.guild.members.fetch(uId).catch(() => null);
                    const memberName = memberObj 
                        ? (memberObj.displayName.includes('||') ? memberObj.displayName.split('||')[1].trim() : memberObj.displayName) 
                        : 'Unknown';
                    finalListText += `• **Grid #${pos}** :${memberName}\n`;
                }
                await interaction.channel.send(finalListText);
            } else {
                await interaction.update({ embeds: [updatedEmbed] });
            }
        }
        else if (interaction.customId === 'btn_join_giveaway') {
            const messageId = interaction.message.id;
            const gwData = activeGiveaways.get(messageId);

            if (!gwData || !gwData.active) {
                return interaction.reply({ content: '❌ Sesi giveaway ini sudah berakhir atau sudah ditutup!', ephemeral: true });
            }

            const userId = interaction.user.id;

            if (gwData.participants.has(userId)) {
                gwData.participants.delete(userId);
                return interaction.reply({ content: '⚠️ Kamu batal mengikuti giveaway ini.', ephemeral: true });
            } else {
                gwData.participants.add(userId);
                return interaction.reply({ content: '🎉 Berhasil! Kamu telah terdaftar dalam giveaway ini.', ephemeral: true });
            }
        }
        else if (interaction.customId === 'btn_set_absen') {
            if (!interaction.member.permissions.has('ManageRoles')) {
                return interaction.reply({ content: '❌ Tombol ini khusus untuk Admin/Staff!', ephemeral: true });
            }

            return interaction.reply({ content: '💡 Silakan gunakan perintah chat **`!p @User [jumlah_poin]`** untuk menambah atau mengurangi poin absen secara instan!', ephemeral: true });
        }
        else if (interaction.customId === 'btn_update_absen') {
            if (!activeAbsensi.has(interaction.message.id)) {
                activeAbsensi.set(interaction.message.id, { pointsMap: new Map() });
            }
            const absenData = activeAbsensi.get(interaction.message.id);

            await interaction.deferUpdate();
            const { text } = await generateAbsensiText(interaction.guild, absenData.pointsMap);

            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setDescription(text);

            await interaction.message.edit({ embeds: [updatedEmbed] });
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

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

    if (interaction.commandName === 'unrole') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        await interaction.deferReply();

        const targetUser = interaction.options.getUser('member');
        const role1 = interaction.options.getRole('role1');
        const role2 = interaction.options.getRole('role2');

        if (!interaction.guild) return;

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            if (role1) await member.roles.remove(role1);
            if (role2) await member.roles.remove(role2);

            let removedRolesText = role2 ? `${role1} &${role2}` : `${role1}`;

            const embedRemove = new EmbedBuilder()
                .setColor('#e74c3c')
                .setDescription(
                    `🗑️ **Role Dicopot / Dihapus**\n\n` +
                    `• **Server Role / Target:** ${removedRolesText}\n` +
                    `• **Berhasil Dicopot Dari:** ${targetUser}\n\n` +
                    `Dicopot oleh ${interaction.user}`
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embedRemove] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Gagal mencopot role. Pastikan bot memiliki hierarki role di atas member tersebut.' });
        }
        return;
    }

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

    if (interaction.commandName === 'setupvlist') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Tombol ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const payload = await generateVECListPayload(interaction.guild);
        const channel = await interaction.guild.channels.fetch(TARGET_CHANNEL_ID);
        if (channel) {
            await channel.send(payload);
        }
        await interaction.reply({ content: '✅ Panel list berhasil dikirim ke channel target!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'setposisi') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Tombol ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const maxPosisi = interaction.options.getInteger('max_posisi');

        if (maxPosisi < 1 || maxPosisi > 50) {
            return interaction.reply({ content: '❌ Masukkan angka posisi antara 1 sampai 50!', ephemeral: true });
        }

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

        const sentMessage = await interaction.channel.send({ embeds: [embed], components: [row] });

        racingEvents.set(sentMessage.id, {
            maxPosisi: maxPosisi,
            availableNumbers: availableNumbers,
            results: new Map()
        });

        await interaction.reply({ content: '✅ Panel undian posisi balap berhasil dibuat!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'giveaway') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Tombol ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const hadiah = interaction.options.getString('hadiah');
        const jumlahPemenang = interaction.options.getInteger('pemenang');
        const durasiMenit = interaction.options.getInteger('durasi');

        const endTime = Date.now() + durasiMenit * 60 * 1000;
        const endTimeSeconds = Math.floor(endTime / 1000);

        const embedGw = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('🎉 VEC GIVEAWAY 🎉')
            .setDescription(
                `🎁 **Hadiah:** ${hadiah}\n` +
                `👑 **Jumlah Pemenang:** ${jumlahPemenang} Orang\n` +
                `⏳ **Berakhir:** <t:${endTimeSeconds}:R> (<t:${endTimeSeconds}:f>)\n\n` +
                `Klik tombol **"Ikut Giveaway"** di bawah untuk berpartisipasi!`
            )
            .setFooter({ text: `Diadakan oleh ${interaction.user.username}` })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_join_giveaway')
                    .setLabel('Ikut Giveaway')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎉')
            );

        const sentMessage = await interaction.channel.send({ embeds: [embedGw], components: [row] });

        const gwObj = {
            hadiah: hadiah,
            winnersCount: jumlahPemenang,
            participants: new Set(),
            active: true,
            endTime: endTime
        };

        activeGiveaways.set(sentMessage.id, gwObj);

        await interaction.reply({ content: '✅ Giveaway berhasil dimulai!', ephemeral: true });

        // Fungsi Timer giveaway dengan pengaman waktu aktual (mengatasi kendala restart Railway)
        const checkGiveawayInterval = setInterval(async () => {
            if (Date.now() >= endTime) {
                clearInterval(checkGiveawayInterval);
                const gwData = activeGiveaways.get(sentMessage.id);
                if (!gwData || !gwData.active) return;

                gwData.active = false;
                const participantsArray = [...gwData.participants];

                let winnerMentions = '';
                if (participantsArray.length === 0) {
                    winnerMentions = '_Tidak ada peserta yang mengikuti giveaway._';
                } else {
                    const shuffled = participantsArray.sort(() => 0.5 - Math.random());
                    const winners = shuffled.slice(0, gwData.winnersCount);

                    for (const wId of winners) {
                        winnerMentions += `<@${wId}> `;
                    }
                }

                const endedEmbed = new EmbedBuilder()
                    .setColor('#1a1a1a')
                    .setTitle('🎉 VEC GIVEAWAY - BERAKHIR 🎉')
                    .setDescription(
                        `🎁 **Hadiah:** ${hadiah}\n\n` +
                        `👑 **Pemenang Terpilih:**\n${winnerMentions}`
                    )
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('btn_join_giveaway_ended')
                            .setLabel('Giveaway Selesai')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );

                await sentMessage.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => {});
                await interaction.channel.send(`🎊 Selamat kepada ${winnerMentions} telah memenangkan **${hadiah}**!`).catch(() => {});
            }
        }, 5000);

        return;
    }

    if (interaction.commandName === 'memberlist') {
        await interaction.guild.members.fetch({ force: true });
        const role = interaction.guild.roles.cache.get(MEMBER_ROLE_ID);

        if (!role || role.members.size === 0) {
            return interaction.reply({ content: '❌ Tidak ada member yang ditemukan dengan role tersebut.', ephemeral: true });
        }

        const memberLines = role.members.map(m => {
            const fullName = m.displayName;
            if (fullName.includes('||')) {
                return `> - ${fullName.split('||')[1].trim()}`;
            }
            return `> - ${fullName}`;
        }).join('\n');

        const totalCount = role.members.size;
        const currentDate = new Date().toLocaleDateString('id-ID');

        const resultText = 
            `__**LIST MEMBER VELOCITY ELITE CLUB**__\n` +
            `${memberLines}\n\n` +
            `__**ALL MEMBER LIST : ${totalCount}**__\n` +
            `*Last Update ${currentDate}*`;

        await interaction.reply({ content: resultText });
        return;
    }

    if (interaction.commandName === 'absensi') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const pointsMap = new Map();
        const { text } = await generateAbsensiText(interaction.guild, pointsMap);

        const embedAbsen = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('📋 VEC ABSENSI MEMBER')
            .setDescription(text)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_set_absen')
                    .setLabel('Set Absen')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('✏️'),
                new ButtonBuilder()
                    .setCustomId('btn_update_absen')
                    .setLabel('Update')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔁')
            );

        const sentMessage = await interaction.channel.send({ embeds: [embedAbsen], components: [row] });

        activeAbsensi.set(sentMessage.id, {
            pointsMap: pointsMap
        });

        await interaction.reply({ content: '✅ Panel absensi berhasil dibuat!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'updatebot') {
        if (!interaction.member.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Staff/Admin!', ephemeral: true });
        }

        const embedUpdate = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('🚀 V-BOT UPDATE LOGS - [v2.5]')
            .setDescription(
                `Pemberitahuan pembaruan sistem dan peningkatan fitur bot terbaru untuk Velocity Elite Club.\n\n` +
                `> • **Versi:** v2.5 Stabil\n` +
                `> • **Kategori:** Fitur Baru & Perbaikan Bug\n` +
                `> • **Diperbarui Oleh:** ${interaction.user}\n\n` +
                `📋 **Detail Pembaruan:**\n` +
                `\`\`\`text\n` +
                `1. Perbaikan bug command /unrole agar berjalan lancar.\n` +
                `2. Perbaikan sistem timer Giveaway otomatis anti-macet.\n` +
                `3. Penambahan command /updatebot untuk info log pembaruan.\n` +
                `4. Optimalisasi akumulasi poin absen dengan !p @user [poin/-poin].\n` +
                `\`\`\``
            )
            .setFooter({ text: `V-BOT System Update | ${new Date().toLocaleDateString('id-ID')}` })
            .setTimestamp();

        await interaction.channel.send({ content: '📢 **@everyone** Update Bot Terbaru Telah Dirilis!', embeds: [embedUpdate] });
        await interaction.reply({ content: '✅ Log pembaruan bot berhasil dikirim!', ephemeral: true });
        return;
    }

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
                `• \`/unrole\` - Menghapus role dari member.\n` +
                `• \`/acc\` - Mengirim hasil review application.\n` +
                `• \`/teks\` - Kirim pesan teks estetik.\n` +
                `• \`/setupvlist\` - Kirim panel list member dengan tombol Update.\n` +
                `• \`/setposisi [angka]\` - Buat undian posisi grid balap.\n` +
                `• \`/giveaway [hadiah] [pemenang] [menit]\` - Mulai giveaway.\n` +
                `• \`/memberlist\` - Menampilkan daftar nama & total member.\n` +
                `• \`/absensi\` - Buat panel absensi member otomatis.\n` +
                `• \`/updatebot\` - Kirim log informasi pembaruan bot.\n` +
                `• \`/cmd\` - Menampilkan daftar perintah ini.\n\n` +
                `**🔹 Text Commands (!):**\n` +
                `• \`!logs @User\` - Kirim log member baru otomatis ke channel logs.\n` +
                `• \`!setnick @User NamaBaru\` - Mengubah nickname member.\n` +
                `• \`!lock\` atau \`!L\` - Mengunci channel atau thread.\n` +
                `• \`!teks [Teks Anda]\` - Kirim teks murni via chat.\n` +
                `• \`!p @User [poin]\` - Tambah/kurang poin absen (contoh: \`!p @User 3\` atau \`!p @User -3\`).\n` +
                `• \`!c [jumlah]\` - Menghapus pesan chat secara massal.`
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embedList] });
        return;
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!p')) {
        if (!message.member.permissions.has('ManageRoles')) return;

        const args = message.content.split(' ');
        const targetUser = message.mentions.users.first();
        const changePoints = parseInt(args[2]);

        if (!targetUser || isNaN(changePoints)) {
            return message.reply('❌ Format salah! Contoh: `!p @Boris 1` (tambah) atau `!p @Boris -3` (kurang)').then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 4000);
            });
        }

        const channelAbsensi = activeAbsensi.size > 0 ? [...activeAbsensi.entries()][activeAbsensi.size - 1] : null;

        if (!channelAbsensi) {
            return message.reply('❌ Belum ada panel absensi aktif di channel ini! Ketik `/absensi` terlebih dahulu.');
        }

        const [msgId, absenData] = channelAbsensi;

        const currentPoints = absenData.pointsMap.get(targetUser.id) || 0;
        let totalNewPoints = currentPoints + changePoints;
        
        if (totalNewPoints < 0) totalNewPoints = 0;

        absenData.pointsMap.set(targetUser.id, totalNewPoints);

        try {
            const messageObj = await message.channel.messages.fetch(msgId);
            if (messageObj) {
                const { text } = await generateAbsensiText(message.guild, absenData.pointsMap);
                const updatedEmbed = EmbedBuilder.from(messageObj.embeds[0]).setDescription(text);
                await messageObj.edit({ embeds: [updatedEmbed] });
            }
        } catch (e) {
            console.log('Panel pesan tidak ditemukan, poin tetap diperbarui.');
        }

        const targetMember = await message.guild.members.fetch(targetUser.id);
        const cleanName = targetMember.displayName.includes('||') ? targetMember.displayName.split('||')[1].trim() : targetMember.displayName;

        const actionText = changePoints < 0 ? `mengurangi ${Math.abs(changePoints)} poin` : `menambahkan ${changePoints} poin`;

        await message.reply(`✅ Berhasil ${actionText} untuk **${cleanName}**. Total poin sekarang: **[${totalNewPoints}]**`).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        });

        await message.delete().catch(() => {});
        return;
    }

    if (message.content.startsWith('!logs')) {
        if (!message.member.permissions.has('ManageRoles')) return;

        const targetUser = message.mentions.users.first();
        if (!targetUser) {
            return message.reply('❌ Format salah! Contoh: `!logs @User`').then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 4000);
            });
        }

        try {
            await message.delete().catch(() => {});

            const targetMember = await message.guild.members.fetch(targetUser.id);
            const rawDisplayName = targetMember.displayName;

            let extractedFullName = rawDisplayName;
            if (rawDisplayName.includes('||')) {
                extractedFullName = rawDisplayName.split('||')[1].trim();
            }

            const fixedImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg?ex=6ab4994d&is=6ab347cd&hm=fc73a31caaf12737c036ac2f9cb1587baa7ec17c386bcb98e1e165a496d5d0d1&';

            const embedLogs = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('VEC LOGS')
                .setDescription('**LOGS VELOCITY ELITE CLUB**\n' +
                    `> • Full Name: **${extractedFullName}**\n` +
                    `> • Discord: **${targetUser}**\n` +
                    `> • Status: **<@&${CIVILIAN_ROLE_ID}>**\n` +
                    `> • Logs To: **<@&${NEWBIES_ROLE_ID}>**\n` +
                    `> • Reason: **joined community**\n` +
                    `> • Note: **sering" act ssrp**\n\n` +
                    `> • Logs By: **${message.author}**`
                )
                .setImage(fixedImageUrl)
                .setFooter({ text: `Signed By ${message.author.username}` })
                .setTimestamp();

            const logsChannel = await message.guild.channels.fetch(LOGS_CHANNEL_ID);
            if (logsChannel) {
                await logsChannel.send({ embeds: [embedLogs] });
                await message.channel.send(`✅ Berhasil terkirim ke <#${LOGS_CHANNEL_ID}> by ${message.author}!`);
            }
        } catch (error) {
            console.error(error);
        }
        return;
    }

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

    if (message.content.startsWith('!c')) {
        if (!message.member.permissions.has('ManageMessages')) return;

        const args = message.content.split(' ');
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply('❌ Masukkan jumlah angka 1 sampai 100! Contoh: `!c 10`').then(msg => {
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
