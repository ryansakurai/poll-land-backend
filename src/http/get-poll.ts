import { z } from "zod";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

// TODO: safe parse
// TODO: std errors
export async function getPoll(app: FastifyInstance) {
    app.get("/polls/:pollId", async (request, reply) => {
        const paramType = z.object({
            pollId: z.string().uuid(),
        });

        const { pollId } = paramType.parse(request.params);

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

        if(!poll)
            return reply.status(400).send({ message: "Poll not found." });

        const rawVoteList = await redis.zrange(pollId, 0, -1, "WITHSCORES");
        const voteList = rawVoteList.reduce((outputObj, element, idx) => {
            if (idx % 2 == 0) {
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
}
