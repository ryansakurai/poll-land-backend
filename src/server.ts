import fastify from "fastify"
import cookie from "@fastify/cookie"
import { createPoll } from "./http/create-poll"
import { getPoll } from "./http/get-poll"
import { voteOnPoll } from "./http/vote-on-poll"
import { fastifyWebsocket } from "@fastify/websocket"
import { getLivePollResults } from "./web-socket/get-live-poll-results"

const app = fastify()
app.register(cookie, {
    secret: "poll-system",
    hook: "onRequest",
})
app.register(fastifyWebsocket)

app.register(getPoll)
app.register(getLivePollResults)
app.register(createPoll)
app.register(voteOnPoll)

app.listen({ port: 3333 }).then(() => {
    console.log("Server is running on port 3333")
})
