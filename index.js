const {Client,Intents,Collection} = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_VOICE_STATES] });
const {token} = require('./config.json');
const fs = require('fs');

client.commands = new Collection();
client.login(token)
client.once('ready', async() => {
    console.log("ready!");
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isCommand()) {
        return;
    }
    if(!client.command.has(interaction.commandName)) {
        return;
    }
    const command = client.command.get(interaction.commandName);
    try{
        await command.execute(interaction);
    }catch(error){
        console.log("error");
    }
})

client.on('voiceStateUpdate', async(oS, nS) => {
    const { member, guild } = oS;
    const newChannel = nS.channel;
    const oldChannel = oS.channel;
    if (oldChannel !== newChannel && newChannel !== null) {
        let jsonData = {
            id : member.user.id,
            tag : member.user.tag,
            nickname : member.nickname != null ? member.nickname : member.user.username
        }
        let now = new Date();
        let exists = fs.existsSync("./voiceLog/" + guild.id + "_" + toStringByFormatting(now) + ".txt");
        if(exists) {
            let voiceLog = fs.readFileSync("./voiceLog/" + guild.id + "_" + toStringByFormatting(now) + ".txt");
            if(voiceLog.indexOf(member.user.id) == -1) {
                fs.writeFileSync("./voiceLog/" + guild.id + "_" + toStringByFormatting(now) + ".txt", JSON.stringify(jsonData) + "\n", { flag: 'a+' });
            }
        } else {
            fs.writeFileSync("./voiceLog/" + guild.id + "_" + toStringByFormatting(now) + ".txt", JSON.stringify(jsonData) + "\n", { flag: 'a+' });
        }
    }
})

client.on('messageCreate', async(message) => {
    if (message.content.startsWith("!미접자확인 ")) {
        if (message.member.roles.cache.get("1007173291720572928") === undefined && message.member.user.id !="363598825216016394") {
            await message.reply(`관리자만 사용 가능한 기능입니다.`);
            return;
        }
        let days = parseInt(message.content.slice("!미접자확인 ".length));
        if (days > 14) {
            await message.reply(`최대 14일까지만 조회 가능합니다.`);
            return;
        }
        let now = new Date();
        let result = ``;
        let memberMap
        await message.guild.members.fetch().then(members => {
            memberMap = members;
        });
        let memberList = Array.from(memberMap.keys());
        for (let i = 0; i < memberList.length; i++) {
            let roleMap = memberMap.get(memberList[i]).roles.cache;
            let roleList =  Array.from(roleMap.values());
            let notGuildMember = true;
            for(let j = 0; j < roleList.length; j++) {
                if(roleList[j].name == "길드원") {
                    notGuildMember = false;
                    break;
                }
            }
            if(notGuildMember) {
                memberMap.delete(memberList[i]);
            }
        }
        for (let i = 0; i <= days; i++) {
            let exists = fs.existsSync("./voiceLog/" + message.guild.id + "_" + toStringByFormatting(now) + ".txt");
            if(exists) {
                let voiceLog = fs.readFileSync("./voiceLog/" + message.guild.id + "_" + toStringByFormatting(now) + ".txt");
                for (let j = 0; j < memberList.length; j++) {
                    if(voiceLog.indexOf(memberList[j]) > -1) {
                        memberMap.delete(memberList[j]);
                    } 
                }
            }
            now.setHours(-24,0,0,0);
        }
        let userList = Array.from(memberMap.values());
        for (let i = 0; i < userList.length; i++) {
            //result = result + `- <@${userList[i].user.id}> (${userList[i].nickname})\n`;
            result = result + `- ${userList[i].nickname != null ? userList[i].nickname : userList[i].user.username}\n`;
        }
        let now2 = new Date();
        now2.setHours(-24*days,0,0,0);
        let month = now2.getMonth() +  1;
        let date = now2.getDate();
        let resultMessage = days + `일간(` + month + `월 ` + date + `일 부터) 미참여 인원: \n${result}`;
        await message.reply(resultMessage);

        let time = new Date();
        let jd = {
            date : time.toString(),
            tag : message.member.user.tag,
            result : resultMessage
        }
        fs.writeFileSync("./voiceLog/result.txt", JSON.stringify(jd) + "\n", { flag: 'a+' });
    }
})

function leftPad(value) {
    if (value >= 10) {
        return value;
    }
    return `0${value}`;
}

function toStringByFormatting(source, delimiter = '-') {
    const year = source.getFullYear();
    const month = leftPad(source.getMonth() + 1);
    const day = leftPad(source.getDate());
    return [year, month, day].join(delimiter);
}