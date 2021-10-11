import express from 'express';
import cors from 'cors'
import dayjs from 'dayjs'
import { stripHtml } from "string-strip-html";
import Joi from 'joi';

const app = express();
app.use(cors());
app.use(express.json());

const SECONDS = 1000;
let participants = [{ name: 'João', lastStatus: 12313123 }];
let messages = [{ from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37' }];

function removeInactives() {
    const actives = [];
    participants.forEach(p => {
        if (Date.now() - p.lastStatus < 10 * SECONDS) actives.push(p); else messages.push(
            { from: p.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss') }
        );
    })
    participants = actives;
}

app.post('/participants', (req, res) => {

    const schema = Joi.object({
        name: Joi.string()
            .min(1)
            .required()
    })
    if (schema.validate(req.body).error !== undefined) return res.status(400).send();

    const name = stripHtml(req.body.name).result;
    const isUnique = participants.find(participant => participant.name === name) === undefined;
    if (!isUnique) return res.status(409).send();

    participants.push({
        name,
        lastStatus: Date.now(),
    });
    messages.push(
        { from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs().format('HH:mm:ss') }
    );
    res.status(200);

    res.send();
});

app.get("/participants", (req, res) => {
    res.send(participants);
});

app.post("/messages", (req, res) => {

    const { text, type, to } = req.body;
    const user = req.headers.user;

    const schema = Joi.object({
        type: Joi.string().required().valid('message', 'private_message'),
        text: Joi.string().required().min(1),
        to: Joi.string().required().min(1)
    });
    if (schema.validate(req.body).error !== undefined) return res.status(400).send();

    const participantIsOn = participants.find((p) => p.name === user) !== undefined;
    if (!participantIsOn) return res.status(400).send();
        messages.push(
            {
                type,
                to,
                text: stripHtml(text).result.trim(),
                from: user,
                time: dayjs().format('HH:mm:ss')
            }
        );
        res.status(200).send();

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

app.post("/status", (req, res) => {
    const user = req.headers.user;

    const participantData = participants.find((p) => p.name === user);

    if (participantData === undefined) res.status(400); else {
        participantData.lastStatus = Date.now();
        res.status(200);
    }
    res.send();
})

setInterval(removeInactives, 15 * SECONDS);

app.listen(4000);