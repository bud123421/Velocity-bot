const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ] 
});

// --- KONFIGURASI CHANNEL ---
const TARGET_CHANNEL_ID = '1533476292064706652';
const LOGS_CHANNEL_ID = '1533476291230171192';
const CLAIM_CHANNEL_ID = '1553405229586710538';

// --- KONFIGURASI ROLE ---
const GIVEAWAY_ROLE_ID = '1553408506026266786';
const GIVEAWAY_ADMIN_ROLE_ID = '1546871204944810014'; 
const CIVILIAN_ROLE_ID = '1533476290445709493';
const NEWBIES_ROLE_ID = '1533476290403762326';
const MEMBER_ROLE_ID = '1533476290403762323';

const HANDLE_RECRUITMENT_ROLE_ID = '1533476290386989069';
const EVENT_ADMIN_ROLE_ID = '1546871204944810014';
const EVENT_ACCEPTED_ROLE_ID = '1533476290424996085';

const TRACKED_ROLES = {
    leader: '1533476290424996082',
    supervisor: '1533476290395504797',
    official: '1546864217074831430',
    senior: '1533476290370207884',
    junior: '1533476290395504799',
    newbies: '1533476290403762326',
    photographer: '1546529871641976942'
};

// --- MEMORI SEMENTARA (MAPS) ---
const racingEvents = new Map();
const activeGiveaways = new Map();
const activeAbsensi = new Map();
const activeRoleLimits = new Map(); // Memori untuk sistem Auto-Lock & Tracker

// --- DAFTAR SLASH COMMANDS ---
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
        .setName('listrole')
        .setDescription('Menampilkan daftar member beserta mention tag dari role tertentu')
        .addRoleOption(option => option.setName('role').setDescription('Pilih role target').setRequired(true)),

    new SlashCommandBuilder()
        .setName('maxrole')
        .setDescription('Set kuota batas maksimal role dan otomatis lock channel jika penuh')
        .addRoleOption(option => option.setName('role').setDescription('Pilih role target').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('Pilih channel yang akan di-lock').setRequired(true))
        .addIntegerOption(option => option.setName('limit').setDescription('Batas kuota member').setRequired(true)),

    new SlashCommandBuilder()
        .setName('resetmaxrole')
        .setDescription('Membatalkan/menghapus sistem auto-lock pada role tertentu')
        .addRoleOption(option => option.setName('role').setDescription('Pilih role yang mau di-reset').setRequired(true)),

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

// --- HELPER FUNCTIONS ---
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

// FUNGSI UTAMA: Mengurus Target Kuota, Bumping Pesan Sisa, dan Auto-Lock
async function handleRoleUpdate(guild, roleId) {
    if (!activeRoleLimits.has(roleId)) return;
    const config = activeRoleLimits.get(roleId);
    
    await guild.members.fetch({ force: true });
    const role = guild.roles.cache.get(roleId);
    if (!role) return;

    const remaining = config.limit - role.members.size;

    // Jika Kuota Penuh (Sisa 0 atau Minus)
    if (remaining <= 0) {
        try {
            const channel = await guild.channels.fetch(config.channelId);
            
            // Hapus pesan tracker sisa kuota (jika ada) karena sudah penuh
            if (config.trackerMsgId) {
                try {
                    const oldTracker = await channel.messages.fetch(config.trackerMsgId);
                    if (oldTracker) await oldTracker.delete();
                } catch (e) {}
            }
            
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
            
            const memberLines = role.members.map(m => `> • ${m.user.toString()}`).join('\n');
            const currentDate = new Date().toLocaleDateString('id-ID');
            const listText = 
                `__**LIST MEMBER ROLE ${role.name.toUpperCase()}**__\n` +
                `${memberLines}\n\n` +
                `__**ALL MEMBER LIST : ${role.members.size} /${config.limit}**__\n` +
                `*Last Update ${currentDate}*`;

            const embed = new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('🔒 QUOTA FULL - CHANNEL LOCKED')
                .setDescription(`⚠️ Kuota untuk ${role} telah mencapai target maksimal (**${config.limit} member**).\n\nChannel ini telah dikunci otomatis oleh sistem agar tidak ada request masuk lagi.\n\n${listText}`)
                .setFooter({ text: 'VEC Event System' })
                .setTimestamp();
            
            await channel.send({ embeds: [embed] });

            // Hapus Config Database dari channel staff
            if (config.configMsgId && config.configChannelId) {
                try {
                    const cfgChannel = await guild.channels.fetch(config.configChannelId);
                    const configMsg = await cfgChannel.messages.fetch(config.configMsgId);
                    if (configMsg) await configMsg.delete();
                } catch (e) {}
            }
            
            activeRoleLimits.delete(roleId);
        } catch (e) {
            console.error("Gagal auto-lock channel:", e);
        }
    } 
    // Jika Kuota Belum Penuh -> Update Pesan Tracker (Bump ke bawah)
    else {
        try {
            const channel = await guild.channels.fetch(config.channelId);
            
            // Hapus pesan lama agar bot bisa kirim baru (bump ke paling bawah chat)
            if (config.trackerMsgId) {
                try {
                    const oldTracker = await channel.messages.fetch(config.trackerMsgId);
                    if (oldTracker) await oldTracker.delete();
                } catch (e) {}
            }

            // Gunakan Embed agar mention role tidak berbunyi ping!
            const trackerEmbed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setDescription(`⏳ **SISA KUOTA:** Membutuhkan **-${remaining}**${role} lagi.`);
            
            const newTracker = await channel.send({ embeds: [trackerEmbed] });
            
            // Update ID Tracker baru ke memori & config pesan
            config.trackerMsgId = newTracker.id;
            activeRoleLimits.set(roleId, config);

            if (config.configMsgId && config.configChannelId) {
                try {
                    const cfgChannel = await guild.channels.fetch(config.configChannelId);
                    const configMsg = await cfgChannel.messages.fetch(config.configMsgId);
                    if (configMsg) {
                        await configMsg.edit(
                            `⚙️ **[MAXROLE-CONFIG]**\n` +
                            `RoleID: ${roleId}\n` +
                            `ChannelID: ${config.channelId}\n` +
                            `Limit: ${config.limit}\n` +
                            `TrackerMsgID: ${config.trackerMsgId}\n` +
                            `*(Catatan Sistem: Jangan hapus pesan ini agar target lock tidak hilang saat bot restart!)*`
                        );
                    }
                } catch (e) {}
            }
        } catch (e) {
            console.error("Gagal update tracker channel:", e);
        }
    }
}

