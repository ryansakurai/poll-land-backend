import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { votesPubSub } from "../../utils/votes-pub-sub.js";

/*
 *  the cookies strategy isn't perfect for enforcing unique voting,
 *  because a tech savier user would know to just clean their cookies
 */


const paramType = z.object({
    pollId: z.string().uuid(),
});
const bodyType = z.object({
    pollOptionId: z.string().uuid(),
});

/**
 * @todo std errors
 */
const voteOnPoll = async (app) => {
    app.post("/polls/vote/:pollId", async (request, reply) => {
        const paramParseReturn = paramType.safeParse(request.params);
        if(!paramParseReturn.success) {
            return reply.status(422).send({
                code: "invalidParams",
                details: "Request parameters are in incorrect format.",
            });
        }
        const { pollId } = paramParseReturn.data;

        const bodyParseReturn = bodyType.safeParse(request.body);
        if(!bodyParseReturn.success) {
            return reply.status(422).send({
                code: "invalidBody",
                details: "Request body is in incorrect format.",
            });
        }
        const { pollOptionId } = bodyParseReturn.data;

        let { sessionId } = request.cookies;
        if(sessionId) {
            const previousVote = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: { sessionId, pollId },
                },
            });

            if(previousVote && previousVote.pollOptionId !== pollOptionId) {
                deleteVote(previousVote)
            } else if(previousVote) {
                return reply.status(400).send({
                    code: "duplicateVote",
                    details: "You already voted on this poll.",
                });
            }
        } else {
            sessionId = randomUUID();
            reply.setCookie("sessionId", sessionId, {
                path: "/",
                maxAge: 30*24*60*60, // 30 days
                signed: true,
                httpOnly: true,
            });
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            },
        });

        const qtVotes = await redis.zincrby(pollId, 1, pollOptionId);
        votesPubSub.publish(pollId, {
            pollOptionId: pollOptionId,
            qtVotes: Number(qtVotes),
        });

        return reply.status(201).send();
    });
};

const deleteVote = async (vote) => {
    await prisma.vote.delete({
        where: {
            id: vote.id,
        },
    });
    const qtVotes = await redis.zincrby(vote.pollId, -1, vote.pollOptionId);

    votesPubSub.publish(vote.pollId, {
        pollOptionId: vote.pollOptionId,
        qtVotes: Number(qtVotes),
    });
}

export { voteOnPoll };
