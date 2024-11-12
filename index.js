const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField 
} = require('discord.js');
const https = require('https'); // Import modułu https

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

    const statuses = [
        { name: 'najlepszy serwer na świecie https://discord.gg/GPdN7KrbAf', type: 1 },
        { name: 'najlepszy serwer na świecie https://discord.gg/GPdN7KrbAf', type: 2 },
        { name: 'najlepszy serwer na świecie https://discord.gg/GPdN7KrbAf', type: 3 },
        { name: 'najlepszy serwer na świecie https://discord.gg/GPdN7KrbAf', type: 4 },
        { name: 'najlepszy serwer na świecie https://discord.gg/GPdN7KrbAf', type: 5 },
       ];
    
    let index = 0;
    
    function updateStatus() {
        client.user.setPresence({
            status: 'dnd', // Możesz zmienić na 'online', 'idle', itp.
            activities: [statuses[index]]
        });
    
        index = (index + 1) % statuses.length; // Przełączaj między statusami
    }
    
    client.once('ready', () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
        updateStatus(); // Ustaw pierwszy status
        setInterval(updateStatus, 60000); // Zmieniaj status co minutę
    });

const token = "MTI3MTYyNzU2MjY0ODYwNDY3Mg.GXeKAp.RCQTX8W7iLZE3TRccY8rmU7WnRJ0OkibMnCg4U"; // Wstaw swój token
const WEATHER_API_KEY = 'e3313458d163fce19991344ba59bdb59';
const LEAVE_CHANNEL_ID = "1286433856156860429"

const prefix = '!'; // prefiks dla komend
const warningThreshold = 3; // liczba upomnień, po której zostanie nadana rola "Warned"
const userWarnings = {}; // Przechowywanie liczby upomnień użytkowników

