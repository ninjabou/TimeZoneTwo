const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
const spacetime = require('spacetime'); // Needed to avoid aneurism
const soft = require('timezone-soft'); // Needed to avoid second aneurism

const testGuildId = '618582798571405312';

const getApp = (guildId) => {
    const app = client.api.applications(client.user.id);
    if(guildId){
        app.guilds(guildId);
    }
    return app;
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.users.fetch('137006237685383168').then(dm => {
        dm.send('I\'ve started up! If this was unexpected, consider investigating, as this could indicate that I crashed!')
    })

    const commands = await getApp(testGuildId).commands.get();
    console.log(commands);

    await getApp(testGuildId).commands.post({
        data:{
            name: 'ping',
            description: 'Tests the latency between TimeZone2 and Discord.'
        }
    });

    await getApp(testGuildId).commands.post({
        data:{
            name: 'help',
            description: 'Lists each command and describes their function.'
        }
    });

    await getApp(testGuildId).commands.post({
        data:{
            name: 'now',
            description: 'Shows the current time in a given time zone.',
            options:[
                {
                    name: 'timezone',
                    description: 'The time zone you want to know the current time in.',
                    required: true,
                    type: 3
                }
            ]
        }
    });

    await getApp(testGuildId).commands.post({
        data:{
            name: 'convert',
            description: 'Converts times between two timezones.',
            options:[
                {
                    name: 'time',
                    description: 'The TIME you want to convert.',
                    required: true,
                    type: 3
                },
                {
                    name: 'timezone1',
                    description: 'The time zone to convert FROM.',
                    required: true,
                    type: 3
                },
                {
                    name: 'timezone2',
                    description: 'The time zone to convert TO.',
                    required: true,
                    type: 3
                }
            ]
        }
    });

    client.user.setPresence({
        game:{
            name: 'with slash commands! (/help)'
        },
        status:'online'
    });
});

client.ws.on('INTERACTION_CREATE', async (interaction) => {
    const {name, options} = interaction.data
    const command = name.toLowerCase();

    const args = {};
    if(options){
        for(const option of options){
            const {name, value} = option;
            args[name] = value;
        }
    }

    console.log(args);

    switch(command){
        case 'ping':
            reply(interaction, 'pong!');
            break;

        case 'now':
            if(args.timezone.toLowerCase() == 'cst'){
                args.timezone = 'America/Chicago';
            }
            if(soft(args.timezone).length > 0){
                var d = spacetime.now(soft(args.timezone)[0].iana);
                d = d.goto(soft(args.timezone)[0].iana);
                var day = d.dayName().charAt(0).toUpperCase() + d.dayName().slice(1);

                // Changes message depending on the time of day
                if(d.hour() <= 9){
                    reply(interaction, 
                        ':sunrise: It\'s `' + d.time() +
                        '` on `' + day +
                        '` in `' +  d.timezone().name +
                        '`'
                    );
                }
                if(d.hour() <= 16 && d.hour() > 9){
                    reply(interaction, 
                        ':sunny: It\'s `' + d.time() +
                        '` on `' + day +
                        '` in `' +  d.timezone().name +
                        '`'
                    );
                }
                if(d.hour() > 16){
                    reply(interaction, 
                        ':crescent_moon: It\'s `' + d.time() +
                        '` on `' + day +
                        '` in `' +  d.timezone().name +
                        '`'
                    );
                }
            } else {
                reply(interaction, 'Sorry, I couldn\'t find a timezone for `' + args.timezone + '`. Try using an different name.');
            }
            break;

        case 'convert':
            if(args.timezone1.toLowerCase() == 'cst'){
                args.timezone1 = 'America/Chicago';
            }
            if(args.timezone2.toLowerCase() == 'cst'){
                args.timezone2 = 'America/Chicago';
            }
            if(soft(args.timezone1).length > 0 && soft(args.timezone2).length > 0){
                // Checking for correct letter formatting in time.
                temp = args.time.replace(/[0-9:]/g, '');
                if(temp != ''){
                    if(temp.match(/[^apm]/g) == null){
                        if(temp.search('am') < 0 && temp.search('pm') < 0){
                            reply(interaction,
                                'Sorry, this bot only supports 12-hour and 24-hour time. (e.g. `1am`, `2:30pm`, `13`, `21:30`, `0`)'
                            );
                            break;
                        }
                    } else {
                        reply(interaction,
                            'Sorry, this bot only supports 12-hour and 24-hour time. (e.g. `1am`, `2:30pm`, `13`, `21:30`, `0`)'
                        );
                        break;
                    }
                }

                var time;
                var numbers = args.time.match(/\d+/g);

                if(numbers == null){
                    reply(interaction,
                        'Sorry, this bot only supports 12-hour and 24-hour time. (e.g. `1am`, `2:30pm`, `13`, `21:30`, `0`)'
                    );
                    break;
                }
                if(numbers[0] >= 12){
                    if(numbers[0] >= 24){
                        reply(interaction,
                            'Sorry, this bot only supports 12-hour and 24-hour time. (e.g. `1am`, `2:30pm`, `13`, `21:15`, `0`)'
                        );
                        break;
                    }
                    time = "" + (numbers[0] - 12) + ((numbers.length > 1) ? (":" + numbers[1]) : "") + "pm";
                } else {
                    time = args.time + "am";
                }

                var id = spacetime(soft(args.timezone1)[0].iana);
                id = id.goto(soft(args.timezone1)[0].iana);
                id = id.time(time);

                var d = spacetime(soft(args.timezone1)[0].iana);
                d = d.goto(soft(args.timezone1)[0].iana);
                d = d.time(time);
                d = d.goto(soft(args.timezone2)[0].iana);

                reply(interaction,
                    '`' + id.time() +
                    '` in `' + id.timezone().name +
                    '` is `' + d.time() +
                    '` in `' + d.timezone().name +
                    '`'
                );
            } else {
                reply(interaction,
                    'Sorry, I couldn\'t find a timezone for one of `' + args.timezone1 + '` and `' + args.timezone2 + '`. Try using different names.'
                );
            }
            break;

        case 'help':
            reply(interaction,
                '```' +
                'Currently, these commands are available to use:\n' +
                '/help - Lists each command and describes their function.\n' +
                '/now - Shows the current time in a given time zone.\n' +
                '/convert - Converts times between two timezones.\n' +
                '/ping - Tests the latency between TimeZone2 and Discord.' +
                '```'
            );
            break;
    }
});

const reply = (interaction, response) => {
    client.api.interactions(interaction.id, interaction.token).callback.post({
        data:{
            type: 4,
            data:{
                content: response
            }
        }
    });
}

client.on("disconnect", async = () => {
    console.log('⚠  disconnected!\nAttempting to reconnect...');
    client.login(auth.token);
});

client.login(auth.token);