#!/usr/bin/env python3
from __future__ import annotations

import argparse
from array import array
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import uuid
from typing import Any, Iterator

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RUNTIME_ROOT = ROOT / "CLIENTES_PRIVADOS_LOCAL" / "_ABRAXAS_RUNTIME"

SCHEMA_REGISTRY = "abraxas.source-registry.v1"
SCHEMA_JOBS = "abraxas.background-jobs.v1"
SCHEMA_ASSETS = "abraxas.asset-library.v1"

SUPPORTED_EXECUTORS = {"probe", "cut", "thumbnail", "waveform"}

MEDIA_EXTENSIONS = {
    ".mp4", ".mov", ".m4v", ".webm",
    ".mp3", ".wav", ".m4a", ".aac",
}
IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".tif", ".tiff",
}
ASSET_EXTENSIONS = MEDIA_EXTENSIONS | IMAGE_EXTENSIONS


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def runtime_root() -> Path:
    override = os.environ.get("ABRAXAS_RUNTIME_ROOT")
    if override:
        return Path(override).expanduser().resolve()
    return DEFAULT_RUNTIME_ROOT


def ensure_root() -> Path:
    root = runtime_root()
    root.mkdir(parents=True, exist_ok=True)
    return root


def atomic_write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=str(path.parent),
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
        tmp = Path(handle.name)
    os.replace(tmp, path)


@contextmanager
def lock_store(name: str) -> Iterator[None]:
    root = ensure_root()
    lock_path = root / f".{name}.lock"
    with lock_path.open("a+") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def store_path(name: str) -> Path:
    return ensure_root() / f"{name}.json"


def load_store(name: str, schema: str, key: str) -> dict[str, Any]:
    path = store_path(name)
    if not path.exists():
        return {
            "schemaVersion": schema,
            "updatedAt": now_iso(),
            key: [],
        }
    data = json.loads(path.read_text())
    if not isinstance(data, dict):
        raise RuntimeError(f"{name} root must be an object.")
    return data


def save_store(name: str, schema: str, data: dict[str, Any]) -> None:
    data["schemaVersion"] = schema
    data["updatedAt"] = now_iso()
    atomic_write_json(store_path(name), data)


def find_tool(name: str) -> str:
    candidates = [
        shutil.which(name),
        f"/opt/homebrew/bin/{name}",
        f"/usr/local/bin/{name}",
    ]
    for item in candidates:
        if item and Path(item).is_file():
            return str(Path(item))
    raise RuntimeError(f"No se encontró {name}")


def probe_source(path: Path) -> dict[str, Any]:
    ffprobe = find_tool("ffprobe")
    result = subprocess.run(
        [
            ffprobe,
            "-v", "error",
            "-show_streams",
            "-show_format",
            "-of", "json",
            str(path),
        ],
        text=True,
        capture_output=True,
        timeout=45,
    )
    if result.returncode != 0:
        raise RuntimeError(
            (result.stderr or result.stdout or "ffprobe failed").strip()
        )

    data = json.loads(result.stdout or "{}")
    streams = data.get("streams") or []
    fmt = data.get("format") or {}

    video = next(
        (item for item in streams if item.get("codec_type") == "video"),
        None,
    )
    audio = next(
        (item for item in streams if item.get("codec_type") == "audio"),
        None,
    )

    width = int((video or {}).get("width") or 0)
    height = int((video or {}).get("height") or 0)

    if width and height:
        orientation = (
            "horizontal" if width > height
            else "vertical" if height > width
            else "square"
        )
    else:
        orientation = "unknown"

    return {
        "durationSeconds": float(fmt.get("duration") or 0.0),
        "sizeBytes": int(fmt.get("size") or path.stat().st_size),
        "formatName": fmt.get("format_name"),
        "width": width or None,
        "height": height or None,
        "orientation": orientation,
        "videoCodec": (video or {}).get("codec_name"),
        "audioCodec": (audio or {}).get("codec_name"),
        "sampleRate": (audio or {}).get("sample_rate"),
    }