client.on('messageCreate', message => {
    if (message.content.startsWith('!weather')) {
      const args = message.content.split(' ');
      const city = args[1];
  
      if (!city) {
        return message.reply('Podaj nazwę miasta po komendzie `!weather <miasto>`.');
      }
  
      // Kodowanie nazwy miasta w URL, aby obsłużyć spacje i znaki specjalne
      const encodedCity = encodeURIComponent(city);
  
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&appid=${WEATHER_API_KEY}&units=metric&lang=pl`;
  
      https.get(url, res => {
        let data = '';
  
        res.on('data', chunk => {
          data += chunk;
        });
  
        res.on('end', () => {
          try {
            const weather = JSON.parse(data);
  
            // Sprawdzamy, czy kod odpowiedzi to 200
            if (weather.cod === 200) {
              const description = weather.weather[0].description;
              const temp = weather.main.temp;
              const feelsLike = weather.main.feels_like;
              const humidity = weather.main.humidity;
  
              message.channel.send(`**Pogoda w ${city}:**\nOpis: ${description}\nTemperatura: ${temp}°C\nOdczuwalna: ${feelsLike}°C\nWilgotność: ${humidity}%`);
            } else {
              // Dodajemy logowanie pełnej odpowiedzi w przypadku błędu
              console.log(weather);
              message.reply(`Nie znaleziono miasta. Kod błędu: ${weather.cod}, wiadomość: ${weather.message}`);
            }
          } catch (error) {
            console.error(error);
            message.reply('Wystąpił błąd podczas przetwarzania danych. Spróbuj ponownie później.');
          }
        });
      }).on('error', (e) => {
        console.error(e);
        message.reply('Wystąpił błąd połączenia z serwerem pogody.');
      });
    }
  });

// Obsługuje nowe wiadomości
client.on('messageCreate', async (message) => {
    // Ignoruj wiadomości od bota
    if (message.author.bot) return;

    // Sprawdzanie, czy wiadomość zaczyna się od "!warn" i zawiera @użytkownika
    if (message.content.startsWith('!upo')) {
        // Rozdziel wiadomość, aby pobrać użytkownika i opcjonalny powód
        const args = message.content.split(' ');
        const user = message.mentions.users.first();
        const reason = args.slice(2).join(' ') || 'Brak powodu';

        // Jeśli nie ma wymienionego użytkownika
        if (!user) {
            return message.reply('Musisz oznaczyć użytkownika, którego chcesz ostrzec.');
        }

        // Jeśli użytkownik już istnieje w obiekcie ostrzeżeń, dodaj ostrzeżenie
        if (!userWarnings[user.id]) {
            userWarnings[user.id] = 1;  // Jeśli użytkownik nie ma jeszcze ostrzeżeń, dodaj 1
        } else {
            userWarnings[user.id] += 1;  // Zwiększ liczbę ostrzeżeń
        }

        // Stwórz embed do wysłania
        const warnEmbed = new EmbedBuilder()
            .setTitle('Ostrzeżenie')
            .setColor('#ffcc00')
            .addFields(
                { name: 'Użytkownik', value: user.tag, inline: true },
                { name: 'Liczba ostrzeżeń', value: userWarnings[user.id].toString(), inline: true },
                { name: 'Powód', value: reason }
            )
            .setTimestamp()
            .setFooter({ text: `Ostrzeżenie nr ${userWarnings[user.id]}` });

        // Wyślij embed z ostrzeżeniem
        message.channel.send({ embeds: [warnEmbed] });

        // Sprawdzamy, czy użytkownik przekroczył limit ostrzeżeń (np. 3 ostrzeżenia)
        if (userWarnings[user.id] >= 3) {
            // Wyślij wiadomość z informacją, że użytkownik otrzyma timeout
            message.channel.send(`${user.tag} otrzymał 3 ostrzeżenia i otrzymuje timeout na 1 godzinę.`);

            // Znajdź użytkownika na serwerze
            const member = message.guild.members.cache.get(user.id);
            if (member) {
                // Ustawienie timeoutu na 1 godzinę (3600000 ms = 1 godzina)
                await member.timeout(3600000, 'Przekroczono limit ostrzeżeń')
                    .then(() => message.channel.send(`${user.tag} został objęty timeoutem na 1 godzinę.`))
                    .catch(err => message.channel.send('Nie mogę nałożyć timeoutu na tego użytkownika.'));
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle("Lista Komend")
            .addFields(
                { name: "!info", value: "Informacje o bocie." },
                { name: "!ship @user1 @user2", value: "Sprawdza poziom miłości między dwiema osobami." },
                { name: "!poll <pytanie> | <opcja1,opcja2>", value: "Tworzy ankietę z opcjami." },
                { name: "!say <wiadomość>", value: "Bot powtarza podaną wiadomość." },
                { name: "!userinfo", value: "Pokazuje informacje o użytkowniku." },
                { name: "!verify", value: "Nadaje rolę Świeżak po weryfikacji." },
                { name: "!upo", value: "upomina użytkownia 1/3 punktami za trzy punkty jest przerwa." },
                { name: "!kick @user", value: "Wyrzuca użytkownika z serwera." },
                { name: "!ban @user", value: "Banuje użytkownika na serwerze." },
                { name: "!mute @user", value: "Wycisza użytkownika." },
                { name: "!unmute @user", value: "Odcisza użytkownika." },
                { name: "!clear <liczba>", value: "Usuwa podaną liczbę wiadomości (max 100)." },
                { name: "!event <data> <godzina> <nazwa>", value: "Tworzy wydarzenie." },
                { name: "!fact", value: "Losowy fakt." },
                { name: "!update <wiadomość>", value: "Wysyła aktualizację na serwerze." },
                { name: "!ticket <opis>", value: "Tworzy nowy bilet." },
                { name: "!close", value: "Zamyka bilte." }
                
            )
            .setColor("#FFFF00")
            .setTimestamp();

        await message.channel.send({ embeds: [helpEmbed] });
    }
});

// Obsługuje wiadomości
client.on('messageCreate', async (message) => {
    // Sprawdzenie, czy wiadomość nie pochodzi od bota
    if (message.author.bot) return;

    // Komenda do tworzenia kanałów i ról
    if (message.content.startsWith('!stwóz')) {
        const args = message.content.split(' ').slice(1); // Pobierz argumenty
        const roleName = args[0]; // Nazwa roli
        const channelName = args[1]; // Nazwa kanału

        // Sprawdzenie, czy podano nazwę roli i kanału
        if (!roleName || !channelName) {
            return message.channel.send('Proszę podać nazwę roli i kanału, np. `!stwóz NowaRola NowyKanał`.');
        }

        try {
            // Tworzenie roli
            const role = await message.guild.roles.create({
                name: roleName,
                color: 0x0000FF, // Użyj wartości szesnastkowej dla niebieskiego
            });
            message.channel.send(`Rola ${role.name} została utworzona!`);

            // Tworzenie kanału
            const channel = await message.guild.channels.create(channelName, {
                type: 'GUILD_TEXT', // Typ kanału (tekstowy)
                permissionOverwrites: [
                    {
                        id: role.id, // Ustawienia uprawnień dla nowej roli
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES'], // Co może robić rola
                    },
                ],
            });
            message.channel.send(`Kanał ${channel.name} został utworzony!`);
        } catch (error) {
            console.error(error);
            message.channel.send('Wystąpił błąd przy tworzeniu roli lub kanału.');
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!info') {
        message.reply("Bot stworzony przez Vix_Studio do pomocy użytkownikom Discorda.");
    }
});





client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!kick')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply("Nie masz uprawnień do wyrzucania użytkowników.");
        }

        const user = message.mentions.members.first();
        if (!user) return message.reply("Oznacz użytkownika do wyrzucenia.");

        await user.kick();
        message.channel.send(`${user.user.tag} został wyrzucony.`);
    }

    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply("Nie masz uprawnień do banowania użytkowników.");
        }

        const user = message.mentions.members.first();
        if (!user) return message.reply("Oznacz użytkownika do zbanowania.");

        await user.ban();
        message.channel.send(`${user.user.tag} został zbanowany.`);
    }

    if (message.content.startsWith('!mute')) {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Oznacz użytkownika do wyciszenia.");

        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) return message.reply("Rola 'Muted' nie istnieje.");

        await user.roles.add(muteRole);
        message.channel.send(`${user.user.tag} został wyciszony.`);
    }

    if (message.content.startsWith('!unmute')) {
        const user = message.mentions.members.first();
        if (!user) return message.reply("Oznacz użytkownika do odciszenia.");

        const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) return message.reply("Rola 'Muted' nie istnieje.");

        await user.roles.remove(muteRole);
        message.channel.send(`${user.user.tag} został odciszony.`);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === '!banlist') {
        const bans = await message.guild.bans.fetch();
        if (bans.size === 0) return message.reply("Na serwerze nie ma zbanowanych użytkowników.");
        message.channel.send(`Lista zbanowanych użytkowników:\n${bans.map(ban => `${ban.user.tag}`).join("\n")}`);
    }
});



client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!clear')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("Nie masz uprawnień do usuwania wiadomości.");
        }

        const args = message.content.split(' ');
        const amount = parseInt(args[1]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply("Podaj liczbę wiadomości do usunięcia (1-100).");
        }

        await message.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            message.reply("Wystąpił błąd podczas usuwania wiadomości.");
        });

        message.channel.send(`Usunięto ${amount} wiadomości.`).then(msg => {
            setTimeout(() => msg.delete(), 5000); 
        });
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!say ')) {
        const text = message.content.slice(5);
        await message.channel.send(text);
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!userinfo') {
        const user = message.author;
        const member = await message.guild.members.fetch(user.id);

        const userEmbed = new EmbedBuilder()
            .setTitle(`Informacje o użytkowniku: ${user.username}`)
            .addFields(
                { name: "ID", value: user.id },
                { name: "Dołączył(a) do serwera", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` },
                { name: "Utworzono konto", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>` }
            )
            .setColor("#00FF00")
            .setThumbnail(user.displayAvatarURL());

        await message.channel.send({ embeds: [userEmbed] });
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase().startsWith("!poll")) {
        const pollArgs = message.content.slice(6).split("|");
        const question = pollArgs[0];
        const options = pollArgs[1] ? pollArgs[1].split(",") : [];

        if (options.length < 2) {
            return message.reply("Musisz podać pytanie i przynajmniej dwie opcje, oddzielone przecinkami.");
        }

        const pollEmbed = new EmbedBuilder()
            .setTitle(`Ankieta: ${question}`)
            .setDescription(options.map((opt, i) => `${i + 1}. ${opt}`).join("\n"))
            .setColor("#FFFF00")
            .setTimestamp();

        const pollMessage = await message.reply({ embeds: [pollEmbed] });
        for (let i = 0; i < options.length; i++) {
            await pollMessage.react(`${i + 1}️⃣`); 
        }
    }
});

// Dodajemy nasłuchiwacz do 'messageCreate'
client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!fact') {
        const facts = [
            "Koty mają pięć palców u przednich łap, ale tylko cztery u tylnych.",
            "Słoń jest jedynym ssakiem, który nie potrafi skakać.",
            "Leniwiec spędza 90% swojego życia wisząc do góry nogami."
        ];
        const randomFact = facts[Math.floor(Math.random() * facts.length)];
        message.channel.send(randomFact);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!update')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply("Nie masz uprawnień do wysyłania aktualizacji.");
        }

        const updateMessage = message.content.slice(8);
        await message.channel.send(`🔔 **Aktualizacja:** ${updateMessage}`);
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!ticket')) {
        const ticketDescription = message.content.slice(8).trim();
        if (!ticketDescription) return message.reply("Podaj opis biletu.");

        
        const channelName = `ticket-${message.author.username.replace(/[^a-zA-Z0-9-]/g, '')}-${Date.now()}`;
        
        try {
           
            const ticketChannel = await message.guild.channels.create(channelName, {
                type: 'GUILD_TEXT',
                permissionOverwrites: [
                    {
                        id: message.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: message.author.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    },
                ],
            });

            await ticketChannel.send(`Bilet od ${message.author.username}:\n${ticketDescription}`);
            await ticketChannel.send("Aby zamknąć bilet, użyj komendy `!close`.");
            await message.reply(`Stworzono bilet: ${ticketChannel}`);
        } catch (error) {
            console.error("Błąd przy tworzeniu biletu:", error);
            await message.reply("Wystąpił błąd podczas tworzenia biletu.");
        }
    }
});



client.on('messageCreate', async (message) => {
    if (message.content.toLowerCase() === '!close') {
        if (!message.channel.name.startsWith('ticket-')) {
            return message.reply("Ta komenda działa tylko w kanałach biletowych.");
        }

        await message.channel.send("Bilet zostanie zamknięty za 5 sekund...");
        setTimeout(async () => {
            await message.channel.delete();
        }, 5000);
    }
});


client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!ship')) {
        const args = message.content.split(' ').slice(1);
        if (args.length < 2) {
            return message.reply("Proszę podać dwie osoby, np. `!ship @user1 @user2`.");
        }

        const user1 = message.mentions.users.first();
        const user2 = message.mentions.users.last();

        if (!user1 || !user2) {
            return message.reply("Proszę oznaczyć dwie osoby.");
        }

       
        const lovePercentage = Math.floor(Math.random() * 101); 
        const loveEmbed = new EmbedBuilder()
            .setTitle("Poziom miłości")
            .setDescription(`💖 **${user1.username}** i **${user2.username}** mają poziom miłości: **${lovePercentage}%** 💖`)
            .setColor("#FF69B4");

        await message.channel.send({ embeds: [loveEmbed] });
    }
});


const userXP = new Map();

client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    const userId = message.author.id;
    if (!userXP.has(userId)) {
        userXP.set(userId, 0);
    }
    userXP.set(userId, userXP.get(userId) + 1);
    
    
    if (userXP.get(userId) === 100) {
        const role = message.guild.roles.cache.find(r => r.name === 'Aktywny');
        message.member.roles.add(role);
        message.channel.send(`${message.author}, gratulacje! Awansowałeś na poziom Aktywny!`);
    }
});

const quiz = [
    { question: "Jakie jest największe miasto w Polsce?", answer: "Warszawa" },
    { question: "Ile kontynentów jest na świecie?", answer: "7" },
    { question: "Jaką planetę nazywamy Czerwoną Planetą?", answer: "Mars" }
];

client.on('messageCreate', (message) => {
    if (message.content === '!quiz') {
        const randomQuestion = quiz[Math.floor(Math.random() * quiz.length)];
        message.channel.send(`Pytanie: ${randomQuestion.question}`);

        const filter = response => response.content.toLowerCase() === randomQuestion.answer.toLowerCase();
        message.channel.awaitMessages({ filter, max: 1, time: 10000, errors: ['time'] })
            .then(collected => message.channel.send(`Brawo ${collected.first().author}, poprawna odpowiedź!`))
            .catch(() => message.channel.send('Czas minął! Nikt nie odpowiedział poprawnie.'));
    }
});


client.on('messageCreate', (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;
  
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
  
    if (command === '!sendembed') {
      const embedMessage = args.join(' ');
      if (!embedMessage) {
        return message.reply('Podaj wiadomość do wysłania w embedzie.');
      }
  
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Wiadomość Embed')
        .setDescription(embedMessage)
        .setTimestamp();
  
      message.channel.send({ embeds: [embed] });
    }
  });


// Event, który reaguje na dołączenie nowego użytkownika
client.on('guildMemberAdd', async (member) => {
  // Wybierz kanał, do którego chcesz wysłać powitanie (wstaw ID kanału)
  const channel = member.guild.channels.cache.get('1312345676342');
  
  if (channel) {
    // Tworzymy embed z wiadomością powitalną i profilowym użytkownika
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Witaj na serwerze!')
      .setDescription(`Cześć ${member.user.username}! Miło nam Cię powitać 🎉`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))  // Dodaje profilowe użytkownika

    await channel.send({ embeds: [welcomeEmbed] });
  }
});
  
client.on('guildMemberRemove', async (member) => {
    console.log(`${member.user.tag} opuścił serwer.`); // Log opuszczenia użytkownika
  
    const channel = member.guild.channels.cache.get(LEAVE_CHANNEL_ID);
    if (!channel) {
      console.error('Nie znaleziono kanału pożegnalnego. Sprawdź ID kanału.');
      return;
    }
  
    try {
      const farewellEmbed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Do zobaczenia!')
        .setDescription(`Żegnaj, ${member.user.username}!`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }));
  
      await channel.send({ embeds: [farewellEmbed] });
      console.log('Wiadomość pożegnalna została wysłana.');
    } catch (error) {
      console.error('Błąd podczas wysyłania wiadomości pożegnalnej:', error);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.customId === '!verify') {
            console.log(interaction.member);  // Sprawdzenie, czy member jest poprawny

            const role = interaction.guild.roles.cache.find(r => r.name === 'zweryfikowany/a');
            if (!role) return interaction.reply({ content: "Nie znaleziono roli 'zweryfikowany/a'.", ephemeral: true });

            try {
                await interaction.member.roles.add(role);
                await interaction.reply({ content: "Nadano ci rolę zweryfikowany/a!", ephemeral: true });
            } catch (error) {
                console.error(error);  // Sprawdzenie błędów w konsoli
                await interaction.reply({ content: "Wystąpił błąd podczas próby nadania roli.", ephemeral: true });
            }
        }
    }
});

client.login(token);
