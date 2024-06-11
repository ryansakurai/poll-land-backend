import { z } from "zod";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

// TODO: std errors
const createPoll = async (app: FastifyInstance) => {
    app.post("/polls", async (request, reply) => {
        const bodyType = z.object({
            title: z.string(),
            options: z.array(z.string()),
        });

        const result = bodyType.safeParse(request.body);
        if(!result.success) {
            return reply.status(422).send({
                code: "invalidBody",
                details: "Request body is in incorrect format.",
            });
        }

        const { title, options } = result.data;

        const poll = await prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map((optionTitle) => ({ title: optionTitle })),
                    },
                },
            },
        });

        return reply.status(201).header("Location", encodeURI(`http://localhost:3333/polls/${poll.id}`)).send();
    });
};

export { createPoll };