// --- BOT READY & LOAD DATABASE DARI CHANNEL ---
client.once('ready', async () => {
    console.log(`Bot ${client.user.tag} sudah online!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('Berhasil mendaftarkan semua slash commands!');

        // Scan channel Text & Thread untuk memulihkan Maxrole Configs & Tracker
        client.guilds.cache.forEach(async guild => {
            const textChannels = guild.channels.cache.filter(c => c.isTextBased());
            for (const [id, channel] of textChannels) {
                try {
                    const msgs = await channel.messages.fetch({ limit: 20 });
                    msgs.forEach(msg => {
                        if (msg.author.id === client.user.id && msg.content.includes('[MAXROLE-CONFIG]')) {
                            const roleMatch = msg.content.match(/RoleID:\s*(\d+)/);
                            const channelMatch = msg.content.match(/ChannelID:\s*(\d+)/);
                            const limitMatch = msg.content.match(/Limit:\s*(\d+)/);
                            const trackerMatch = msg.content.match(/TrackerMsgID:\s*(\w+)/);
                            
                            if (roleMatch && channelMatch && limitMatch) {
                                activeRoleLimits.set(roleMatch[1], {
                                    channelId: channelMatch[1],
                                    limit: parseInt(limitMatch[1]),
                                    configMsgId: msg.id,
                                    configChannelId: channel.id,
                                    trackerMsgId: (trackerMatch && trackerMatch[1] !== 'null') ? trackerMatch[1] : null
                                });
                            }
                        }
                    });
                } catch (e) { /* Abaikan channel yang bot tidak punya akses baca */ }
            }
        });
        console.log(`Memori dipulihkan untuk tugas Maxrole.`);
    } catch (error) {
        console.error(error);
    }
});

// --- INTERACTION CREATE (Tombol & Slash Commands) ---
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        
        // --- BUTTON: AUTO RECRUITMENT ACCEPT (STATELESS) ---
        if (interaction.customId.startsWith('btn_acc_rec_')) {
            const targetId = interaction.customId.replace('btn_acc_rec_', '');
            if (!interaction.member.roles.cache.has(HANDLE_RECRUITMENT_ROLE_ID) && !interaction.member.permissions.has('ManageRoles')) {
                return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk mengurus recruitment!', ephemeral: true });
            }

            const embedDesc = interaction.message.embeds[0]?.description || "";
            const nameMatch = embedDesc.match(/\*\*Nama Pendaftar:\*\* ([^\n]+)/);
            if (!nameMatch) return interaction.reply({ content: '❌ Sistem gagal membaca nama dari panel ini. Silakan setnick manual.', ephemeral: true });
            const fullName = nameMatch[1].trim();

            try {
                const targetMember = await interaction.guild.members.fetch(targetId);
                await targetMember.setNickname(`V-Newbies || ${fullName}`);
                const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setColor('#2ecc71')
                    .setDescription(`✅ **DITERIMA** oleh ${interaction.user}\nNickname telah diubah otomatis menjadi: \`V-Newbies || ${fullName}\``);
                await interaction.update({ embeds: [updatedEmbed], components: [] });
            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Gagal mengubah nickname. Pastikan role bot berada **di atas** role user tersebut!', ephemeral: true });
            }
            return;
        }

        // --- BUTTON: AUTO RECRUITMENT DENY ---
        if (interaction.customId.startsWith('btn_deny_rec_')) {
            if (!interaction.member.roles.cache.has(HANDLE_RECRUITMENT_ROLE_ID) && !interaction.member.permissions.has('ManageRoles')) {
                return interaction.reply({ content: '❌ Anda tidak memiliki izin!', ephemeral: true });
            }
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor('#e74c3c')
                .setDescription(`❌ **DITOLAK** oleh ${interaction.user}`);
            await interaction.update({ embeds: [updatedEmbed], components: [] });
            return;
        }

        // --- BUTTON: AUTO EVENT ACCEPT (STATELESS) ---
        if (interaction.customId.startsWith('btn_acc_evt_')) {
            const targetId = interaction.customId.replace('btn_acc_evt_', '');
            if (!interaction.member.roles.cache.has(EVENT_ADMIN_ROLE_ID) && !interaction.member.permissions.has('ManageRoles')) {
                return interaction.reply({ content: '❌ Anda tidak memiliki izin untuk mengurus pendaftaran event!', ephemeral: true });
            }

            const embedDesc = interaction.message.embeds[0]?.description || "";
            const nameMatch = embedDesc.match(/\*\*Nama:\*\* ([^\n]+)/);
            if (!nameMatch) return interaction.reply({ content: '❌ Sistem gagal membaca nama dari panel ini.', ephemeral: true });
            const fullName = nameMatch[1].trim();

            try {
                const targetMember = await interaction.guild.members.fetch(targetId);
                await targetMember.setNickname(`Civil || ${fullName}`);
                await targetMember.roles.add(EVENT_ACCEPTED_ROLE_ID); 
                
                const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setColor('#2ecc71')
                    .setDescription(`🏁 **PENDAFTARAN DITERIMA** oleh ${interaction.user}\n\n• Role <@&${EVENT_ACCEPTED_ROLE_ID}> telah diberikan.\n• Nickname diubah menjadi: \`Civil || ${fullName}\``);
                await interaction.update({ embeds: [updatedEmbed], components: [] });

                // Panggil sistem pembaruan tracker sisa & lock
                await handleRoleUpdate(interaction.guild, EVENT_ACCEPTED_ROLE_ID);

            } catch (e) {
                console.error(e);
                await interaction.reply({ content: '❌ Gagal mengubah nickname/role. Pastikan bot memiliki izin yang cukup.', ephemeral: true });
            }
            return;
        }

        // --- SISA TOMBOL LAINNYA ---
        if (interaction.customId === 'btn_update_vlist') {
            if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Tombol khusus Staff/Admin!', ephemeral: true });
            await interaction.deferUpdate();
            const newPayload = await generateVECListPayload(interaction.guild);
            await interaction.message.edit(newPayload);
            return;
        } 
        
        if (interaction.customId === 'btn_ambil_posisi') {
            const messageId = interaction.message.id;
            let eventData = racingEvents.get(messageId);

            if (!eventData) return interaction.reply({ content: '❌ Sesi undian posisi balap ini sudah berakhir!', ephemeral: true });

            const userId = interaction.user.id;
            if (eventData.results.has(userId)) return interaction.reply({ content: `⚠️ Kamu sudah mendapatkan **Posisi Grid #${eventData.results.get(userId)}**!`, ephemeral: true });
            if (eventData.availableNumbers.length === 0) return interaction.reply({ content: '❌ Maaf, semua posisi grid sudah habis diambil!', ephemeral: true });

            const randomIndex = Math.floor(Math.random() * eventData.availableNumbers.length);
            const assignedNumber = eventData.availableNumbers.splice(randomIndex, 1)[0];
            eventData.results.set(userId, assignedNumber);

            let resultsText = '';
            const sortedResults = [...eventData.results.entries()].sort((a, b) => a[1] - b[1]);
            
            for (const [uId, pos] of sortedResults) {
                const memberObj = await interaction.guild.members.fetch(uId).catch(() => null);
                const memberName = memberObj ? (memberObj.displayName.includes('||') ? memberObj.displayName.split('||')[1].trim() : memberObj.displayName) : 'Unknown';
                resultsText += `• **Grid #${pos}** :${memberName}\n`;
            }

            const isFull = eventData.availableNumbers.length === 0;
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setFields([
                    { name: '🏁 Status Undian', value: isFull ? '✅ **Semua posisi grid sudah terisi!**' : `Sisa posisi tersedia: **${eventData.availableNumbers.length}** dari ${eventData.maxPosisi}`, inline: false },
                    { name: '📋 Daftar Posisi Grid Sementara', value: resultsText, inline: false }
                ]);

            if (isFull) {
                const disabledRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_grid_full').setLabel('Grid Full').setStyle(ButtonStyle.Secondary).setDisabled(true).setEmoji('🔒'));
                await interaction.update({ embeds: [updatedEmbed], components: [disabledRow] });

                let finalListText = `🏁 **FINAL GRID STARTING LINE - VEC RACING TOURNAMENT** 🏁\n\n`;
                for (const [uId, pos] of sortedResults) {
                    const memberObj = await interaction.guild.members.fetch(uId).catch(() => null);
                    const memberName = memberObj ? (memberObj.displayName.includes('||') ? memberObj.displayName.split('||')[1].trim() : memberObj.displayName) : 'Unknown';
                    finalListText += `• **Grid #${pos}** :${memberName}\n`;
                }
                await interaction.channel.send(finalListText);
            } else {
                await interaction.update({ embeds: [updatedEmbed] });
            }
            return;
        }
        
        if (interaction.customId === 'btn_join_giveaway') {
            const messageId = interaction.message.id;
            const gwData = activeGiveaways.get(messageId);

            if (!gwData || !gwData.active) return interaction.reply({ content: '❌ Sesi giveaway ini sudah berakhir atau ditutup!', ephemeral: true });

            const userId = interaction.user.id;
            const currentEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
            const fields = currentEmbed.data.fields || [];
            let totalPartIndex = fields.findIndex(f => f.name.includes('Total Peserta'));

            if (gwData.participants.has(userId)) {
                gwData.participants.delete(userId);
                if (totalPartIndex !== -1) fields[totalPartIndex].value = `👥 **${gwData.participants.size} Orang**`;
                currentEmbed.setFields(fields);
                await interaction.message.edit({ embeds: [currentEmbed] }).catch(() => {});
                return interaction.reply({ content: '⚠️ Kamu batal mengikuti giveaway ini.', ephemeral: true });
            } else {
                gwData.participants.add(userId);
                if (totalPartIndex !== -1) fields[totalPartIndex].value = `👥 **${gwData.participants.size} Orang**`;
                currentEmbed.setFields(fields);
                await interaction.message.edit({ embeds: [currentEmbed] }).catch(() => {});
                return interaction.reply({ content: '🎉 Berhasil! Kamu telah terdaftar dalam giveaway ini.', ephemeral: true });
            }
        }
        
        if (interaction.customId.startsWith('btn_close_claim_')) {
            const targetUserId = interaction.customId.replace('btn_close_claim_', '');
            if (!interaction.member.permissions.has('ManageRoles') && interaction.user.id !== targetUserId) return interaction.reply({ content: '❌ Tombol ini hanya dapat digunakan oleh Admin atau pemenang terkait!', ephemeral: true });

            try {
                const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);
                if (targetMember && targetMember.roles.cache.has(GIVEAWAY_ROLE_ID)) await targetMember.roles.remove(GIVEAWAY_ROLE_ID);

                const disabledRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_closed').setLabel('Claim Ditutup / Selesai').setStyle(ButtonStyle.Secondary).setDisabled(true).setEmoji('🔒'));
                await interaction.update({ content: `🔒 Claim telah ditutup oleh ${interaction.user}. Role tiket klaim dicabut.`, components: [disabledRow] });
            } catch (e) {
                await interaction.reply({ content: '❌ Gagal mencopot role pemenang.', ephemeral: true });
            }
            return;
        }
        
        if (interaction.customId === 'btn_set_absen') return interaction.reply({ content: '💡 Gunakan perintah chat **`!p @User [jumlah_poin]`** untuk update poin!', ephemeral: true });
        
        if (interaction.customId === 'btn_update_absen') {
            if (!activeAbsensi.has(interaction.message.id)) activeAbsensi.set(interaction.message.id, { pointsMap: new Map() });
            const absenData = activeAbsensi.get(interaction.message.id);

            await interaction.deferUpdate();
            const { text } = await generateAbsensiText(interaction.guild, absenData.pointsMap);
            const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setDescription(text);
            await interaction.message.edit({ embeds: [updatedEmbed] });
            return;
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'listrole') {
        await interaction.deferReply(); 
        const targetRole = interaction.options.getRole('role');
        await interaction.guild.members.fetch({ force: true });
        
        const role = interaction.guild.roles.cache.get(targetRole.id);
        if (!role || role.members.size === 0) {
            return interaction.editReply({ content: `❌ Tidak ada member yang saat ini memiliki role ${targetRole}.` });
        }

        const memberLines = role.members.map(m => `> • ${m.user.toString()}`).join('\n');
        const totalCount = role.members.size;
        const currentDate = new Date().toLocaleDateString('id-ID');

        const resultText = 
            `__**LIST MEMBER ROLE ${targetRole.name.toUpperCase()}**__\n` +
            `${memberLines}\n\n` +
            `__**ALL MEMBER LIST : ${totalCount}**__\n` +
            `*Last Update ${currentDate}*`;

        if (resultText.length > 2000) {
            return interaction.editReply({ content: `✅ Ditemukan ${totalCount} member, namun teks terlalu panjang untuk dikirim dalam 1 pesan. Cek manual di tab server.` });
        }

        await interaction.editReply({ content: resultText });
        return;
    }

    if (interaction.commandName === 'maxrole') {
        if (!interaction.member.permissions.has('ManageRoles') && !interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Admin/Staff!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const targetRole = interaction.options.getRole('role');
        const targetChannel = interaction.options.getChannel('channel');
        const limit = interaction.options.getInteger('limit');

        let configMsgId = null;
        let configChannelId = interaction.channel.id;

        try {
            // Trik Database: Kirim pesan config ke channel tempat perintah dijalankan (ditambahkan trackerMsg = null dulu)
            const configMsg = await interaction.channel.send(
                `⚙️ **[MAXROLE-CONFIG]**\n` +
                `RoleID: ${targetRole.id}\n` +
                `ChannelID: ${targetChannel.id}\n` +
                `Limit: ${limit}\n` +
                `TrackerMsgID: null\n` +
                `*(Catatan Sistem: Jangan hapus pesan ini agar target lock tidak hilang saat bot restart!)*`
            );
            configMsgId = configMsg.id;
        } catch (e) { console.log("Gagal mengirim config."); }

        activeRoleLimits.set(targetRole.id, { channelId: targetChannel.id, limit: limit, configMsgId: configMsgId, configChannelId: configChannelId, trackerMsgId: null });
        await interaction.editReply({ content: `✅ **Sistem Lock Otomatis Aktif secara Permanen!**\nBot akan mengawasi role ${targetRole}.\nJika jumlahnya mencapai **${limit} member**, bot otomatis me-lock channel <#${targetChannel.id}>.` });

        // Cek langsung sisa kuota dan buat Embed hitungan mundur pertama di target channel
        await handleRoleUpdate(interaction.guild, targetRole.id);
        return;
    }

    if (interaction.commandName === 'resetmaxrole') {
        if (!interaction.member.permissions.has('ManageRoles') && !interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ content: '❌ Perintah ini khusus untuk Admin/Staff!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const targetRole = interaction.options.getRole('role');

        if (!activeRoleLimits.has(targetRole.id)) {
            return interaction.editReply({ content: `⚠️ Tidak ada konfigurasi auto-lock aktif untuk role ${targetRole}.` });
        }

        const config = activeRoleLimits.get(targetRole.id);

        // Hapus pesan config dari channel tempat admin membuatnya
        if (config.configMsgId && config.configChannelId) {
            try {
                const cfgChannel = await interaction.guild.channels.fetch(config.configChannelId);
                const configMsg = await cfgChannel.messages.fetch(config.configMsgId);
                if (configMsg) await configMsg.delete();
            } catch (e) {}
        }
        
        // Hapus pesan tracker sisa kuota (jika ada) di channel target
        if (config.trackerMsgId && config.channelId) {
            try {
                const trChannel = await interaction.guild.channels.fetch(config.channelId);
                const trMsg = await trChannel.messages.fetch(config.trackerMsgId);
                if (trMsg) await trMsg.delete();
            } catch (e) {}
        }

        activeRoleLimits.delete(targetRole.id);
        await interaction.editReply({ content: `✅ **Berhasil di-reset!**\nSistem auto-lock dan tracker sisa kuota untuk role ${targetRole} telah dibatalkan & dihapus.` });
        return;
    }

    if (interaction.commandName === 'logs') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff/Admin!', ephemeral: true });
        
        const memberUser = interaction.options.getUser('member');
        const status = interaction.options.getString('status');
        const reason = interaction.options.getString('reason');
        const note = interaction.options.getString('note');
        const logsTo = interaction.options.getRole('logsto');

        try {
            const targetMember = await interaction.guild.members.fetch(memberUser.id);
            const rawDisplayName = targetMember.displayName;
            let extractedFullName = rawDisplayName.includes('||') ? rawDisplayName.split('||')[1].trim() : rawDisplayName;
            const fixedImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg';

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
        } catch (error) { await interaction.reply({ content: '❌ Terjadi kesalahan saat memproses log member.', ephemeral: true }); }
        return;
    }

    if (interaction.commandName === 'roleadd') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });

        const targetUser = interaction.options.getUser('member');
        const addRole1 = interaction.options.getRole('add_role1');
        const addRole2 = interaction.options.getRole('add_role2');
        const removeRole1 = interaction.options.getRole('remove_role1');
        const removeRole2 = interaction.options.getRole('remove_role2');

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            let addedList = [], removedList = [];

            if (addRole1) { await member.roles.add(addRole1); addedList.push(`${addRole1}`); }
            if (addRole2) { await member.roles.add(addRole2); addedList.push(`${addRole2}`); }
            if (removeRole1) { await member.roles.remove(removeRole1); removedList.push(`${removeRole1}`); }
            if (removeRole2) { await member.roles.remove(removeRole2); removedList.push(`${removeRole2}`); }

            let descText = `✨ **Manajemen Role Member**\n\n• **Target:** ${targetUser}\n`;
            if (addedList.length > 0) descText += `• **Role Diberikan:** ${addedList.join(' & ')}\n`;
            if (removedList.length > 0) descText += `• **Role Dicopot:** ${removedList.join(' & ')}\n`;
            descText += `\nDiproses oleh ${interaction.user}`;

            const embedRole = new EmbedBuilder().setColor('#1a1a1a').setDescription(descText).setTimestamp();
            await interaction.reply({ embeds: [embedRole] });

            if (addRole1) await handleRoleUpdate(interaction.guild, addRole1.id);
            if (addRole2) await handleRoleUpdate(interaction.guild, addRole2.id);

        } catch (error) { console.error(error); }
        return;
    }

    if (interaction.commandName === 'unrole') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('member');
        const role1 = interaction.options.getRole('role1');
        const role2 = interaction.options.getRole('role2');

        try {
            const member = await interaction.guild.members.fetch(targetUser.id);
            if (role1) await member.roles.remove(role1);
            if (role2) await member.roles.remove(role2);

            let removedRolesText = role2 ? `${role1} &${role2}` : `${role1}`;
            const embedRemove = new EmbedBuilder().setColor('#e74c3c').setDescription(`🗑️ **Role Dicopot / Dihapus**\n\n• **Server Role / Target:** ${removedRolesText}\n• **Berhasil Dicopot Dari:** ${targetUser}\n\nDicopot oleh${interaction.user}`).setTimestamp();
            await interaction.editReply({ embeds: [embedRemove] });
            
            // Call handleRoleUpdate in case we removed a tracked role, it will bump tracker and increase slot!
            if (role1) await handleRoleUpdate(interaction.guild, role1.id);
            if (role2) await handleRoleUpdate(interaction.guild, role2.id);

        } catch (error) { await interaction.editReply({ content: '❌ Gagal mencopot role. Pastikan hirarki bot di atas member.' }); }
        return;
    }

    if (interaction.commandName === 'acc') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });

        const applicant = interaction.options.getUser('applicant');
        const status = interaction.options.getString('status');
        const role = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason');
        const note = interaction.options.getString('note');
        const fixedAccImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg';

        const embedAcc = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('Velocity Elite Club\nApplication Result')
            .setDescription(`Dear, Mr/Mrs ${applicant}\n\n*Application has been reviewed successfully.*\n\n> • **Applicant:** ${applicant}\n> • **Status:** ${status}\n> • **Role:** ${role}\n> • **Reason:** ${reason}\n> • **Note:** ${note}\n\nRegards :${interaction.user}`)
            .setImage(fixedAccImageUrl)
            .setTimestamp();

        await interaction.reply({ embeds: [embedAcc] });
        if (role) await handleRoleUpdate(interaction.guild, role.id);
        return;
    }

    if (interaction.commandName === 'teks') {
        if (!interaction.member.permissions.has('Administrator') && !interaction.member.permissions.has('ManageMessages')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });

        const judulUtama = interaction.options.getString('judul_utama');
        const optFields = [
            { desk: interaction.options.getString('deskripsi_1'), foto: interaction.options.getString('foto_2') },
            { desk: interaction.options.getString('deskripsi_2'), foto: interaction.options.getString('foto_3') },
            { desk: interaction.options.getString('deskripsi_3'), foto: interaction.options.getString('foto_4') },
            { desk: interaction.options.getString('deskripsi_4'), foto: interaction.options.getString('foto_5') }
        ];

        const embedsList = [new EmbedBuilder().setColor('#1a1a1a').setDescription(`**${judulUtama}**`)];
        const foto1 = interaction.options.getString('foto_1');
        if (foto1) embedsList[0].setImage(foto1);

        for (const f of optFields) {
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
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });
        const payload = await generateVECListPayload(interaction.guild);
        const channel = await interaction.guild.channels.fetch(TARGET_CHANNEL_ID);
        if (channel) await channel.send(payload);
        await interaction.reply({ content: '✅ Panel list berhasil dikirim ke channel target!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'setposisi') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });

        const maxPosisi = interaction.options.getInteger('max_posisi');
        if (maxPosisi < 1 || maxPosisi > 50) return interaction.reply({ content: '❌ Masukkan angka posisi antara 1 sampai 50!', ephemeral: true });

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

        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_ambil_posisi').setLabel('Ambil Posisi Grid').setStyle(ButtonStyle.Success).setEmoji('🏎️'));

        const sentMessage = await interaction.channel.send({ embeds: [embed], components: [row] });
        racingEvents.set(sentMessage.id, { maxPosisi: maxPosisi, availableNumbers: availableNumbers, results: new Map() });
        await interaction.reply({ content: '✅ Panel undian posisi balap berhasil dibuat!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'giveaway') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });

        const hadiah = interaction.options.getString('hadiah');
        const jumlahPemenang = interaction.options.getInteger('pemenang');
        const durasiMenit = interaction.options.getInteger('durasi');
        const endTime = Date.now() + durasiMenit * 60 * 1000;
        const endTimeSeconds = Math.floor(endTime / 1000);

        const embedGw = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('🎉 VEC GIVEAWAY 🎉')
            .setDescription(`🎁 **Hadiah:** ${hadiah}\n👑 **Jumlah Pemenang:** ${jumlahPemenang} Orang\n⏳ **Berakhir:** <t:${endTimeSeconds}:R> (<t:${endTimeSeconds}:f>)\n\nKlik tombol **"Ikut Giveaway"** di bawah untuk berpartisipasi!`)
            .addFields({ name: '👥 Total Peserta', value: '👥 **0 Orang**', inline: false })
            .setFooter({ text: `Diadakan oleh ${interaction.user.username}` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_join_giveaway').setLabel('Ikut Giveaway').setStyle(ButtonStyle.Primary).setEmoji('🎉'));

        const sentMessage = await interaction.channel.send({ embeds: [embedGw], components: [row] });
        activeGiveaways.set(sentMessage.id, { hadiah: hadiah, winnersCount: jumlahPemenang, participants: new Set(), active: true, endTime: endTime });
        await interaction.reply({ content: '✅ Giveaway berhasil dimulai!', ephemeral: true });

        const checkGiveawayInterval = setInterval(async () => {
            if (Date.now() >= endTime) {
                clearInterval(checkGiveawayInterval);
                const gwData = activeGiveaways.get(sentMessage.id);
                if (!gwData || !gwData.active) return;

                gwData.active = false;
                const participantsArray = [...gwData.participants];
                let winnerMentions = '', winnerIds = [];

                if (participantsArray.length === 0) {
                    winnerMentions = '_Tidak ada peserta yang mengikuti giveaway._';
                } else {
                    const winners = participantsArray.sort(() => 0.5 - Math.random()).slice(0, gwData.winnersCount);
                    for (const wId of winners) { winnerMentions += `<@${wId}>\n`; winnerIds.push(wId); }
                }

                const endedEmbed = new EmbedBuilder()
                    .setColor('#1a1a1a')
                    .setTitle('🎉 VEC GIVEAWAY - BERAKHIR 🎉')
                    .setDescription(`🎁 **Hadiah:** ${hadiah}\n\n👑 **Pemenang Terpilih:**\n${winnerMentions}\n\n✨ Silakan menuju ke channel <#${CLAIM_CHANNEL_ID}> untuk melakukan claim hadiah Anda!`)
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_join_giveaway_ended').setLabel('Giveaway Selesai').setStyle(ButtonStyle.Secondary).setDisabled(true));

                await sentMessage.edit({ embeds: [endedEmbed], components: [disabledRow] }).catch(() => {});
                await interaction.channel.send(`🎊 Selamat kepada ${winnerMentions} telah memenangkan **${hadiah}**!`).catch(() => {});

                if (winnerIds.length > 0) {
                    const claimChannel = await interaction.guild.channels.fetch(CLAIM_CHANNEL_ID).catch(() => null);
                    for (const wId of winnerIds) {
                        const winnerMember = await interaction.guild.members.fetch(wId).catch(() => null);
                        if (winnerMember) {
                            await winnerMember.roles.add(GIVEAWAY_ROLE_ID).catch(() => {});
                            if (claimChannel) {
                                const closeRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`btn_close_claim_${wId}`).setLabel('Tutup Claim').setStyle(ButtonStyle.Danger).setEmoji('🔒'));
                                await claimChannel.send({ content: `<@${wId}> silahkan klaim di sini <@&${GIVEAWAY_ADMIN_ROLE_ID}>`, components: [closeRow] }).catch(() => {});
                            }
                        }
                    }
                }
            }
        }, 5000);
        return;
    }

    if (interaction.commandName === 'memberlist') {
        await interaction.guild.members.fetch({ force: true });
        const role = interaction.guild.roles.cache.get(MEMBER_ROLE_ID);
        if (!role || role.members.size === 0) return interaction.reply({ content: '❌ Tidak ada member.', ephemeral: true });

        const memberLines = role.members.map(m => m.displayName.includes('||') ? `> • ${m.displayName.split('||')[1].trim()}` : `> • ${m.displayName}`).join('\n');
        const resultText = `__**LIST MEMBER VELOCITY ELITE CLUB**__\n${memberLines}\n\n__**ALL MEMBER LIST : ${role.members.size}**__\n*Last Update${new Date().toLocaleDateString('id-ID')}*`;
        await interaction.reply({ content: resultText });
        return;
    }

    if (interaction.commandName === 'absensi') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });
        const pointsMap = new Map();
        const { text } = await generateAbsensiText(interaction.guild, pointsMap);
        const embedAbsen = new EmbedBuilder().setColor('#1a1a1a').setTitle('📋 VEC ABSENSI MEMBER').setDescription(text).setTimestamp();
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_set_absen').setLabel('Set Absen').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
            new ButtonBuilder().setCustomId('btn_update_absen').setLabel('Update').setStyle(ButtonStyle.Success).setEmoji('🔁')
        );
        const sentMessage = await interaction.channel.send({ embeds: [embedAbsen], components: [row] });
        activeAbsensi.set(sentMessage.id, { pointsMap: pointsMap });
        await interaction.reply({ content: '✅ Panel absensi berhasil dibuat!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'updatebot') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });
        const embedUpdate = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('🚀 V-BOT UPDATE LOGS - [v3.0]')
            .setDescription(
                `Pemberitahuan pembaruan sistem dan peningkatan fitur bot terbaru untuk Velocity Elite Club.\n\n` +
                `> • **Versi:** v3.0 Stabil (Final Target Build)\n` +
                `> • **Kategori:** Live Tracker Kuota Event (Bump System)\n` +
                `> • **Diperbarui Oleh:** ${interaction.user}\n\n` +
                `📋 **Detail Pembaruan:**\n` +
                `\`\`\`text\n` +
                `1. Bot otomatis mengirim pesan Tracker Kuota di dalam channel target ketika /maxrole dipasang.\n` +
                `2. Sistem Bumping: Jika ada member diterima di event, pesan tracker lama akan ditarik mundur & bot memunculkan kembali info "-x slot @role lagi" di paling bawah chat.\n` +
                `3. Tracker kuota menggunakan fitur Embed, sehingga tag nama Role di dalamnya tidak akan berbunyi ping! mengganggu ke user.\n` +
                `\`\`\``
            )
            .setFooter({ text: `V-BOT System Update | ${new Date().toLocaleDateString('id-ID')}` })
            .setTimestamp();
        await interaction.channel.send({ embeds: [embedUpdate] });
        await interaction.reply({ content: '✅ Log pembaruan bot berhasil dikirim!', ephemeral: true });
        return;
    }

    if (interaction.commandName === 'cmd') {
        if (!interaction.member.permissions.has('ManageRoles')) return interaction.reply({ content: '❌ Perintah khusus Staff!', ephemeral: true });
        const embedList = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('📜 VEC BOT COMMAND LIST')
            .setDescription(
                `Berikut adalah daftar perintah bot yang tersedia:\n\n` +
                `**🔹 Slash Commands (/):**\n` +
                `• \`/logs\` - Kirim log data.\n` +
                `• \`/roleadd\` - Tambah & hapus role.\n` +
                `• \`/unrole\` - Menghapus role dari member.\n` +
                `• \`/listrole\` - Menampilkan daftar mention member.\n` +
                `• \`/maxrole\` - Atur target limit member untuk auto-lock.\n` +
                `• \`/resetmaxrole\` - Membatalkan tugas auto-lock event.\n` +
                `• \`/acc\` - Mengirim hasil review application.\n` +
                `• \`/teks\` - Kirim pesan estetik.\n` +
                `• \`/setupvlist\` - Kirim panel list member.\n` +
                `• \`/setposisi\` - Buat undian grid balap.\n` +
                `• \`/giveaway\` - Mulai giveaway.\n` +
                `• \`/memberlist\` - Menampilkan list member.\n` +
                `• \`/absensi\` - Buat panel absensi otomatis.\n` +
                `• \`/updatebot\` - Kirim log update bot.\n\n` +
                `**🔹 Text Commands (!):**\n` +
                `• \`!logs @User\` - Kirim log otomatis.\n` +
                `• \`!setnick @User Nama\` - Ubah nickname.\n` +
                `• \`!lock\` atau \`!L\` - Mengunci channel.\n` +
                `• \`!teks [Teks]\` - Kirim teks murni.\n` +
                `• \`!p @User [poin]\` - Tambah/kurang poin absen.\n` +
                `• \`!c [jumlah]\` - Hapus pesan massal.`
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();
        await interaction.reply({ embeds: [embedList] });
        return;
    }
});

