import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../public/equipment/manifest.json";
import inventory from "./equipment-inventory.json";
import { getEquipmentImage } from "./equipment-images";

/** Read the JPEG frame itself; manifest dimensions are not the test oracle. */
function jpegDimensions(bytes: Buffer) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error("Arquivo não possui assinatura JPEG.");
  }
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("Marcador JPEG inválido.");
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) {
      throw new Error("Segmento JPEG truncado.");
    }
    if (marker === 0xc0 || marker === 0xc2) {
      if (length < 8) throw new Error("Quadro JPEG truncado.");
      return {
        width: bytes.readUInt16BE(offset + 5),
        height: bytes.readUInt16BE(offset + 3),
      };
    }
    offset += length;
  }
  throw new Error("Quadro de dimensões JPEG não encontrado.");
}

describe("Spec 002 CA-07 / Spec 003 CA-10 — conjunto real de fotos Pixabay", () => {
  it("contém os doze patrimônios, fotos e hashes distintos com revisão e proveniência", () => {
    expect(manifest.provider).toBe("pixabay");
    expect(manifest.images).toHaveLength(12);
    expect(manifest.images.map((image) => image.assetTag).sort()).toEqual(
      inventory.map((equipment) => equipment.assetTag).sort(),
    );
    for (const field of ["photoId", "sourceSha256", "sha256"] as const) {
      expect(new Set(manifest.images.map((image) => image[field])).size).toBe(
        12,
      );
    }
    for (const image of manifest.images) {
      expect(image.reviewApproved).toBe(true);
      expect(image.reviewer.trim()).not.toBe("");
      expect(Number.isFinite(Date.parse(image.reviewedAt))).toBe(true);
      expect(image.photographer.trim()).not.toBe("");
      expect(image.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(image.licenseUrl).toBe(
        "https://pixabay.com/service/license-summary/",
      );
      const source = new URL(image.sourceUrl);
      const author = new URL(image.photographerUrl);
      expect(source.origin).toBe("https://pixabay.com");
      expect(source.pathname).toContain(String(image.photoId));
      expect(author.origin).toBe("https://pixabay.com");
      expect(author.pathname).toMatch(/^\/users\//);
    }
  });

  it("confere SHA-256 e dimensão 800×600 nos bytes dos doze JPEG finais locais", () => {
    for (const image of manifest.images) {
      const bytes = readFileSync(
        path.resolve("public/equipment", `${image.assetTag}.jpg`),
      );
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(
        image.sha256,
      );
      expect(jpegDimensions(bytes)).toEqual({ width: 800, height: 600 });
      expect({ width: image.width, height: image.height }).toEqual({
        width: 800,
        height: 600,
      });
    }
  });

  it("mapeia cada patrimônio para metadados e destino Storage esperados sem consulta remota", () => {
    for (const image of manifest.images) {
      expect(getEquipmentImage(image.assetTag)).toEqual(image);
      const destination = new URL(image.src);
      expect(destination.origin).toBe(
        "https://elyivfytdbplvnfxhpqw.supabase.co",
      );
      expect(destination.pathname).toBe(
        `/storage/v1/object/public/equipment/${image.assetTag}.jpg`,
      );
      expect(destination.search).toBe("");
      expect(destination.username).toBe("");
      expect(destination.password).toBe("");
    }
    expect(getEquipmentImage("TI-9999")).toBeUndefined();
  });
});
