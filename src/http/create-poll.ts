import { z } from "zod";
import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

const bodyType = z.object({
    title: z.string(),
    options: z.array(z.string()),
});

// TODO: std errors
const createPoll = async (app: FastifyInstance) => {
    app.post("/polls", async (request, reply) => {
        const bodyParseReturn = bodyType.safeParse(request.body);
        if(!bodyParseReturn.success) {
            return reply.status(422).send({
                code: "invalidBody",
                details: "Request body is in incorrect format.",
            });
        }
        const { title, options } = bodyParseReturn.data;

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