// --- MESSAGE UPDATE (Pesan yang di-edit) ---
client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (newMessage.author?.bot) return;

    if (newMessage.content.includes(`<@&${HANDLE_RECRUITMENT_ROLE_ID}>`) && newMessage.content.toLowerCase().includes('full name')) {
        if (!oldMessage.content.includes(`<@&${HANDLE_RECRUITMENT_ROLE_ID}>`)) {
            const nameMatch = newMessage.content.match(/Full Name\s*:\s*([^\n]+)/i);
            if (nameMatch) {
                const fullName = nameMatch[1].trim();
                const embedReq = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setTitle('📋 Recruitment Request Terdeteksi (Edited)')
                    .setDescription(`Permintaan masuk dari ${newMessage.author}\n**Nama Pendaftar:** ${fullName}\n\nStaff Recruitment silakan evaluasi form di atas dan klik tombol di bawah.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`btn_acc_rec_${newMessage.author.id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId(`btn_deny_rec_${newMessage.author.id}`).setLabel('Denied').setStyle(ButtonStyle.Danger).setEmoji('❌')
                );
                await newMessage.reply({ embeds: [embedReq], components: [row] });
                return;
            }
        }
    }

    if (newMessage.content.includes(`<@&${EVENT_ADMIN_ROLE_ID}>`) && newMessage.content.toLowerCase().includes('format register')) {
        if (!oldMessage.content.includes(`<@&${EVENT_ADMIN_ROLE_ID}>`)) {
            const nameMatch = newMessage.content.match(/Full Name\s*:\s*([^\n]+)/i);
            if (nameMatch) {
                const fullName = nameMatch[1].trim();
                const threadName = fullName.length > 20 ? fullName.substring(0, 20) : fullName;
                const thread = await newMessage.startThread({ name: `Event Reg - ${threadName}`, autoArchiveDuration: 1440 });
                const embedEvt = new EmbedBuilder()
                    .setColor('#3498db')
                    .setTitle('🏎️ Event Registration')
                    .setDescription(`Pendaftaran dari ${newMessage.author}\n**Nama:** ${fullName}\n\nAdmin Event silakan verifikasi persyaratan dan klik tombol Accept untuk menyetujui.`);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`btn_acc_evt_${newMessage.author.id}`).setLabel('Accept Registration').setStyle(ButtonStyle.Success).setEmoji('🏁')
                );
                await thread.send({ content: `<@&${EVENT_ADMIN_ROLE_ID}>`, embeds: [embedEvt], components: [row] });
                return;
            }
        }
    }
});

