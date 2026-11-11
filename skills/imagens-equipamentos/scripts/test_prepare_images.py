"""Fixtures sintéticas temporárias; não são fotos reais do inventário."""

import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from PIL import Image

import prepare_images as prep


def fixture_png(color, size=(1200, 900)):
    output = io.BytesIO()
    Image.new("RGB", size, color).save(output, format="PNG")
    return output.getvalue()


class PhotoPreparationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="empresti-photo-test-")
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.work = self.base / "work"
        self.package = self.base / "package"
        self.url = "https://test-project.supabase.co/storage/v1/object/public/equipment/"

    def inputs(self):
        selection = []
        for index in range(1, 13):
            data = fixture_png((index * 17, 255 - index * 13, index * 7))
            source = self.work / "originals" / f"{index}.jpg"
            source.parent.mkdir(parents=True, exist_ok=True)
            source.write_bytes(data)
            metadata = {
                "photoId": index,
                "sha256": prep.sha256(data),
                "sourceUrl": f"https://pixabay.com/photos/test-fixture-{index}/",
                "photographer": "Synthetic test fixture only",
                "photographerUrl": "https://pixabay.com/users/test-fixture-1/",
            }
            prep.write_json(source.with_suffix(".json"), metadata)
            selection.append({"assetTag": f"TI-{index:04d}", "photoId": index, "alt": "Fixture sintética de teste", "sourceSha256": metadata["sha256"]})
        return selection

    def package_and_reviews(self):
        draft = prep.prepare_package(self.work, self.inputs(), self.package, self.url)
        reviews = [{"assetTag": entry["assetTag"], "sha256": entry["sha256"], "reviewer": "Automated fixture test, not real photo review", "reviewedAt": "2026-11-01T00:00:00Z", "approved": True, "checks": {key: False for key in prep.CHECKS}} for entry in draft["images"]]
        return draft, reviews

    def test_contains_full_photo_with_white_padding_and_no_metadata(self):
        source = fixture_png((230, 20, 30), (1600, 600))
        result = prep.render_jpeg(source)
        with Image.open(io.BytesIO(result)) as image:
            self.assertEqual(image.size, (800, 600))
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(image.getpixel((0, 0)), (255, 255, 255))
            self.assertGreater(image.getpixel((400, 300))[0], 200)
            self.assertFalse(image.getexif())

    def test_refuses_upscale(self):
        with self.assertRaisesRegex(prep.PreparationError, "não ampliar"):
            prep.render_jpeg(fixture_png((1, 2, 3), (640, 480)))

    def test_refuses_invalid_original(self):
        with self.assertRaises(prep.PreparationError):
            prep.render_jpeg(b"not an image")

    def test_credentials_are_external_and_accept_plain_file(self):
        path = self.base / "pixabay.key"
        path.write_text("synthetic-test-key", encoding="utf-8")
        self.assertEqual(prep.read_key(path), "synthetic-test-key")
        with self.assertRaises(prep.PreparationError):
            prep.read_key(prep.REPO_ROOT / "pixabay.key")

    def test_missing_key_is_actionable_and_sanitized(self):
        output = io.StringIO()
        with contextlib.redirect_stderr(output):
            exit_code = prep.main(["search", "--work-dir", str(self.work), "--credentials-file", str(self.base / "absent"), "--query", "laptop"])
        self.assertEqual(exit_code, 1)
        self.assertIn("chave", output.getvalue())
        self.assertNotIn(str(self.base), output.getvalue())

    def test_cache_24_hours_omits_key_and_avoids_duplicate_network(self):
        keyfile = self.base / "key.json"
        keyfile.write_text(json.dumps({"apiKey": "synthetic-private-key"}), encoding="utf-8")
        payload = json.dumps({"hits": [{"id": 101, "user_id": 7, "user": "TestAuthor", "type": "photo", "pageURL": "https://pixabay.com/photos/test-101/", "largeImageURL": "https://cdn.pixabay.com/photo/test.jpg", "imageWidth": 1600, "imageHeight": 1200}]}).encode()
        with patch.object(prep, "http_get", return_value=payload) as fetch:
            first = prep.search_photos(self.work, keyfile, "laptop", now=100_000)
            second = prep.search_photos(self.work, self.base / "missing-key", "laptop", now=100_100)
            self.assertEqual(fetch.call_count, 1)
            self.assertEqual(first, second)
            prep.search_photos(self.work, keyfile, "laptop", now=100_000 + prep.CACHE_SECONDS)
            self.assertEqual(fetch.call_count, 2)
        for cache in (self.work / "cache").glob("*.json"):
            self.assertNotIn("synthetic-private-key", cache.read_text(encoding="utf-8"))

    def test_http_error_never_repeats_url_or_key(self):
        error = HTTPError("https://pixabay.com/api/?key=synthetic-private-key", 429, "synthetic-private-key", {}, None)
        with patch.object(prep.request, "build_opener") as opener:
            opener.return_value.open.side_effect = error
            with self.assertRaises(prep.PreparationError) as caught:
                prep.http_get("https://pixabay.com/api/?key=synthetic-private-key", 1024)
        self.assertIn("429", str(caught.exception))
        self.assertNotIn("synthetic-private-key", str(caught.exception))
        self.assertNotIn("https://", str(caught.exception))

    def test_download_refuses_non_pixabay_and_credentials_in_url(self):
        for url in ["https://evil.example/image.jpg", "http://cdn.pixabay.com/image.jpg", "https://pixabay.com/get/image.jpg?key=private", "https://private@pixabay.com/get/image.jpg"]:
            with self.subTest(url=url), self.assertRaises(prep.PreparationError):
                prep.pixabay_url(url, download=True)

    def test_upload_command_and_storage_http_are_refused(self):
        with contextlib.redirect_stderr(io.StringIO()), self.assertRaises(SystemExit) as caught:
            prep.parser().parse_args(["upload", "--service-role", "synthetic-key"])
        self.assertEqual(caught.exception.code, 2)
        with self.assertRaises(prep.PreparationError):
            prep.http_get("https://test-project.supabase.co/storage/v1/object/equipment/file.jpg", 1024)

    def test_duplicate_photo_or_asset_is_refused_before_writing(self):
        selection = self.inputs()
        selection[1]["photoId"] = selection[0]["photoId"]
        with self.assertRaises(prep.PreparationError):
            prep.prepare_package(self.work, selection, self.package, self.url)
        self.assertFalse(self.package.exists())

    def test_changed_original_is_refused_before_writing(self):
        selection = self.inputs()
        (self.work / "originals/12.jpg").write_bytes(fixture_png((0, 0, 0)))
        with self.assertRaisesRegex(prep.PreparationError, "mudou"):
            prep.prepare_package(self.work, selection, self.package, self.url)
        self.assertFalse(self.package.exists())

    def test_prepare_is_deterministic_and_not_approved_automatically(self):
        selection = self.inputs()
        first = prep.prepare_package(self.work, selection, self.package, self.url)
        before = {p.name: p.read_bytes() for p in self.package.glob("*.jpg")}
        second = prep.prepare_package(self.work, selection, self.package, self.url)
        self.assertEqual(first, second)
        self.assertEqual(before, {p.name: p.read_bytes() for p in self.package.glob("*.jpg")})
        self.assertFalse((self.package / "manifest.json").exists())
        self.assertTrue(all("reviewApproved" not in image for image in first["images"]))

    def test_finalization_requires_review_of_exact_final_bytes(self):
        draft, reviews = self.package_and_reviews()
        altered = copy.deepcopy(reviews)
        altered[0]["sha256"] = "0" * 64
        with self.assertRaisesRegex(prep.PreparationError, "Revisão recusada"):
            prep.finalize_package(self.package, altered)
        self.assertFalse((self.package / "manifest.json").exists())
        final = prep.finalize_package(self.package, reviews)
        prep.check_package(final, self.package, approved=True)
        self.assertEqual(len(final["images"]), 12)
        self.assertTrue((self.package / "review-log.json").exists())

    def test_visual_issue_or_future_date_prevents_approval(self):
        _, reviews = self.package_and_reviews()
        for mutation in ["people", "brands", "logos", "text", "screenContent", "future"]:
            changed = copy.deepcopy(reviews)
            if mutation == "future":
                changed[0]["reviewedAt"] = "2999-01-01T00:00:00Z"
            else:
                changed[0]["checks"][mutation] = True
            with self.subTest(mutation=mutation), self.assertRaises(prep.PreparationError):
                prep.finalize_package(self.package, changed)

    def test_modified_final_file_is_detected(self):
        _, reviews = self.package_and_reviews()
        final = prep.finalize_package(self.package, reviews)
        (self.package / "TI-0001.jpg").write_bytes(prep.render_jpeg(fixture_png((1, 1, 1))))
        with self.assertRaises(prep.PreparationError):
            prep.check_package(final, self.package, approved=True)

    def test_public_url_must_match_asset_filename(self):
        _, reviews = self.package_and_reviews()
        final = prep.finalize_package(self.package, reviews)
        final["images"][0]["src"] = self.url + "different.jpg"
        with self.assertRaises(prep.PreparationError):
            prep.check_package(final, self.package, approved=True)

    def test_unknown_review_fields_are_not_written_to_log(self):
        _, reviews = self.package_and_reviews()
        reviews[0]["apiKey"] = "synthetic-secret-must-not-be-logged"
        with self.assertRaises(prep.PreparationError):
            prep.finalize_package(self.package, reviews)
        self.assertFalse((self.package / "review-log.json").exists())

    def test_changed_package_metadata_preserves_previous_approval(self):
        _, reviews = self.package_and_reviews()
        prep.finalize_package(self.package, reviews)
        before = (self.package / "manifest.json").read_bytes()
        with self.assertRaises(prep.PreparationError):
            prep.prepare_package(self.work, self.inputs(), self.package, self.url.replace("test-project", "other-project"))
        self.assertEqual((self.package / "manifest.json").read_bytes(), before)

    def test_crop_exception_is_limited_to_third_monitor_and_recorded(self):
        selection = self.inputs()
        selection[0].update({"crop": [0, 0, 1200, 800], "cropReason": "Fixture de contexto externo"})
        with self.assertRaises(prep.PreparationError):
            prep.prepare_package(self.work, selection, self.package, self.url)
        selection[0].pop("crop")
        selection[0].pop("cropReason")
        selection[6].update({"crop": [0, 0, 1200, 800], "cropReason": "Fixture de contexto externo"})
        draft = prep.prepare_package(self.work, selection, self.package, self.url)
        self.assertEqual(draft["images"][6]["crop"], [0, 0, 1200, 800])
        self.assertEqual(draft["images"][6]["sourceSha256"], selection[6]["sourceSha256"])

    def test_crop_outside_original_bounds_is_refused(self):
        data = fixture_png((230, 20, 30))
        for box in [[-1, 0, 1200, 900], [0, 0, 1300, 900], [1200, 0, 0, 900]]:
            with self.subTest(box=box), self.assertRaises(prep.PreparationError):
                prep.render_jpeg(data, box)


if __name__ == "__main__":
    unittest.main()
