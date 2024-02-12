import { z } from "zod"
import { FastifyInstance } from "fastify"
import { randomUUID } from "crypto"
import { prisma } from "../../lib/prisma"
import { redis } from "../../lib/redis"

export async function voteOnPoll(app: FastifyInstance) {
    app.post("/polls/vote/:pollId", async (request, reply) => {
        const params = z.object({
            pollId: z.string().uuid(),
        })

        const body = z.object({
            pollOptionId: z.string().uuid(),
        })

        const { pollId } = params.parse(request.params)
        const { pollOptionId } = body.parse(request.body)

        let { sessionId } = request.cookies
        if(sessionId) {
            const previousVote = await prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId,
                    }
                }
            })

            if(previousVote && previousVote.pollOptionId !== pollOptionId) {
                await prisma.vote.delete({
                    where: {
                        id: previousVote.id,
                    }
                })
                await redis.zincrby(pollId, -1, previousVote.pollOptionId)
            }
            else if(previousVote) {
                return reply.status(400).send({ message: "You already voted on this poll" })
            }
        }

        if(!sessionId) {
            sessionId = randomUUID()
            reply.setCookie("sessionId", sessionId, {
                path: "/",
                maxAge: 60*60*24*30, // 30 days
                signed: true,
                httpOnly: true,
            })
        }

        await prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            }
        })

        await redis.zincrby(pollId, 1, pollOptionId)

        return reply.status(201).send()
    })
}