// --- MESSAGE CREATE (Prefix & Auto-Detect Pesan Baru) ---
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.includes(`<@&${HANDLE_RECRUITMENT_ROLE_ID}>`) && message.content.toLowerCase().includes('full name')) {
        const nameMatch = message.content.match(/Full Name\s*:\s*([^\n]+)/i);
        if (nameMatch) {
            const fullName = nameMatch[1].trim();
            const embedReq = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('📋 Recruitment Request Terdeteksi')
                .setDescription(`Permintaan masuk dari ${message.author}\n**Nama Pendaftar:** ${fullName}\n\nStaff Recruitment silakan evaluasi form di atas dan klik tombol di bawah.`);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btn_acc_rec_${message.author.id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`btn_deny_rec_${message.author.id}`).setLabel('Denied').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );
            await message.reply({ embeds: [embedReq], components: [row] });
            return;
        }
    }

    if (message.content.includes(`<@&${EVENT_ADMIN_ROLE_ID}>`) && message.content.toLowerCase().includes('format register')) {
        const nameMatch = message.content.match(/Full Name\s*:\s*([^\n]+)/i);
        if (nameMatch) {
            const fullName = nameMatch[1].trim();
            const threadName = fullName.length > 20 ? fullName.substring(0, 20) : fullName;
            const thread = await message.startThread({ name: `Event Reg - ${threadName}`, autoArchiveDuration: 1440 });
            const embedEvt = new EmbedBuilder()
                .setColor('#3498db')
                .setTitle('🏎️ Event Registration')
                .setDescription(`Pendaftaran dari ${message.author}\n**Nama:** ${fullName}\n\nAdmin Event silakan verifikasi persyaratan dan klik tombol Accept untuk menyetujui.`);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`btn_acc_evt_${message.author.id}`).setLabel('Accept Registration').setStyle(ButtonStyle.Success).setEmoji('🏁')
            );
            await thread.send({ content: `<@&${EVENT_ADMIN_ROLE_ID}>`, embeds: [embedEvt], components: [row] });
            return;
        }
    }

    if (message.content.startsWith('!p')) {
        if (!message.member.permissions.has('ManageRoles')) return;
        const args = message.content.split(' ');
        const targetUser = message.mentions.users.first();
        const changePoints = parseInt(args[2]);

        if (!targetUser || isNaN(changePoints)) return message.reply('❌ Format salah! Contoh: `!p @Boris 1`').then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));

        const channelAbsensi = activeAbsensi.size > 0 ? [...activeAbsensi.entries()][activeAbsensi.size - 1] : null;
        if (!channelAbsensi) return message.reply('❌ Belum ada panel absensi aktif! Ketik `/absensi` dulu.');

        const [msgId, absenData] = channelAbsensi;
        const currentPoints = absenData.pointsMap.get(targetUser.id) || 0;
        let totalNewPoints = Math.max(0, currentPoints + changePoints);
        absenData.pointsMap.set(targetUser.id, totalNewPoints);

        try {
            const messageObj = await message.channel.messages.fetch(msgId);
            if (messageObj) {
                const { text } = await generateAbsensiText(message.guild, absenData.pointsMap);
                const updatedEmbed = EmbedBuilder.from(messageObj.embeds[0]).setDescription(text);
                await messageObj.edit({ embeds: [updatedEmbed] });
            }
        } catch (e) { console.log('Panel absen gagal terupdate otomatis.'); }

        const targetMember = await message.guild.members.fetch(targetUser.id);
        const cleanName = targetMember.displayName.includes('||') ? targetMember.displayName.split('||')[1].trim() : targetMember.displayName;
        const actionText = changePoints < 0 ? `mengurangi ${Math.abs(changePoints)} poin` : `menambahkan ${changePoints} poin`;

        await message.reply(`✅ Berhasil ${actionText} untuk **${cleanName}**. Total poin: **[${totalNewPoints}]**`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        await message.delete().catch(() => {});
        return;
    }

    if (message.content.startsWith('!logs')) {
        if (!message.member.permissions.has('ManageRoles')) return;
        const targetUser = message.mentions.users.first();
        if (!targetUser) return message.reply('❌ Format salah! Contoh: `!logs @User`').then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));

        try {
            await message.delete().catch(() => {});
            const targetMember = await message.guild.members.fetch(targetUser.id);
            const extractedFullName = targetMember.displayName.includes('||') ? targetMember.displayName.split('||')[1].trim() : targetMember.displayName;
            const fixedImageUrl = 'https://cdn.discordapp.com/attachments/1533571778897514556/1549804646950768680/file_00000000494481fdaeb69b72f0c375ba-1.jpg';

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
                await message.channel.send(`✅ Berhasil terkirim ke <#${LOGS_CHANNEL_ID}>!`);
            }
        } catch (error) { console.error(error); }
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
            await message.channel.send({ embeds: [new EmbedBuilder().setColor('#1a1a1a').setDescription(`✏️ **NICKNAME CHANGED**\n\n👤 **User:** ${targetUser}\n📝 **Baru:** ${newNickname}\n👮 **Mod:** ${message.author}`)] });
        } catch (error) { console.error(error); }
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
            await message.channel.send({ embeds: [new EmbedBuilder().setColor('#f39c12').setDescription(`🔒 **Locked**\n💬 ${message.channel.name} telah dikunci oleh ${message.author}\n${new Date().toLocaleString()}`)] });
        } catch (error) { console.error(error); }
    }

    if (message.content.startsWith('!teks')) {
        if (!message.member.permissions.has('Administrator') && !message.member.permissions.has('ManageMessages')) return;
        const textContent = message.content.slice(5).trim();
        if (!textContent) return;
        try {
            await message.delete();
            await message.channel.send({ embeds: [new EmbedBuilder().setColor('#1a1a1a').setDescription(textContent)] });
        } catch (error) { console.error(error); }
    }

    if (message.content.startsWith('!c')) {
        if (!message.member.permissions.has('ManageMessages')) return;
        const args = message.content.trim().split(/\s+/);
        if (args[0].toLowerCase() === '!c') {
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0 || amount > 100) return message.reply('❌ Masukkan angka 1-100!').then(msg => setTimeout(() => msg.delete().catch(() => {}), 4000));
            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const notify = await message.channel.send(`🧹 Menghapus **${deleted.size}** pesan.`);
                setTimeout(() => notify.delete().catch(() => {}), 3000);
            } catch (error) { message.reply('❌ Gagal hapus (pesan >14 hari).'); }
            return;
        }
    }
});

client.login(process.env.DISCORD_TOKEN); 
