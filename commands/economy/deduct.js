const { Client, Interaction, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const User = require('../../models/User');
const { registerFont, createCanvas, loadImage } = require('canvas');
const path = require('path');
const config = require('../../config.json');

// Register custom font
registerFont(path.join(__dirname, 'fonts', 'Itim-Regular.ttf'), { family: 'Itim' });

module.exports = {
  name: 'deduct',
  description: 'หักเงินจากผู้ใช้คนอื่น (สำหรับผู้ดูแลระบบเท่านั้น)',

  options: [
    {
      name: 'target',
      description: 'ผู้ใช้ที่คุณต้องการหักเงิน',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'amount',
      description: 'จำนวนเงินที่คุณต้องการหัก',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: 'memo',
      description: 'บันทึกช่วยจำสำหรับการหักเงินครั้งนี้',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'name',
      description: 'ชื่อสำหรับการทำธุรกรรมนี้',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply({
        content: 'คุณสามารถใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น',
        ephemeral: true,
      });
      return;
    }

    const targetUserId = interaction.options.getUser('target')?.id;
    const amount = interaction.options.getInteger('amount');
    let memo = interaction.options.getString('memo') || 'ไม่มีบันทึกช่วยจำ';
    const customName = interaction.options.getString('name') || interaction.user.username;

    // Check if the user executing the command is in the list of devs
    if (!config.devs.includes(interaction.user.id)) {
      interaction.reply({
        content: 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้',
        ephemeral: true,
      });
      return;
    }

    // Limit memo length to 30 characters and maximum 2 lines
    if (memo.length > 30) {
      memo = memo.match(/.{1,30}/g).slice(0, 2).join('\n');
    }

    if (!targetUserId || !amount || amount <= 0) {
      interaction.reply({
        content: 'โปรดระบุผู้ใช้ที่ต้องการหักเงินและจำนวนเงินที่ถูกต้อง',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = await User.findOne({ userId: targetUserId, guildId: interaction.guild.id });

      if (!targetUser || targetUser.balance < amount) {
        interaction.editReply({
          content: 'ผู้ใช้มีเงินไม่เพียงพอที่จะหัก',
        });
        return;
      }

      targetUser.balance -= amount;

      await targetUser.save();

      const backgroundUrl = 'https://arplanecorporation.github.io/cdn/moneyslip.png';
      let background;

      try {
        background = await loadImage(backgroundUrl);
      } catch (error) {
        console.warn(`Failed to load online image, falling back to local image. Error: ${error}`);
        background = await loadImage(path.join(__dirname, 'images', 'moneyslip.png'));
      }

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext('2d');

      // Draw background
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Set text properties
      ctx.font = '60px Itim';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Get usernames without tags
      const senderUsername = interaction.user.username;
      const recipientUsername = client.users.cache.get(targetUserId).username;
      const serverName = interaction.guild.name;

      // Add text (centered horizontally and vertically)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const lineHeight = 60 + 2.5 * 37.7953; // 60px font size + 5 cm in pixels

      ctx.fillText(`จาก: ${customName}`, centerX, centerY - lineHeight * 2);
      ctx.fillText(`ถึง: ${recipientUsername}`, centerX, centerY - lineHeight);
      ctx.fillText(`จำนวน: -${amount} บาท`, centerX, centerY);
      ctx.fillText(`บันทึกช่วยจำ: ${memo}`, centerX, centerY + lineHeight);

      const slip = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'slip.png' });

      // Informing the user that the transaction was successful
      await interaction.editReply({
        content: `หักเงินจำนวน ${amount} บาท จาก <@${targetUserId}> สำเร็จแล้ว\n ตรวจสอบสลิปได้ที่ DMs`,
      });

      // Sending DM to the recipient
      try {
        const recipient = await client.users.fetch(targetUserId);
        await recipient.send({
          content: `# รายการเงินออก\nเงินออก: จำนวน: ${amount} บาท ไปยัง: ${customName} \nบันทึกช่วยจำ: ${memo}\nมาจากเซิร์ฟเวอร์: ${serverName}`,
          files: [slip],
        });

        // Sending DM to the sender
        await interaction.user.send({
          content: `# รายการเงินเข้า\nเงินเข้า: จาก: ${senderUsername} จำนวน: ${amount} บาท\nบันทึกช่วยจำ: ${memo}\nมาจากเซิร์ฟเวอร์: ${serverName}`,
          files: [slip],
        });
      } catch (dmError) {
        console.error('Error sending DM:', dmError);
      }

    } catch (error) {
      console.error('Error occurred during deduct command:', error);
      await interaction.editReply({
        content: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
      });
    }
  },
};