def sampled_fingerprint(path: Path) -> str:
    stat = path.stat()
    h = hashlib.sha256()
    h.update(str(path).encode("utf-8", "surrogatepass"))
    h.update(str(stat.st_size).encode())
    h.update(str(stat.st_mtime_ns).encode())

    sample = 1024 * 1024
    with path.open("rb") as handle:
        h.update(handle.read(sample))
        if stat.st_size > sample:
            handle.seek(max(0, stat.st_size - sample))
            h.update(handle.read(sample))
    return h.hexdigest()


def register_source(source_path: str, role: str = "other") -> dict[str, Any]:
    path = Path(source_path).expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(path)

    fingerprint = sampled_fingerprint(path)
    source_id = f"src_{fingerprint[:20]}"
    stat = path.stat()

    record = {
        "id": source_id,
        "fingerprint": fingerprint,
        "pathRef": str(path),
        "fileName": path.name,
        "role": role,
        "sizeBytes": stat.st_size,
        "mtimeNs": stat.st_mtime_ns,
        "metadata": probe_source(path),
        "status": "ready",
        "registeredAt": now_iso(),
    }

    with lock_store("sources"):
        store = load_store("sources", SCHEMA_REGISTRY, "sources")
        items = store.setdefault("sources", [])
        for index, item in enumerate(items):
            if item.get("id") == source_id:
                record["registeredAt"] = item.get(
                    "registeredAt", record["registeredAt"]
                )
                record["updatedAt"] = now_iso()
                items[index] = record
                break
        else:
            items.append(record)
        save_store("sources", SCHEMA_REGISTRY, store)

    return record


def list_sources() -> list[dict[str, Any]]:
    with lock_store("sources"):
        return list(
            load_store("sources", SCHEMA_REGISTRY, "sources").get("sources") or []
        )


def find_source(source_id: str) -> dict[str, Any] | None:
    for item in list_sources():
        if item.get("id") == source_id:
            return item
    return None


def detect_transcription_backends() -> list[str]:
    backends: list[str] = []
    for cli in ("whisper", "whisper-cli"):
        if shutil.which(cli):
            backends.append(cli)
    if importlib.util.find_spec("mlx_whisper") is not None:
        backends.append("mlx_whisper")
    return sorted(set(backends))


def analysis_provider() -> str | None:
    value = os.environ.get("ABRAXAS_ANALYSIS_PROVIDER", "").strip()
    return value or None


