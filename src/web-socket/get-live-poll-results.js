import z from "zod";
import { votesPubSub } from "../utils/votes-pub-sub.js";


const paramType = z.object({
    pollId: z.string().uuid(),
});

const getLivePollResults = async (app) => {
    app.get("/polls/:pollId/liveResults", { websocket: true }, (connection, request) => {
        const paramParseReturn = paramType.safeParse(request.params);
        if(!paramParseReturn.success) {
            connection.socket.send(JSON.stringify({
                code: "invalidParams",
                details: "Request parameters are in incorrect format.",
            }));
            connection.socket.close();
            return;
        }
        const { pollId } = paramParseReturn.data;

        votesPubSub.subscribe(pollId, (message) => {
            connection.socket.send(JSON.stringify(message));
        });
    });
};

export { getLivePollResults };
