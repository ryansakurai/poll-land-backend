import { z } from "zod";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function createPoll(app: FastifyInstance) {
    app.post("/polls", async (request, reply) => {
        const pollBodyType = z.object({
            title: z.string(),
            options: z.array(z.string()),
        });

        const { title, options } = pollBodyType.parse(request.body);

        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map(optionTitle => {
                            return { title: optionTitle };
                        }),
                    },
                },
            },
        });

        return reply.status(201).send(poll);
    });
}
