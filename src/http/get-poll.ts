import { z } from "zod";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";


const paramType = z.object({
    pollId: z.string().uuid(),
});

/**
 * @todo std errors
 */
const getPoll = async (app: FastifyInstance) => {
    app.get("/polls/:pollId", async (request, reply) => {
        const paramParseReturn = paramType.safeParse(request.params);
        if(!paramParseReturn.success) {
            return reply.status(422).send({
                code: "invalidParams",
                details: "Request parameters are in incorrect format.",
            });
        }
        const { pollId } = paramParseReturn.data;

        const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            },
            include: {
                options: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        if(!poll) {
            return reply.status(404).send({
                code: "resourceNotFound",
                details: "The poll was not found.",
            });
        }

        const rawVoteList = await redis.zrange(pollId, 0, -1, "WITHSCORES");
        const voteList = rawVoteList.reduce((outputObj, element, idx) => {
            if(idx % 2 == 0) { // even is key and odd is value
                const score = rawVoteList[idx + 1];
                Object.assign(outputObj, { [element]: Number(score) });
            }
            return outputObj;
        }, {} as Record<string, number>);

        return reply.status(200).send({
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map(option => {
                    return {
                        id: option.id,
                        title: option.title,
                        score: option.id in voteList ? voteList[option.id] : 0,
                    };
                }),
            },
        });
    });
};

export { getPoll };
