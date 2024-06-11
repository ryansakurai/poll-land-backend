import { z } from "zod";
import { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { votesPubSub } from "../utils/votes-pub-sub";

/*
 *  the cookies strategy isn't perfect for enforcing unique voting,
 *  because a tech savier user would know to just clean their cookies
 */

// TODO: safe parse
// TODO: std errors
const voteOnPoll = async (app: FastifyInstance) => {
    app.post("/polls/vote/:pollId", async (request, reply) => {
        const paramType = z.object({
            pollId: z.string().uuid(),
        });

        const bodyType = z.object({
            pollOptionId: z.string().uuid(),
        });

        const { pollId } = paramType.parse(request.params);
        const { pollOptionId } = bodyType.parse(request.body);

        let { sessionId } = request.cookies;
        if(sessionId) {
            const previousVote = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId,
                    },
                },
            });

            if(previousVote && previousVote.pollOptionId !== pollOptionId) {
                await prisma.vote.delete({
                    where: {
                        id: previousVote.id,
                    },
                });
                const qtVotes = await redis.zincrby(pollId, -1, previousVote.pollOptionId);

                votesPubSub.publish(pollId, {
                    pollOptionId: previousVote.pollOptionId,
                    qtVotes: Number(qtVotes),
                });
            }
            else if(previousVote) {
                return reply.status(400).send({ message: "You already voted on this poll" });
            }
        }

        if(!sessionId) {
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

export { voteOnPoll };
