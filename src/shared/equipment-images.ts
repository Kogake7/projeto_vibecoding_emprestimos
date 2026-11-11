import { z } from "zod";
import rawManifest from "../../public/equipment/manifest.json";

function isPixabayPage(value: string) {
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === "pixabay.com";
}

const imageSchema = z.object({
  assetTag: z.string().regex(/^TI-00(?:0[1-9]|1[0-2])$/),
  src: z.url().refine((value) => {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.pathname.includes("/storage/v1/object/public/") &&
      !url.search &&
      !url.username &&
      !url.password
    );
  }),
  alt: z.string().min(1),
  photoId: z.number().int().positive(),
  sourceUrl: z.url().refine(isPixabayPage),
  photographer: z.string().min(1),
  photographerUrl: z.url().refine(isPixabayPage),
  licenseUrl: z.literal("https://pixabay.com/service/license-summary/"),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  width: z.literal(800),
  height: z.literal(600),
  reviewedAt: z.iso.datetime(),
  reviewer: z.string().min(1),
  reviewApproved: z.literal(true),
  crop: z
    .tuple([
      z.number().int().nonnegative(),
      z.number().int().nonnegative(),
      z.number().int().positive(),
      z.number().int().positive(),
    ])
    .optional(),
  cropReason: z.string().min(1).optional(),
});

const manifest = z
  .object({
    version: z.literal(1),
    provider: z.literal("pixabay"),
    images: z.array(imageSchema).superRefine((images, context) => {
      for (const field of [
        "assetTag",
        "photoId",
        "sourceSha256",
        "sha256",
      ] as const) {
        if (
          new Set(images.map((image) => image[field])).size !== images.length
        ) {
          context.addIssue({ code: "custom", message: `Duplicate ${field}` });
        }
      }
      for (const image of images) {
        if (
          !new URL(image.src).pathname.endsWith(`/${image.assetTag}.jpg`) ||
          (image.crop &&
            (image.assetTag !== "TI-0007" ||
              !image.cropReason ||
              image.crop[0] >= image.crop[2] ||
              image.crop[1] >= image.crop[3])) ||
          (image.cropReason && !image.crop)
        ) {
          context.addIssue({
            code: "custom",
            message: "Invalid image mapping or crop",
          });
        }
      }
    }),
  })
  .parse(rawManifest);

export type EquipmentImage = z.infer<typeof imageSchema>;

export function getEquipmentImage(
  assetTag: string,
): EquipmentImage | undefined {
  return manifest.images.find((image) => image.assetTag === assetTag);
}
