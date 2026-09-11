#!/usr/bin/env python3

from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from typing import Any, Iterator

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RUNTIME_ROOT = (
    ROOT
    / "CLIENTES_PRIVADOS_LOCAL"
    / "_ABRAXAS_RUNTIME"
)

SCHEMA_REGISTRY = "abraxas.source-registry.v1"
SCHEMA_JOBS = "abraxas.background-jobs.v1"

SUPPORTED_EXECUTORS = {"probe", "cut"}

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
        json.dump(
            data,
            handle,
            indent=2,
            ensure_ascii=False,
        )
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

def registry_path() -> Path:
    return ensure_root() / "sources.json"

def jobs_path() -> Path:
    return ensure_root() / "jobs.json"

def load_registry() -> dict[str, Any]:
    path = registry_path()

    if not path.exists():
        return {
            "schemaVersion": SCHEMA_REGISTRY,
            "updatedAt": now_iso(),
            "sources": [],
        }

    data = json.loads(path.read_text())

    if not isinstance(data, dict):
        raise RuntimeError("Source registry root must be an object.")

    return data

def save_registry(data: dict[str, Any]) -> None:
    data["schemaVersion"] = SCHEMA_REGISTRY
    data["updatedAt"] = now_iso()
    atomic_write_json(registry_path(), data)

def load_jobs() -> dict[str, Any]:
    path = jobs_path()

    if not path.exists():
        return {
            "schemaVersion": SCHEMA_JOBS,
            "updatedAt": now_iso(),
            "jobs": [],
        }

    data = json.loads(path.read_text())

    if not isinstance(data, dict):
        raise RuntimeError("Jobs root must be an object.")

    return data

def save_jobs(data: dict[str, Any]) -> None:
    data["schemaVersion"] = SCHEMA_JOBS
    data["updatedAt"] = now_iso()
    atomic_write_json(jobs_path(), data)

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
        timeout=30,
    )

    if result.returncode != 0:
        raise RuntimeError(
            (result.stderr or result.stdout or "ffprobe failed").strip()
        )

    data = json.loads(result.stdout or "{}")
    streams = data.get("streams") or []
    fmt = data.get("format") or {}

    video = next(
        (
            item
            for item in streams
            if item.get("codec_type") == "video"
        ),
        None,
    )

    audio = next(
        (
            item
            for item in streams
            if item.get("codec_type") == "audio"
        ),
        None,
    )

    width = int((video or {}).get("width") or 0)
    height = int((video or {}).get("height") or 0)

    if width and height:
        if width > height:
            orientation = "horizontal"
        elif height > width:
            orientation = "vertical"
        else:
            orientation = "square"
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

def register_source(
    source_path: str,
    *,
    role: str = "other",
) -> dict[str, Any]:
    path = Path(source_path).expanduser().resolve()

    if not path.is_file():
        raise FileNotFoundError(path)

    fingerprint = sampled_fingerprint(path)
    source_id = f"src_{fingerprint[:20]}"

    metadata = probe_source(path)
    stat = path.stat()

    record = {
        "id": source_id,
        "fingerprint": fingerprint,
        "pathRef": str(path),
        "fileName": path.name,
        "role": role,
        "sizeBytes": stat.st_size,
        "mtimeNs": stat.st_mtime_ns,
        "metadata": metadata,
        "status": "ready",
        "registeredAt": now_iso(),
    }

    with lock_store("sources"):
        registry = load_registry()
        sources = registry.setdefault("sources", [])

        replaced = False

        for index, item in enumerate(sources):
            if item.get("id") == source_id:
                record["registeredAt"] = item.get(
                    "registeredAt",
                    record["registeredAt"],
                )
                record["updatedAt"] = now_iso()
                sources[index] = record
                replaced = True
                break

        if not replaced:
            sources.append(record)

        save_registry(registry)

    return record

def list_sources() -> list[dict[str, Any]]:
    with lock_store("sources"):
        return list(load_registry().get("sources") or [])

def find_source(source_id: str) -> dict[str, Any] | None:
    for item in list_sources():
        if item.get("id") == source_id:
            return item

    return None

