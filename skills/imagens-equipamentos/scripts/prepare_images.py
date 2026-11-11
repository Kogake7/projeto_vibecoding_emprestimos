"""Preparo local de fotos Pixabay. Rede somente GET; nunca publica no Storage."""

from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import time
from datetime import datetime, timezone
from urllib import error, parse, request

from PIL import Image, ImageOps


REPO_ROOT = Path(__file__).resolve().parents[3]
ASSET_TAGS = {f"TI-{number:04d}" for number in range(1, 13)}
LICENSE_URL = "https://pixabay.com/service/license-summary/"
API_URL = "https://pixabay.com/api/"
CACHE_SECONDS = 24 * 60 * 60
MAX_RESPONSE_BYTES = 4 * 1024 * 1024
MAX_IMAGE_BYTES = 25 * 1024 * 1024
CHECKS = {"people", "brands", "logos", "text", "screenContent"}


class PreparationError(Exception):
    """Mensagem segura para o terminal: não contém corpo HTTP ou credencial."""


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        raise PreparationError("Não foi possível ler um arquivo JSON necessário.") from None


def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def external_path(value: str | Path) -> Path:
    path = Path(value).expanduser().resolve()
    if path.is_relative_to(REPO_ROOT) or str(path).startswith("\\\\"):
        raise PreparationError("Use um caminho local fora do repositório para chave, cache e pacote.")
    return path


def read_key(path: Path) -> str:
    try:
        raw = external_path(path).read_text(encoding="utf-8-sig").strip()
    except OSError:
        raise PreparationError("Arquivo de credencial ausente; obtenha a chave na API Pixabay.") from None
    if raw.startswith("{"):
        try:
            value = json.loads(raw)
            key = value.get("apiKey") if isinstance(value, dict) else None
        except ValueError:
            key = None
    else:
        key = raw
    if not isinstance(key, str) or not re.fullmatch(r"[A-Za-z0-9_-]{8,200}", key):
        raise PreparationError("Arquivo de credencial ausente ou inválido; obtenha a chave na API Pixabay.")
    return key


def pixabay_url(value: str, *, download: bool = False) -> str:
    if not isinstance(value, str):
        raise PreparationError("URL Pixabay inválida.")
    url = parse.urlsplit(value)
    allowed = {"pixabay.com", "cdn.pixabay.com"} if download else {"pixabay.com"}
    query_keys = {key.lower() for key, _ in parse.parse_qsl(url.query)}
    if (
        url.scheme != "https"
        or url.hostname not in allowed
        or url.username
        or url.password
        or url.port not in (None, 443)
        or query_keys.intersection({"key", "api_key", "apikey", "token"})
    ):
        raise PreparationError("URL fora da origem Pixabay permitida.")
    return value


