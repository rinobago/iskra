import { Hono } from "hono";

const contactRouter = new Hono();

contactRouter.get("/", (c) => {
    return c.json({
        message: "Contact API is working!",
    });
});

contactRouter.post("/", async (c) => {
    const { name, email, message } = await c.req.json();

    if (!name || !email || !message) {
        return c.json(
            {
                success: false,
                error: "All fields are required",
            },
            400,
        );
    }

    return c.json({
        success: true,
        message: "Test submission received!",
        data: { name, email, message },
    });
});

export default contactRouter;