def enqueue_job(
    kind: str,
    *,
    source_id: str | None = None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    job = {
        "id": f"job_{uuid.uuid4().hex[:20]}",
        "kind": kind,
        "sourceId": source_id,
        "payload": payload or {},
        "status": "queued",
        "progress": 0,
        "message": None,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
        "startedAt": None,
        "completedAt": None,
        "error": None,
        "result": None,
    }

    with lock_store("jobs"):
        store = load_jobs()
        store.setdefault("jobs", []).append(job)
        save_jobs(store)

    return job

def list_jobs() -> list[dict[str, Any]]:
    with lock_store("jobs"):
        return list(load_jobs().get("jobs") or [])

def update_job(job_id: str, **changes: Any) -> dict[str, Any]:
    with lock_store("jobs"):
        store = load_jobs()
        jobs = store.setdefault("jobs", [])

        for item in jobs:
            if item.get("id") == job_id:
                item.update(changes)
                item["updatedAt"] = now_iso()
                save_jobs(store)
                return dict(item)

    raise KeyError(job_id)

def next_supported_job() -> dict[str, Any] | None:
    with lock_store("jobs"):
        store = load_jobs()

        for item in store.get("jobs") or []:
            if (
                item.get("status") == "queued"
                and item.get("kind") in SUPPORTED_EXECUTORS
            ):
                return dict(item)

    return None

def run_probe_job(job: dict[str, Any]) -> dict[str, Any]:
    source_id = job.get("sourceId")

    if not source_id:
        raise RuntimeError("probe job missing sourceId")

    source = find_source(source_id)

    if not source:
        raise RuntimeError(f"source not found: {source_id}")

    metadata = probe_source(Path(source["pathRef"]))

    with lock_store("sources"):
        registry = load_registry()

        for item in registry.get("sources") or []:
            if item.get("id") == source_id:
                item["metadata"] = metadata
                item["updatedAt"] = now_iso()
                save_registry(registry)
                break

    return metadata

def run_cut_job(job: dict[str, Any]) -> dict[str, Any]:
    payload = job.get("payload") or {}

    source_id = job.get("sourceId")
    source = find_source(source_id) if source_id else None

    source_path = (
        payload.get("sourcePath")
        or (source or {}).get("pathRef")
    )

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

def worker_once() -> dict[str, Any] | None:
    job = next_supported_job()

    if not job:
        return None

    job_id = job["id"]

    update_job(
        job_id,
        status="running",
        progress=1,
        startedAt=now_iso(),
        message="Started",
    )

    try:
        if job["kind"] == "probe":
            result = run_probe_job(job)
        elif job["kind"] == "cut":
            result = run_cut_job(job)
        else:
            return None

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

def runtime_status() -> dict[str, Any]:
    sources = list_sources()
    jobs = list_jobs()

    counts: dict[str, int] = {}

    for job in jobs:
        status = str(job.get("status"))
        counts[status] = counts.get(status, 0) + 1

    return {
        "schemaVersion": "abraxas.fast-source-runtime.v1",
        "runtimeRoot": str(ensure_root()),
        "sourceCount": len(sources),
        "jobCount": len(jobs),
        "jobsByStatus": counts,
        "supportedExecutors": sorted(SUPPORTED_EXECUTORS),
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

            source = register_source(
                str(source_path),
                role="other",
            )

            probe_job = enqueue_job(
                "probe",
                source_id=source["id"],
            )

            completed_probe = worker_once()

            cut_job = enqueue_job(
                "cut",
                source_id=source["id"],
                payload={
                    "start": 0.5,
                    "end": 2.0,
                    "output": str(output_path),
                    "mode": "exact_vt",
                },
            )

            completed_cut = worker_once()

            if not output_path.is_file():
                raise RuntimeError("runtime cut output missing")

            if completed_probe is None or completed_probe.get("status") != "completed":
                raise RuntimeError("probe worker self-test failed")

            if completed_cut is None or completed_cut.get("status") != "completed":
                raise RuntimeError("cut worker self-test failed")

            return {
                "schemaVersion": "abraxas.fast-source-runtime.self-test.v1",
                "status": "pass",
                "sourceId": source["id"],
                "probeJobId": probe_job["id"],
                "cutJobId": cut_job["id"],
                "outputBytes": output_path.stat().st_size,
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
            "mediaEngine": str(ROOT / "scripts" / "abraxas_media_engine.py"),
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
            register_source(args.source, role=args.role)
        )
    )

    p = sub.add_parser("sources")
    p.set_defaults(fn=lambda _: print_json(list_sources()))

    p = sub.add_parser("enqueue-probe")
    p.add_argument("--source-id", required=True)
    p.set_defaults(
        fn=lambda args: print_json(
            enqueue_job("probe", source_id=args.source_id)
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
                source_id=args.source_id,
                payload={
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

    p = sub.add_parser("status")
    p.set_defaults(fn=lambda _: print_json(runtime_status()))

    args = parser.parse_args()
    args.fn(args)

if __name__ == "__main__":
    main()
