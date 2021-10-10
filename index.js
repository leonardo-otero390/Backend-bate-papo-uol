import express from 'express';
import cors from 'cors'
import dayjs from 'dayjs'

const app = express();
app.use(cors());
app.use(express.json());

const participants = [{ name: 'João', lastStatus: 12313123 }];
const messages = [{ from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37' }];

app.post('/participants', (req, res) => {
    const name = req.body.name;

    const isUnique = participants.find(participant => participant.name === name) === undefined;

    if (!isUnique || name === '') res.status(400); else {
        participants.push({
            name,
            lastStatus: Date.now(),
        });
        messages.push(
            { from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss') }
        );
        res.status(200);
    }
    res.send(messages);
});

app.get("/participants", (req, res) => {
    res.send(participants);
});

app.post("/messages", (req, res) => {

    const body = req.body;
    const user = req.headers.user;

    const typeIsValid = body.type === 'message' || body.type === 'private_message';
    const participantIsOn = participants.find((p) => p.name === user) !== undefined;

    if (body.to === '' || body.text === '' || !typeIsValid || !participantIsOn) {
        res.status(400);
    } else {
        messages.push(
            {
                ...body,
                from: user,
                time: dayjs().format('HH:mm:ss')
            }
        );
        res.status(200);
    }
    res.send();

});

app.get("/messages", (req, res) => {
    const user = req.headers.user;
    let limit = req.query.limit;
    if (!limit) limit = messages.length;

    const userVision = (message) => {
        return (message.from === user || message.to === user || message.to === 'Todos')
    };

    const filtered = messages.filter(userVision);
    const limited = filtered.slice(filtered.length - limit);

    res.send(JSON.stringify(limited));
})

app.listen(4000);