def classify_asset(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in IMAGE_EXTENSIONS:
        return "image"
    if suffix in {".mp3", ".wav", ".m4a", ".aac"}:
        return "audio"
    if suffix in {".mp4", ".mov", ".m4v", ".webm"}:
        return "video"
    return "other"


def index_asset_folder(folder: str) -> dict[str, Any]:
    root = Path(folder).expanduser().resolve()
    if not root.is_dir():
        raise NotADirectoryError(root)

    found: list[dict[str, Any]] = []
    limit = 20000

    for path in root.rglob("*"):
        if len(found) >= limit:
            break
        if not path.is_file() or path.suffix.lower() not in ASSET_EXTENSIONS:
            continue

        stat = path.stat()
        digest = hashlib.sha1(
            f"{path}:{stat.st_size}:{stat.st_mtime_ns}".encode(
                "utf-8", "surrogatepass"
            )
        ).hexdigest()[:20]

        found.append({
            "id": f"asset_{digest}",
            "pathRef": str(path),
            "fileName": path.name,
            "kind": classify_asset(path),
            "extension": path.suffix.lower(),
            "sizeBytes": stat.st_size,
            "mtimeNs": stat.st_mtime_ns,
            "rootRef": str(root),
            "tags": [],
            "indexedAt": now_iso(),
        })

    with lock_store("assets"):
        store = load_store("assets", SCHEMA_ASSETS, "assets")
        existing = {
            item.get("id"): item
            for item in (store.get("assets") or [])
            if isinstance(item, dict)
        }
        for item in found:
            existing[item["id"]] = item
        store["assets"] = list(existing.values())
        save_store("assets", SCHEMA_ASSETS, store)

    return {
        "rootRef": str(root),
        "indexed": len(found),
        "total": len(list_assets()),
        "truncated": len(found) >= limit,
    }


def list_assets() -> list[dict[str, Any]]:
    with lock_store("assets"):
        return list(
            load_store("assets", SCHEMA_ASSETS, "assets").get("assets") or []
        )


def enqueue_job(
    kind: str,
    source_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    status = "queued"
    message = None

    if kind == "transcript" and not detect_transcription_backends():
        status = "blocked"
        message = "No transcription backend configured."

    if kind == "analysis" and analysis_provider() is None:
        status = "blocked"
        message = "No semantic analysis provider configured."

    job = {
        "id": f"job_{uuid.uuid4().hex[:20]}",
        "kind": kind,
        "sourceId": source_id,
        "payload": payload or {},
        "status": status,
        "progress": 0,
        "message": message,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "startedAt": None,
        "completedAt": None,
        "error": None,
        "result": None,
    }

    with lock_store("jobs"):
        store = load_store("jobs", SCHEMA_JOBS, "jobs")
        store.setdefault("jobs", []).append(job)
        save_store("jobs", SCHEMA_JOBS, store)

    return job


def list_jobs() -> list[dict[str, Any]]:
    with lock_store("jobs"):
        return list(
            load_store("jobs", SCHEMA_JOBS, "jobs").get("jobs") or []
        )


def update_job(job_id: str, **changes: Any) -> dict[str, Any]:
    with lock_store("jobs"):
        store = load_store("jobs", SCHEMA_JOBS, "jobs")
        for item in store.setdefault("jobs", []):
            if item.get("id") == job_id:
                item.update(changes)
                item["updatedAt"] = now_iso()
                save_store("jobs", SCHEMA_JOBS, store)
                return dict(item)
    raise KeyError(job_id)


def claim_next_job() -> dict[str, Any] | None:
    with lock_store("jobs"):
        store = load_store("jobs", SCHEMA_JOBS, "jobs")
        for item in store.get("jobs") or []:
            if (
                item.get("status") == "queued"
                and item.get("kind") in SUPPORTED_EXECUTORS
            ):
                item["status"] = "running"
                item["progress"] = 1
                item["message"] = "Started"
                item["startedAt"] = now_iso()
                item["updatedAt"] = now_iso()
                item["workerPid"] = os.getpid()
                save_store("jobs", SCHEMA_JOBS, store)
                return dict(item)
    return None


def artifact_root(kind: str, source_id: str) -> Path:
    target = ensure_root() / "artifacts" / kind / source_id
    target.mkdir(parents=True, exist_ok=True)
    return target


def run_probe_job(job: dict[str, Any]) -> dict[str, Any]:
    source_id = job.get("sourceId")
    if not source_id:
        raise RuntimeError("probe job missing sourceId")
    source = find_source(source_id)
    if not source:
        raise RuntimeError(f"source not found: {source_id}")

    metadata = probe_source(Path(source["pathRef"]))

    with lock_store("sources"):
        store = load_store("sources", SCHEMA_REGISTRY, "sources")
        for item in store.get("sources") or []:
            if item.get("id") == source_id:
                item["metadata"] = metadata
                item["updatedAt"] = now_iso()
                save_store("sources", SCHEMA_REGISTRY, store)
                break

    return metadata


def run_cut_job(job: dict[str, Any]) -> dict[str, Any]:
    payload = job.get("payload") or {}
    source_id = job.get("sourceId")
    source = find_source(source_id) if source_id else None
    source_path = payload.get("sourcePath") or (source or {}).get("pathRef")

    if not source_path:
        raise RuntimeError("cut job missing source path")

    start = payload.get("start")
    end = payload.get("end")
    output = payload.get("output")
    if start is None or end is None or not output:
        raise RuntimeError("cut job requires start/end/output")

    mode = payload.get("mode") or "exact_vt"
    engine = ROOT / "scripts" / "abraxas_media_engine.py"

    result = subprocess.run(
        [
            sys.executable,
            str(engine),
            "cut",
            "--source", str(source_path),
            "--start", str(start),
            "--end", str(end),
            "--out", str(output),
            "--mode", str(mode),
        ],
        text=True,
        capture_output=True,
        timeout=3600,
    )
    if result.returncode != 0:
        raise RuntimeError(
            (result.stderr or result.stdout or "cut failed").strip()
        )
    parsed = json.loads(result.stdout)
    if not isinstance(parsed, dict):
        raise RuntimeError("cut engine returned non-object JSON")
    return parsed


def run_thumbnail_job(job: dict[str, Any]) -> dict[str, Any]:
    source_id = job.get("sourceId")
    source = find_source(source_id) if source_id else None
    if not source:
        raise RuntimeError("thumbnail source missing")

    at_seconds = float((job.get("payload") or {}).get("atSeconds") or 0.0)
    duration = float((source.get("metadata") or {}).get("durationSeconds") or 0)
    if duration > 0:
        at_seconds = max(0.0, min(at_seconds, max(0.0, duration - 0.05)))

    ffmpeg = find_tool("ffmpeg")
    key = int(round(at_seconds * 1000))
    target = artifact_root("thumbnails", source_id) / f"{key:012d}.jpg"
    partial = target.with_name(f".{target.stem}.{os.getpid()}.partial.jpg")

    result = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel", "warning",
            "-y",
            "-ss", f"{at_seconds:.3f}",
            "-i", str(source["pathRef"]),
            "-frames:v", "1",
            "-vf", "scale=640:640:force_original_aspect_ratio=decrease",
            "-q:v", "3",
            str(partial),
        ],
        text=True,
        capture_output=True,
        timeout=180,
    )
    if result.returncode != 0:
        partial.unlink(missing_ok=True)
        raise RuntimeError(
            (result.stderr or "thumbnail ffmpeg failed").strip()
        )
    if not partial.is_file() or partial.stat().st_size < 1024:
        partial.unlink(missing_ok=True)
        raise RuntimeError("thumbnail output missing or too small")

    os.replace(partial, target)
    return {
        "path": str(target),
        "atSeconds": at_seconds,
        "bytes": target.stat().st_size,
    }


