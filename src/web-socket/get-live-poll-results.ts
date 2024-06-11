import { FastifyInstance } from "fastify";
import z from "zod";
import { votesPubSub } from "../utils/votes-pub-sub";

const getLivePollResults = async (app: FastifyInstance) => {
    app.get("/polls/:pollId/liveResults", { websocket: true }, (connection, request) => {
        const paramType = z.object({
            pollId: z.string().uuid(),
        });

        const { pollId } = paramType.parse(request.params);

        votesPubSub.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message));
        });
    });
};

export { getLivePollResults };