class SafeRedirect(request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        pixabay_url(newurl, download=True)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def http_get(url: str, limit: int) -> bytes:
    """Único caminho de rede. Nunca aceita método ou host de upload."""
    parsed = parse.urlsplit(url)
    if not (parsed.scheme == "https" and parsed.hostname == "pixabay.com" and parsed.path == "/api/" and not parsed.username and not parsed.password):
        pixabay_url(url, download=True)
    try:
        response = request.build_opener(SafeRedirect()).open(
            request.Request(url, method="GET", headers={"User-Agent": "EmpresTI-local-photo-prep/1"}),
            timeout=30,
        )
        with response:
            data = response.read(limit + 1)
        if len(data) > limit:
            raise PreparationError("Resposta excedeu o limite permitido.")
        return data
    except error.HTTPError as exc:
        raise PreparationError(f"Pixabay respondeu HTTP {exc.code}; nenhuma credencial foi exibida.") from None
    except (error.URLError, TimeoutError, OSError, ValueError):
        raise PreparationError("Não foi possível obter a resposta do Pixabay.") from None


def normalize_hit(hit: dict) -> dict:
    try:
        photo_id = int(hit["id"])
        author_id = int(hit["user_id"])
        photographer = hit["user"]
        if photo_id < 1 or author_id < 1 or hit["type"] != "photo" or not photographer:
            raise ValueError
        normalized = {
            "photoId": photo_id,
            "sourceUrl": pixabay_url(hit["pageURL"]),
            "photographer": photographer,
            "photographerUrl": f"https://pixabay.com/users/{parse.quote(photographer, safe='')}-{author_id}/",
            "licenseUrl": LICENSE_URL,
            "downloadUrl": pixabay_url(hit["largeImageURL"], download=True),
            "width": int(hit["imageWidth"]),
            "height": int(hit["imageHeight"]),
        }
        if hit.get("previewURL"):
            normalized["previewUrl"] = pixabay_url(hit["previewURL"], download=True)
        return normalized
    except (KeyError, ValueError, TypeError):
        raise PreparationError("Resultado Pixabay incompleto ou incompatível com fotografias.") from None


def search_photos(work_dir: Path, credentials_file: Path, query: str, *, page=1, now=None) -> dict:
    work_dir = external_path(work_dir)
    if not query.strip() or len(query) > 100:
        raise PreparationError("A busca precisa ter entre 1 e 100 caracteres.")
    parameters = {"q": query.strip(), "image_type": "photo", "safesearch": "true", "per_page": 20, "min_width": 800, "min_height": 600}
    if not 1 <= page <= 25:
        raise PreparationError("Página de busca fora do intervalo de 1 a 25.")
    if page != 1:
        parameters["page"] = page
    cache = work_dir / "cache" / f"{sha256(json.dumps(parameters, sort_keys=True).encode())}.json"
    current = time.time() if now is None else now
    if cache.exists():
        saved = read_json(cache)
        if 0 <= current - saved.get("savedAt", 0) < CACHE_SECONDS:
            return saved
    key = read_key(credentials_file)
    payload = http_get(API_URL + "?" + parse.urlencode({**parameters, "key": key}), MAX_RESPONSE_BYTES)
    try:
        response = json.loads(payload)
        result = {"savedAt": current, "query": query.strip(), "page": page, "hits": [normalize_hit(hit) for hit in response["hits"]]}
    except (ValueError, TypeError, KeyError):
        raise PreparationError("Resposta da API inválida.") from None
    if key in json.dumps(result):
        raise PreparationError("Resposta recusada por conter material de credencial.")
    write_json(cache, result)
    return result


def cached_photo(work_dir: Path, photo_id: int, *, now=None) -> dict:
    current = time.time() if now is None else now
    for cache in sorted((work_dir / "cache").glob("*.json")):
        value = read_json(cache)
        if not 0 <= current - value.get("savedAt", 0) < CACHE_SECONDS:
            continue
        for hit in value.get("hits", []):
            if hit.get("photoId") == photo_id:
                return hit
    raise PreparationError("Foto não encontrada em busca válida de 24 horas; execute search novamente.")


def download_photo(work_dir: Path, photo_id: int) -> dict:
    work_dir = external_path(work_dir)
    hit = cached_photo(work_dir, photo_id)
    destination = work_dir / "originals" / f"{photo_id}.jpg"
    metadata = destination.with_suffix(".json")
    if destination.exists() and metadata.exists():
        saved = read_json(metadata)
        if saved.get("sha256") == sha256(destination.read_bytes()):
            return saved
        raise PreparationError("Original existente divergiu do hash; preservar e investigar antes de substituir.")
    if destination.exists() or metadata.exists():
        raise PreparationError("Original existente sem par de metadados íntegro; preservar e investigar.")
    data = http_get(pixabay_url(hit["downloadUrl"], download=True), MAX_IMAGE_BYTES)
    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()
    except (OSError, ValueError):
        raise PreparationError("O arquivo baixado não é uma imagem válida.") from None
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    saved = {**{key: value for key, value in hit.items() if key != "downloadUrl"}, "sha256": sha256(data)}
    write_json(metadata, saved)
    return saved


def render_jpeg(data: bytes, crop=None) -> bytes:
    try:
        with Image.open(io.BytesIO(data)) as original:
            photo = ImageOps.exif_transpose(original).convert("RGB")
            if crop is not None:
                if not isinstance(crop, list) or len(crop) != 4 or any(type(value) is not int for value in crop) or not (0 <= crop[0] < crop[2] <= photo.width and 0 <= crop[1] < crop[3] <= photo.height):
                    raise PreparationError("Caixa de recorte inválida para o original orientado.")
                photo = photo.crop(tuple(crop))
            if photo.width < 800 or photo.height < 600:
                raise PreparationError("A foto original precisa ter no mínimo 800×600; não ampliar.")
            photo.thumbnail((800, 600), Image.Resampling.LANCZOS)
            canvas = Image.new("RGB", (800, 600), "white")
            canvas.paste(photo, ((800 - photo.width) // 2, (600 - photo.height) // 2))
            output = io.BytesIO()
            canvas.save(output, format="JPEG", quality=92, subsampling=0, optimize=False)
            return output.getvalue()
    except (OSError, ValueError):
        raise PreparationError("Não foi possível transformar a imagem original.") from None


def public_base(value: str) -> str:
    parsed = parse.urlsplit(value)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or "/storage/v1/object/public/" not in parsed.path:
        raise PreparationError("Informe a URL pública HTTPS do bucket Storage, sem credenciais ou query.")
    return value.rstrip("/") + "/"


def validate_selection(selection) -> list:
    if not isinstance(selection, list) or len(selection) != 12:
        raise PreparationError("A seleção precisa conter exatamente doze patrimônios.")
    try:
        if {entry["assetTag"] for entry in selection} != ASSET_TAGS:
            raise ValueError
        if len({entry["photoId"] for entry in selection}) != 12:
            raise ValueError
        if len({entry["sourceSha256"] for entry in selection}) != 12:
            raise ValueError
        for entry in selection:
            if not isinstance(entry["photoId"], int) or entry["photoId"] < 1 or not re.fullmatch(r"[a-f0-9]{64}", entry["sourceSha256"]) or not isinstance(entry["alt"], str) or not entry["alt"].strip():
                raise ValueError
            if "crop" in entry and (entry["assetTag"] != "TI-0007" or not isinstance(entry.get("cropReason"), str) or not entry["cropReason"].strip()):
                raise ValueError
    except (KeyError, TypeError, ValueError):
        raise PreparationError("Seleção inválida: conferir patrimônios, IDs, hashes distintos e textos alternativos.") from None
    return selection


def prepare_package(work_dir: Path, selection, output_dir: Path, public_base_url: str) -> dict:
    work_dir = external_path(work_dir)
    output_dir = external_path(output_dir)
    selection = validate_selection(selection)
    base = public_base(public_base_url)
    rendered = []
    entries = []
    for entry in sorted(selection, key=lambda item: item["assetTag"]):
        source = work_dir / "originals" / f"{entry['photoId']}.jpg"
        metadata = read_json(source.with_suffix(".json"))
        try:
            data = source.read_bytes()
        except OSError:
            raise PreparationError("Original selecionado ausente; execute download.") from None
        if sha256(data) != entry["sourceSha256"] or metadata.get("sha256") != entry["sourceSha256"] or metadata.get("photoId") != entry["photoId"]:
            raise PreparationError("Original selecionado mudou depois da inspeção.")
        final = render_jpeg(data, entry.get("crop"))
        final_name = f"{entry['assetTag']}.jpg"
        rendered.append((final_name, final))
        entries.append({
            "assetTag": entry["assetTag"], "src": base + final_name, "alt": entry["alt"],
            "photoId": entry["photoId"], "sourceUrl": pixabay_url(metadata["sourceUrl"]),
            "photographer": metadata["photographer"], "photographerUrl": pixabay_url(metadata["photographerUrl"]),
            "licenseUrl": LICENSE_URL, "sourceSha256": entry["sourceSha256"], "sha256": sha256(final), "width": 800, "height": 600,
        })
        if "crop" in entry:
            entries[-1].update({"crop": entry["crop"], "cropReason": entry["cropReason"]})
    if len({entry["sha256"] for entry in entries}) != 12:
        raise PreparationError("Fotos finais repetidas; selecionar fotografias distintas.")
    manifest = {"version": 1, "provider": "pixabay", "images": entries}
    previous = output_dir / "manifest.draft.json"
    if previous.exists() and read_json(previous) != manifest:
        raise PreparationError("Metadados do pacote existente mudariam; use novo diretório para preservar revisões.")
    # Todos os inputs são conferidos antes de escrever qualquer arquivo do pacote.
    for name, data in rendered:
        destination = output_dir / name
        if destination.exists() and destination.read_bytes() != data:
            raise PreparationError("Pacote existente contém foto diferente; use novo diretório para preservar o anterior.")
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, data in rendered:
        (output_dir / name).write_bytes(data)
    write_json(output_dir / "manifest.draft.json", manifest)
    return manifest


def valid_timestamp(value) -> bool:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.tzinfo is not None and parsed <= datetime.now(timezone.utc)
    except (ValueError, TypeError, AttributeError):
        return False


def check_package(manifest: dict, package_dir: Path, *, approved: bool):
    try:
        images = manifest["images"]
        if manifest["version"] != 1 or manifest["provider"] != "pixabay" or len(images) != 12 or {entry["assetTag"] for entry in images} != ASSET_TAGS:
            raise ValueError
        for key in ("photoId", "sha256", "src"):
            if len({entry[key] for entry in images}) != 12:
                raise ValueError
        for entry in images:
            data = (package_dir / f"{entry['assetTag']}.jpg").read_bytes()
            public_base(entry["src"].rsplit("/", 1)[0] + "/")
            pixabay_url(entry["sourceUrl"])
            pixabay_url(entry["photographerUrl"])
            if sha256(data) != entry["sha256"] or not re.fullmatch(r"[a-f0-9]{64}", entry["sourceSha256"]) or entry["licenseUrl"] != LICENSE_URL or not entry["photographer"] or not entry["alt"] or not parse.urlsplit(entry["src"]).path.endswith(f"/{entry['assetTag']}.jpg"):
                raise ValueError
            if "crop" in entry and (entry["assetTag"] != "TI-0007" or not entry.get("cropReason") or not isinstance(entry["crop"], list) or len(entry["crop"]) != 4 or any(type(value) is not int for value in entry["crop"])):
                raise ValueError
            with Image.open(io.BytesIO(data)) as image:
                if image.size != (800, 600) or image.format != "JPEG" or (entry["width"], entry["height"]) != (800, 600):
                    raise ValueError
            if approved and (entry.get("reviewApproved") is not True or not entry.get("reviewer") or not valid_timestamp(entry.get("reviewedAt"))):
                raise ValueError
    except (KeyError, TypeError, ValueError, OSError):
        raise PreparationError("Pacote incompleto, alterado ou sem aprovação visual válida.") from None


def finalize_package(package_dir: Path, reviews_data) -> dict:
    package_dir = external_path(package_dir)
    manifest = read_json(package_dir / "manifest.draft.json")
    check_package(manifest, package_dir, approved=False)
    reviews = reviews_data.get("reviews") if isinstance(reviews_data, dict) else reviews_data
    if not isinstance(reviews, list) or len(reviews) != 12:
        raise PreparationError("São necessárias doze revisões dos JPEGs finais.")
    try:
        if isinstance(reviews_data, dict):
            if set(reviews_data) - {"reviews", "rejections"}:
                raise ValueError
            rejections = reviews_data.get("rejections", [])
            if not isinstance(rejections, list):
                raise ValueError
            for rejection in rejections:
                if set(rejection) != {"photoId", "reason", "reviewedAt"} or type(rejection["photoId"]) is not int or rejection["photoId"] < 1 or not isinstance(rejection["reason"], str) or not rejection["reason"].strip() or not valid_timestamp(rejection["reviewedAt"]):
                    raise ValueError
        by_tag = {entry["assetTag"]: entry for entry in reviews}
        if set(by_tag) != ASSET_TAGS:
            raise ValueError
        for entry in manifest["images"]:
            review = by_tag[entry["assetTag"]]
            checks = review["checks"]
            if set(review) != {"assetTag", "sha256", "reviewer", "reviewedAt", "approved", "checks"} or review.get("approved") is not True or review.get("sha256") != entry["sha256"] or not isinstance(review.get("reviewer"), str) or not review["reviewer"].strip() or not valid_timestamp(review.get("reviewedAt")) or set(checks) != CHECKS or any(value is not False for value in checks.values()):
                raise ValueError
            reviewed_at = datetime.fromisoformat(review["reviewedAt"].replace("Z", "+00:00")).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
            entry.update({"reviewer": review["reviewer"], "reviewedAt": reviewed_at, "reviewApproved": True})
    except (KeyError, TypeError, ValueError):
        raise PreparationError("Revisão recusada: problemas visuais, hash divergente, data ou identificação inválidos.") from None
    check_package(manifest, package_dir, approved=True)
    write_json(package_dir / "manifest.json", manifest)
    write_json(package_dir / "review-log.json", reviews_data)
    return manifest


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    commands = result.add_subparsers(dest="command", required=True)
    search = commands.add_parser("search")
    search.add_argument("--credentials-file", type=Path, required=True)
    search.add_argument("--work-dir", type=Path, required=True)
    search.add_argument("--query", required=True)
    search.add_argument("--page", type=int, default=1)
    inventory = commands.add_parser("search-inventory")
    inventory.add_argument("--credentials-file", type=Path, required=True)
    inventory.add_argument("--work-dir", type=Path, required=True)
    download = commands.add_parser("download")
    download.add_argument("--work-dir", type=Path, required=True)
    download.add_argument("--photo-id", type=int, required=True)
    prepare = commands.add_parser("prepare")
    prepare.add_argument("--work-dir", type=Path, required=True)
    prepare.add_argument("--selection", type=Path, required=True)
    prepare.add_argument("--output-dir", type=Path, required=True)
    prepare.add_argument("--public-base-url", required=True)
    finalize = commands.add_parser("finalize")
    finalize.add_argument("--package-dir", type=Path, required=True)
    finalize.add_argument("--reviews", type=Path, required=True)
    validate = commands.add_parser("validate")
    validate.add_argument("--package-dir", type=Path, required=True)
    return result


def main(argv=None) -> int:
    args = parser().parse_args(argv)
    try:
        if args.command == "search":
            result = search_photos(args.work_dir, args.credentials_file, args.query, page=args.page)
            for hit in result["hits"]:
                print(f"{hit['photoId']} | {hit['photographer']} | {hit['sourceUrl']}")
            print(f"{len(result['hits'])} candidatos; origem: Pixabay. Cache local por 24 horas.")
        elif args.command == "search-inventory":
            inventory = read_json(REPO_ROOT / "src/shared/equipment-inventory.json")
            queries = list(dict.fromkeys(item["search"] for item in inventory))
            for index, query in enumerate(queries):
                result = search_photos(args.work_dir, args.credentials_file, query)
                print(f"Busca {index + 1}/{len(queries)}: {query}")
                for hit in result["hits"]:
                    print(f"{hit['photoId']} | {hit['photographer']} | {hit['sourceUrl']}")
                # Um lote limitado do inventário fixo, sem downloads em massa.
                if index < len(queries) - 1:
                    time.sleep(0.7)
            print("Resultados locais com crédito Pixabay; selecionar candidatos antes de baixar.")
        elif args.command == "download":
            result = download_photo(args.work_dir, args.photo_id)
            print(f"Original {result['photoId']} salvo localmente; SHA-256 {result['sha256']}.")
        elif args.command == "prepare":
            prepare_package(args.work_dir, read_json(args.selection), args.output_dir, args.public_base_url)
            print("Doze JPEGs e rascunho preparados. Falta inspeção dos arquivos finais e finalize.")
        elif args.command == "finalize":
            finalize_package(args.package_dir, read_json(args.reviews))
            print("Manifesto local finalizado. Nenhum arquivo foi enviado ao Storage.")
        elif args.command == "validate":
            package = external_path(args.package_dir)
            check_package(read_json(package / "manifest.json"), package, approved=True)
            print("Doze JPEGs, hashes, URLs e revisões válidos. Upload e conferência pública são humanos.")
        return 0
    except PreparationError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    except (OSError, ValueError, TypeError, KeyError):
        print("Não foi possível concluir o preparo local; conferir os arquivos sem expor credenciais.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
