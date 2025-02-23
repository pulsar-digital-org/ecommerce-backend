import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { imageCreate } from "../controllers/image";
import { authSuperHandler } from "../middleware";

const imagesRouter = new Hono().post(
  "",
  authSuperHandler,
  zValidator(
    "form",
    z.object({
      file: z.instanceof(Blob),
    }),
  ),
  async (c) => {
    const { file } = c.req.valid("form");

    console.log(file);

    const image = await imageCreate(file, c.var.user);

    c.status(200);
    return c.json({ image });
  },
);

export default imagesRouter;
