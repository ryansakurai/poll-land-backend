import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { fastifyWebsocket } from "@fastify/websocket";
import postUsersEndPoint from "./endpoints/users/create-user.js";
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

app.register(postUsersEndPoint);
app.register(getPoll);
app.register(getLivePollResults);
app.register(createPoll);
app.register(voteOnPoll);

app.listen({ port: 3333 }).then(() => {
    console.log("Server is running on port 3333");
});
