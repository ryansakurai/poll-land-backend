import { FastifyInstance } from "fastify";
import z from "zod";
import { votesPubSub } from "../utils/votes-pub-sub";

export async function getLivePollResults(app: FastifyInstance) {
    app.get("/polls/:pollId/liveResults", { websocket: true }, (connection, request) => {
        const getPollParams = z.object({
            pollId: z.string().uuid()
        });

        const { pollId } = getPollParams.parse(request.params);

        votesPubSub.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message));
        });
    });
}
