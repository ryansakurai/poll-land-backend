import { z } from "zod";
import bcrypt from "bcrypt";
import { prisma } from "./../../../lib/prisma.js";


const bodyType = z.object({
    username: z.string(),
    password: z.string(),
});

const login = async (app) => {
    app.post("/users/login", async (request, reply) => {
        const bodyParseReturn = bodyType.safeParse(request.body);
        if(!bodyParseReturn.success) {
            return reply.status(422).send({
                code: "invalidBody",
                details: "Request body is in incorrect format.",
            });
        }
        const { username, password } = bodyParseReturn.data;

        const user = await prisma.user.findUnique({
            where: {
                username,
            },
        });
        if(!user) {
            return reply.status(404).send({
                code: "userNotFound",
                details: "There is no user with the provided username.",
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if(!passwordMatch) {
            return reply.status(403).send({
                code: "incorrectPassword",
                details: "The password for this user is incorrect.",
            });
        }

        const token = app.jwt.sign({
            id: user.id,
            username: user.username,
            email: user.email,
        });
        return reply.status(200).send({
            accessToken: token,
        });
    });
};

export default login;
