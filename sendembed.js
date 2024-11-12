import { EmbedBuilder } from 'discord.js';

export default {
  name: 'sendembed',
  description: 'Wysyła wiadomość w osadzeniu (embed)',
  execute(message, args) {
    const embedMessage = args.join(' ');
    if (!embedMessage) {
      return message.reply('Podaj wiadomość do wysłania w embedzie.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Wiadomość Embed')
      .setDescription(embedMessage)
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};
