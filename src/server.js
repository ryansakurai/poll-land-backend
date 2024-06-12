import fastify from "fastify";
import cookie from "@fastify/cookie";
import { fastifyWebsocket } from "@fastify/websocket";
import { createPoll } from "./http/create-poll.js";
import { getPoll } from "./http/get-poll.js";
import { voteOnPoll } from "./http/vote-on-poll.js";
import { getLivePollResults } from "./web-socket/get-live-poll-results.js";

const app = fastify();
app.register(cookie, {
    secret: "poll-system",
    hook: "onRequest",
});
app.register(fastifyWebsocket);

app.register(getPoll);
app.register(getLivePollResults);
app.register(createPoll);
app.register(voteOnPoll);

app.listen({ port: 3333 }).then(() => {
    console.log("Server is running on port 3333");
});
