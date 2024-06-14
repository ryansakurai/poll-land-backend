import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import bcrypt from "bcrypt";


const bodyType = z.object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
});

const createUser = async (app) => {
    app.post("/users", async (request, reply) => {
        const bodyParseReturn = bodyType.safeParse(request.body);
        if(!bodyParseReturn.success) {
            return reply.status(422).send({
                code: "invalidBody",
                details: "Request body is in incorrect format.",
            });
        }
        const { username, email, password } = bodyParseReturn.data;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        return reply.status(200).header("Location", encodeURI(`http://localhost:3333/users/${user.id}`)).send();
    });
};

export default createUser;
