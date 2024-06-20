import 'dotenv/config'
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { fastifyWebsocket } from "@fastify/websocket";
import fastifyJwt from "@fastify/jwt";
import postUsersEndPoint from "./endpoints/users/create-user.js";
import loginEndPoint from "./endpoints/users/login/login.js"
import { createPoll } from "./endpoints/polls/create-poll.js";
import { getPoll } from "./endpoints/polls/get-poll.js";
import { voteOnPoll } from "./endpoints/polls/vote-on-poll.js";
import { getLivePollResults } from "./endpoints/polls/get-live-poll-results.js";

const app = Fastify();
app.register(cookie, {
    secret: "poll-system",
    hook: "onRequest",
});
app.register(fastifyWebsocket);
app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
});

app.register(postUsersEndPoint);
app.register(loginEndPoint);
app.register(getPoll);
app.register(getLivePollResults);
app.register(createPoll);
app.register(voteOnPoll);

app.listen({ port: 3333 }).then(() => {
    console.log("Server is running on port 3333");
});