def run_waveform_job(job: dict[str, Any]) -> dict[str, Any]:
    source_id = job.get("sourceId")
    source = find_source(source_id) if source_id else None
    if not source:
        raise RuntimeError("waveform source missing")

    ffmpeg = find_tool("ffmpeg")
    sample_rate = 100

    result = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel", "error",
            "-i", str(source["pathRef"]),
            "-vn",
            "-map", "0:a:0?",
            "-ac", "1",
            "-ar", str(sample_rate),
            "-f", "s16le",
            "pipe:1",
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=3600,
    )
    if result.returncode != 0:
        raise RuntimeError(
            (
                result.stderr.decode("utf-8", "replace")
                or "waveform ffmpeg failed"
            ).strip()
        )
    if not result.stdout:
        raise RuntimeError("source has no decodable audio for waveform")

    samples = array("h")
    samples.frombytes(result.stdout)
    if sys.byteorder != "little":
        samples.byteswap()

    target_points = 2000
    bucket = max(1, (len(samples) + target_points - 1) // target_points)
    points: list[float] = []

    for offset in range(0, len(samples), bucket):
        chunk = samples[offset:offset + bucket]
        if not chunk:
            continue
        peak = max(abs(int(value)) for value in chunk)
        points.append(round(min(1.0, peak / 32768.0), 4))

    payload = {
        "schemaVersion": "abraxas.waveform-coarse.v1",
        "sourceId": source_id,
        "sampleRate": sample_rate,
        "pointCount": len(points),
        "durationSeconds": (source.get("metadata") or {}).get("durationSeconds"),
        "points": points,
        "generatedAt": now_iso(),
    }

    target = artifact_root("waveforms", source_id) / "coarse.json"
    atomic_write_json(target, payload)

    return {
        "path": str(target),
        "pointCount": len(points),
        "sampleRate": sample_rate,
    }


def worker_once() -> dict[str, Any] | None:
    job = claim_next_job()
    if not job:
        return None

    job_id = job["id"]
    try:
        if job["kind"] == "probe":
            result = run_probe_job(job)
        elif job["kind"] == "cut":
            result = run_cut_job(job)
        elif job["kind"] == "thumbnail":
            result = run_thumbnail_job(job)
        elif job["kind"] == "waveform":
            result = run_waveform_job(job)
        else:
            raise RuntimeError(f"Unsupported executor: {job['kind']}")

        return update_job(
            job_id,
            status="completed",
            progress=100,
            completedAt=now_iso(),
            message="Completed",
            result=result,
            error=None,
        )
    except Exception as exc:
        update_job(
            job_id,
            status="failed",
            completedAt=now_iso(),
            message="Failed",
            error=str(exc),
        )
        raise


def drain(max_jobs: int = 16) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for _ in range(max(1, min(64, max_jobs))):
        value = worker_once()
        if value is None:
            break
        results.append(value)
    return results


def runtime_status() -> dict[str, Any]:
    sources = list_sources()
    jobs = list_jobs()
    assets = list_assets()

    counts: dict[str, int] = {}
    for job in jobs:
        status = str(job.get("status"))
        counts[status] = counts.get(status, 0) + 1

    return {
        "schemaVersion": "abraxas.fast-source-runtime.v2",
        "runtimeRoot": str(ensure_root()),
        "sourceCount": len(sources),
        "jobCount": len(jobs),
        "assetCount": len(assets),
        "jobsByStatus": counts,
        "supportedExecutors": sorted(SUPPORTED_EXECUTORS),
        "transcriptionBackends": detect_transcription_backends(),
        "analysisProvider": analysis_provider(),
    }


def generate_test_video(target: Path) -> None:
    ffmpeg = find_tool("ffmpeg")
    result = subprocess.run(
        [
            ffmpeg,
            "-hide_banner",
            "-loglevel", "warning",
            "-y",
            "-f", "lavfi",
            "-i", "testsrc2=size=640x360:rate=30",
            "-f", "lavfi",
            "-i", "sine=frequency=440:sample_rate=48000",
            "-t", "4",
            "-c:v", "h264_videotoolbox",
            "-b:v", "4M",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            str(target),
        ],
        text=True,
        capture_output=True,
        timeout=120,
    )
    if result.returncode != 0:
        raise RuntimeError(
            (result.stderr or "test video generation failed").strip()
        )


def self_test() -> dict[str, Any]:
    with tempfile.TemporaryDirectory(
        prefix="abraxas-runtime-selftest-"
    ) as temp:
        root = Path(temp)
        old = os.environ.get("ABRAXAS_RUNTIME_ROOT")
        os.environ["ABRAXAS_RUNTIME_ROOT"] = str(root / "runtime")

        try:
            source_path = root / "source.mp4"
            output_path = root / "cut.mp4"
            generate_test_video(source_path)

            source = register_source(str(source_path), role="other")

            probe_job = enqueue_job("probe", source["id"])
            thumb_job = enqueue_job(
                "thumbnail", source["id"], {"atSeconds": 1.0}
            )
            wave_job = enqueue_job("waveform", source["id"])
            cut_job = enqueue_job(
                "cut",
                source["id"],
                {
                    "start": 0.5,
                    "end": 2.0,
                    "output": str(output_path),
                    "mode": "exact_vt",
                },
            )

            results = drain(8)
            if len(results) != 4:
                raise RuntimeError(
                    f"expected 4 completed jobs, got {len(results)}"
                )

            if not output_path.is_file():
                raise RuntimeError("cut output missing")

            thumb_path = Path(
                next(
                    item["result"]["path"]
                    for item in results
                    if item["kind"] == "thumbnail"
                )
            )
            wave_path = Path(
                next(
                    item["result"]["path"]
                    for item in results
                    if item["kind"] == "waveform"
                )
            )

            if not thumb_path.is_file() or not wave_path.is_file():
                raise RuntimeError("media prep artifact missing")

            asset_result = index_asset_folder(str(thumb_path.parent))
            if asset_result["indexed"] < 1:
                raise RuntimeError("asset index self-test failed")

            return {
                "schemaVersion": "abraxas.fast-source-runtime.self-test.v2",
                "status": "pass",
                "sourceId": source["id"],
                "jobIds": [
                    probe_job["id"],
                    thumb_job["id"],
                    wave_job["id"],
                    cut_job["id"],
                ],
                "outputBytes": output_path.stat().st_size,
                "thumbnailBytes": thumb_path.stat().st_size,
                "waveformBytes": wave_path.stat().st_size,
                "assetCount": len(list_assets()),
                "capabilities": {
                    "transcriptionBackends": detect_transcription_backends(),
                    "analysisProvider": analysis_provider(),
                },
            }
        finally:
            if old is None:
                os.environ.pop("ABRAXAS_RUNTIME_ROOT", None)
            else:
                os.environ["ABRAXAS_RUNTIME_ROOT"] = old


def print_json(value: Any) -> None:
    print(json.dumps(value, indent=2, ensure_ascii=False))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Abraxas Fast Source Runtime"
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("preflight")
    p.set_defaults(
        fn=lambda _: print_json({
            "status": "pass",
            "runtimeRoot": str(ensure_root()),
            "ffprobe": find_tool("ffprobe"),
            "ffmpeg": find_tool("ffmpeg"),
            "transcriptionBackends": detect_transcription_backends(),
            "analysisProvider": analysis_provider(),
        })
    )

    p = sub.add_parser("self-test")
    p.set_defaults(fn=lambda _: print_json(self_test()))

    p = sub.add_parser("register")
    p.add_argument("--source", required=True)
    p.add_argument(
        "--role",
        default="other",
        choices=[
            "horizontal_master",
            "vertical_master",
            "audio_master",
            "other",
        ],
    )
    p.set_defaults(
        fn=lambda args: print_json(
            register_source(args.source, args.role)
        )
    )

    p = sub.add_parser("sources")
    p.set_defaults(fn=lambda _: print_json(list_sources()))

    p = sub.add_parser("assets")
    p.set_defaults(fn=lambda _: print_json(list_assets()))

    p = sub.add_parser("index-assets")
    p.add_argument("--folder", required=True)
    p.set_defaults(
        fn=lambda args: print_json(index_asset_folder(args.folder))
    )

    p = sub.add_parser("enqueue-probe")
    p.add_argument("--source-id", required=True)
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job("probe", args.source_id)
        )
    )

    p = sub.add_parser("enqueue-thumbnail")
    p.add_argument("--source-id", required=True)
    p.add_argument("--at", default="0")
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job(
                "thumbnail",
                args.source_id,
                {"atSeconds": float(args.at)},
            )
        )
    )

    p = sub.add_parser("enqueue-waveform")
    p.add_argument("--source-id", required=True)
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job("waveform", args.source_id)
        )
    )

    p = sub.add_parser("enqueue-transcript")
    p.add_argument("--source-id", required=True)
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job("transcript", args.source_id)
        )
    )

    p = sub.add_parser("enqueue-analysis")
    p.add_argument("--source-id", required=True)
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job("analysis", args.source_id)
        )
    )

    p = sub.add_parser("enqueue-cut")
    p.add_argument("--source-id", required=True)
    p.add_argument("--start", required=True)
    p.add_argument("--end", required=True)
    p.add_argument("--output", required=True)
    p.add_argument(
        "--mode",
        default="exact_vt",
        choices=["exact_vt", "fast_copy"],
    )
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job(
                "cut",
                args.source_id,
                {
                    "start": args.start,
                    "end": args.end,
                    "output": args.output,
                    "mode": args.mode,
                },
            )
        )
    )

    p = sub.add_parser("jobs")
    p.set_defaults(fn=lambda _: print_json(list_jobs()))

    p = sub.add_parser("worker-once")
    p.set_defaults(fn=lambda _: print_json(worker_once()))

    p = sub.add_parser("drain")
    p.add_argument("--max", type=int, default=16)
    p.set_defaults(fn=lambda args: print_json(drain(args.max)))

    p = sub.add_parser("status")
    p.set_defaults(fn=lambda _: print_json(runtime_status()))

    args = parser.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
