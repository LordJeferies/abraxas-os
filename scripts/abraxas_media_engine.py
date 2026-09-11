#!/usr/bin/env python3
"""
ABRAXAS MEDIA ENGINE v1

Implementa el patrón ya probado en el playbook operativo:
MASTER -> FINGERPRINT -> PART CACHE -> VideoToolbox -> concat -c copy -> OUTPUT

No usa proxy para CUT_ONLY.
No usa VideoFlow para CUT_ONLY.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Any

PROFILE_ID = "APPLE_VT_H264_40M_V1"
ENGINE_SCHEMA = "abraxas.media-engine.v1"
CUT_SCHEMA = "abraxas.cut-job.v1"

CACHE_ROOT = (
    Path.home()
    / "Library"
    / "Caches"
    / "AbraxasOS"
    / "canonical-parts"
)

VIDEO_BITRATE = "40M"
VIDEO_MAXRATE = "48M"
VIDEO_BUFSIZE = "80M"
AUDIO_BITRATE = "192k"
AUDIO_RATE = "48000"

def tool(name: str) -> str:
    candidates = [
        shutil.which(name),
        f"/opt/homebrew/bin/{name}",
        f"/usr/local/bin/{name}",
    ]

    for value in candidates:
        if value and Path(value).is_file():
            return str(Path(value))

    raise RuntimeError(f"No se encontró {name}")

FFMPEG = tool("ffmpeg")
FFPROBE = tool("ffprobe")

def run(
    cmd: list[str],
    *,
    check: bool = True,
    timeout: int | None = None,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        cmd,
        text=True,
        capture_output=True,
        timeout=timeout,
    )

    if check and result.returncode != 0:
        tail = (result.stderr or result.stdout or "").strip()[-5000:]
        raise RuntimeError(
            "Comando falló:\n"
            + " ".join(cmd)
            + "\n\n"
            + tail
        )

    return result

def parse_time(value: Any) -> float:
    if isinstance(value, (int, float)):
        result = float(value)
    else:
        raw = str(value).strip()

        if ":" not in raw:
            result = float(raw)
        else:
            parts = raw.split(":")

            if len(parts) == 3:
                h, m, s = parts
                result = (
                    float(h) * 3600
                    + float(m) * 60
                    + float(s)
                )
            elif len(parts) == 2:
                m, s = parts
                result = float(m) * 60 + float(s)
            else:
                raise ValueError(f"Timestamp inválido: {value}")

    if result < 0:
        raise ValueError("Timestamp negativo no permitido")

    return result

def probe(path: Path) -> dict[str, Any]:
    path = path.expanduser().resolve()

    result = run([
        FFPROBE,
        "-v", "error",
        "-show_streams",
        "-show_format",
        "-of", "json",
        str(path),
    ])

    data = json.loads(result.stdout or "{}")
    fmt = data.get("format") or {}

    duration = float(fmt.get("duration") or 0.0)
    streams = data.get("streams") or []
    video = next(
        (item for item in streams if item.get("codec_type") == "video"),
        None,
    )
    audio = next(
        (item for item in streams if item.get("codec_type") == "audio"),
        None,
    )

    return {
        "path": str(path),
        "duration": duration,
        "size": int(fmt.get("size") or 0),
        "formatName": fmt.get("format_name"),
        "video": video,
        "audio": audio,
    }

def sampled_fingerprint(path: Path) -> str:
    path = path.expanduser().resolve()
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

def ensure_range(
    source: Path,
    start: float,
    end: float,
) -> tuple[dict[str, Any], float]:
    info = probe(source)
    duration = float(info["duration"])

    if duration <= 0:
        raise RuntimeError("No se pudo determinar duración del master.")

    if end <= start:
        raise ValueError("END debe ser mayor que START.")

    if start >= duration:
        raise ValueError(
            f"START {start:.3f}s está fuera del master ({duration:.3f}s)."
        )

    if end > duration + 0.10:
        raise ValueError(
            f"END {end:.3f}s excede master ({duration:.3f}s)."
        )

    safe_end = min(end, duration)
    return info, safe_end - start

def atomic_path(output: Path) -> Path:
    output = output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    return output.with_name(
        f".{output.stem}.partial.{os.getpid()}{output.suffix or '.mp4'}"
    )

def verify_output(
    output: Path,
    expected_duration: float,
    *,
    tolerance: float,
) -> dict[str, Any]:
    if not output.is_file():
        raise RuntimeError(f"No existe output: {output}")

    if output.stat().st_size < 4096:
        raise RuntimeError(
            f"Output sospechosamente pequeño: {output.stat().st_size} bytes"
        )

    info = probe(output)
    actual = float(info["duration"])

    if actual <= 0:
        raise RuntimeError("Output sin duración válida.")

    delta = abs(actual - expected_duration)

    if delta > tolerance:
        raise RuntimeError(
            "QA duración falló: "
            f"esperado={expected_duration:.3f}s "
            f"real={actual:.3f}s "
            f"delta={delta:.3f}s"
        )

    if not info["video"]:
        raise RuntimeError("Output no contiene stream de video.")

    return info

def exact_vt_command(
    source: Path,
    start: float,
    duration: float,
    target: Path,
    *,
    hw_decode: bool,
) -> list[str]:
    cmd = [
        FFMPEG,
        "-hide_banner",
        "-loglevel", "warning",
        "-y",
    ]

    if hw_decode:
        cmd += ["-hwaccel", "videotoolbox"]

    # Input seeking: FFmpeg hace accurate seek cuando transcodifica.
    cmd += [
        "-ss", f"{start:.6f}",
        "-t", f"{duration:.6f}",
        "-i", str(source),
        "-map", "0:v:0?",
        "-map", "0:a:0?",
        "-c:v", "h264_videotoolbox",
        "-profile:v", "high",
        "-b:v", VIDEO_BITRATE,
        "-maxrate", VIDEO_MAXRATE,
        "-bufsize", VIDEO_BUFSIZE,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", AUDIO_BITRATE,
        "-ar", AUDIO_RATE,
        "-ac", "2",
        "-movflags", "+faststart",
        str(target),
    ]

    return cmd

def encode_exact_part(
    source: Path,
    start: float,
    end: float,
    target: Path,
) -> dict[str, Any]:
    _, duration = ensure_range(source, start, end)
    target.parent.mkdir(parents=True, exist_ok=True)

    attempts = [
        ("videotoolbox_decode", True),
        ("native_decode_fallback", False),
    ]

    errors: list[str] = []

    for label, hw_decode in attempts:
        partial = atomic_path(target)
        partial.unlink(missing_ok=True)

        try:
            run(
                exact_vt_command(
                    source,
                    start,
                    duration,
                    partial,
                    hw_decode=hw_decode,
                ),
                timeout=max(180, int(duration * 10) + 60),
            )

            info = verify_output(
                partial,
                duration,
                tolerance=max(0.20, duration * 0.01),
            )

            os.replace(partial, target)

            return {
                "method": label,
                "duration": info["duration"],
                "bytes": target.stat().st_size,
            }

        except Exception as exc:
            partial.unlink(missing_ok=True)
            errors.append(f"{label}: {exc}")

    raise RuntimeError(
        "Fallaron encode hardware + fallback decode:\n"
        + "\n\n".join(errors)
    )

def cut_fast_copy(
    source: Path,
    start: float,
    end: float,
    output: Path,
) -> dict[str, Any]:
    _, duration = ensure_range(source, start, end)

    partial = atomic_path(output)
    partial.unlink(missing_ok=True)

    cmd = [
        FFMPEG,
        "-hide_banner",
        "-loglevel", "warning",
        "-y",
        "-ss", f"{start:.6f}",
        "-t", f"{duration:.6f}",
        "-i", str(source),
        "-map", "0:v:0?",
        "-map", "0:a:0?",
        "-c", "copy",
        "-avoid_negative_ts", "make_zero",
        "-movflags", "+faststart",
        str(partial),
    ]

    try:
        run(cmd, timeout=180)
        info = verify_output(
            partial,
            duration,
            # copy depende de keyframes; es modo rápido, no frame exacto.
            tolerance=max(2.5, duration * 0.05),
        )
        os.replace(partial, output)
    except Exception:
        partial.unlink(missing_ok=True)
        raise

    return {
        "mode": "fast_copy",
        "output": str(output),
        "duration": info["duration"],
        "bytes": output.stat().st_size,
    }

def cut_exact(
    source: Path,
    start: float,
    end: float,
    output: Path,
) -> dict[str, Any]:
    result = encode_exact_part(
        source,
        start,
        end,
        output,
    )

    return {
        "mode": "exact_vt",
        "profile": PROFILE_ID,
        "output": str(output),
        **result,
    }

def part_cache_path(
    source: Path,
    source_fingerprint: str,
    start: float,
    end: float,
) -> Path:
    key_payload = json.dumps(
        {
            "fingerprint": source_fingerprint,
            "start": round(start, 6),
            "end": round(end, 6),
            "profile": PROFILE_ID,
        },
        sort_keys=True,
    ).encode()

    key = hashlib.sha256(key_payload).hexdigest()[:24]

    return (
        CACHE_ROOT
        / source_fingerprint[:16]
        / f"PART_{key}.mp4"
    )

def validate_cached_part(
    path: Path,
    expected_duration: float,
) -> bool:
    try:
        verify_output(
            path,
            expected_duration,
            tolerance=max(0.20, expected_duration * 0.01),
        )
        return True
    except Exception:
        return False

def concat_parts(
    parts: list[Path],
    output: Path,
    expected_duration: float,
) -> dict[str, Any]:
    partial = atomic_path(output)
    partial.unlink(missing_ok=True)

    with tempfile.TemporaryDirectory(
        prefix="abraxas-concat-"
    ) as tmp:
        concat_file = Path(tmp) / "concat.txt"

        def esc(value: str) -> str:
            return value.replace("'", "'\\''")

        concat_file.write_text(
            "\n".join(
                f"file '{esc(str(part.resolve()))}'"
                for part in parts
            )
            + "\n",
            encoding="utf-8",
        )

        cmd = [
            FFMPEG,
            "-hide_banner",
            "-loglevel", "warning",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            "-movflags", "+faststart",
            str(partial),
        ]

        try:
            run(cmd, timeout=max(180, int(expected_duration * 3) + 60))
            info = verify_output(
                partial,
                expected_duration,
                tolerance=max(0.35, expected_duration * 0.01),
            )
            os.replace(partial, output)
        except Exception:
            partial.unlink(missing_ok=True)
            raise

    return {
        "output": str(output),
        "duration": info["duration"],
        "bytes": output.stat().st_size,
    }

def load_cut_job(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))

    if data.get("schemaVersion") != CUT_SCHEMA:
        raise ValueError(
            f"schemaVersion debe ser {CUT_SCHEMA}"
        )

    segments = data.get("segments")

    if not isinstance(segments, list) or not segments:
        raise ValueError("segments debe contener al menos un rango.")

    return data

def execute_job(job_path: Path) -> dict[str, Any]:
    job = load_cut_job(job_path)

    source = Path(job["sourcePath"]).expanduser().resolve()
    output = Path(job["outputPath"]).expanduser().resolve()

    mode = str(job.get("mode") or "exact_vt")
    raw_segments = job["segments"]

    segments: list[tuple[float, float]] = []

    for index, segment in enumerate(raw_segments):
        start = parse_time(segment["sourceStart"])
        end = parse_time(segment["sourceEnd"])

        try:
            ensure_range(source, start, end)
        except Exception as exc:
            raise ValueError(
                f"Segmento {index + 1}: {exc}"
            ) from exc

        segments.append((start, end))

    if len(segments) == 1:
        start, end = segments[0]

        if mode in {"fast_copy", "fast_passthrough"}:
            result = cut_fast_copy(
                source,
                start,
                end,
                output,
            )
        else:
            result = cut_exact(
                source,
                start,
                end,
                output,
            )

        result.update({
            "schemaVersion": ENGINE_SCHEMA,
            "segmentCount": 1,
        })

        return result

    # Multicut usa el patrón probado:
    # exact canonical PARTS -> concat -c copy.
    fingerprint = sampled_fingerprint(source)
    parts: list[Path] = []
    part_report: list[dict[str, Any]] = []
    expected_total = 0.0

    for index, (start, end) in enumerate(segments, start=1):
        duration = end - start
        expected_total += duration

        part = part_cache_path(
            source,
            fingerprint,
            start,
            end,
        )

        reused = validate_cached_part(
            part,
            duration,
        ) if part.exists() else False

        if not reused:
            part.parent.mkdir(parents=True, exist_ok=True)
            encode_exact_part(
                source,
                start,
                end,
                part,
            )

        parts.append(part)

        part_report.append({
            "index": index,
            "sourceStart": start,
            "sourceEnd": end,
            "duration": duration,
            "cachePath": str(part),
            "cacheHit": reused,
        })

    output_report = concat_parts(
        parts,
        output,
        expected_total,
    )

    return {
        "schemaVersion": ENGINE_SCHEMA,
        "mode": "canonical_parts_concat_copy",
        "profile": PROFILE_ID,
        "sourceFingerprint": fingerprint,
        "segmentCount": len(parts),
        "parts": part_report,
        **output_report,
    }

def preflight() -> dict[str, Any]:
    encoders = run([
        FFMPEG,
        "-hide_banner",
        "-encoders",
    ]).stdout

    ok_vt = "h264_videotoolbox" in encoders

    if not ok_vt:
        raise RuntimeError(
            "FFmpeg no expone h264_videotoolbox."
        )

    return {
        "schemaVersion": ENGINE_SCHEMA,
        "ffmpeg": FFMPEG,
        "ffprobe": FFPROBE,
        "videoEncoder": "h264_videotoolbox",
        "profile": PROFILE_ID,
        "status": "pass",
    }

def generate_test_source(target: Path) -> None:
    cmd = [
        FFMPEG,
        "-hide_banner",
        "-loglevel", "warning",
        "-y",
        "-f", "lavfi",
        "-i", "testsrc2=size=640x360:rate=30",
        "-f", "lavfi",
        "-i", "sine=frequency=1000:sample_rate=48000",
        "-t", "6",
        "-c:v", "h264_videotoolbox",
        "-b:v", "4M",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        "-movflags", "+faststart",
        str(target),
    ]

    run(cmd, timeout=120)
    verify_output(target, 6.0, tolerance=0.35)

def self_test() -> dict[str, Any]:
    preflight()

    with tempfile.TemporaryDirectory(
        prefix="abraxas-media-selftest-"
    ) as tmp:
        root = Path(tmp)
        source = root / "source.mp4"
        simple = root / "simple.mp4"
        multi = root / "multi.mp4"
        job = root / "job.json"

        generate_test_source(source)

        simple_result = cut_exact(
            source,
            1.0,
            2.5,
            simple,
        )

        payload = {
            "schemaVersion": CUT_SCHEMA,
            "sourcePath": str(source),
            "outputPath": str(multi),
            "mode": "exact_vt",
            "segments": [
                {
                    "sourceStart": 0.4,
                    "sourceEnd": 1.4,
                },
                {
                    "sourceStart": 3.0,
                    "sourceEnd": 4.3,
                },
            ],
        }

        job.write_text(
            json.dumps(payload, indent=2),
            encoding="utf-8",
        )

        multi_result = execute_job(job)

        # Segunda corrida: debe reutilizar cache.
        second = execute_job(job)

        if not all(
            item.get("cacheHit")
            for item in second.get("parts", [])
        ):
            raise RuntimeError(
                "Self-test esperaba PART cache hit en segunda corrida."
            )

        return {
            "schemaVersion": ENGINE_SCHEMA,
            "status": "pass",
            "simple": simple_result,
            "multicut": multi_result,
            "cacheReuse": True,
        }

def cmd_preflight(_: argparse.Namespace) -> None:
    print(json.dumps(
        preflight(),
        indent=2,
        ensure_ascii=False,
    ))

def cmd_probe(args: argparse.Namespace) -> None:
    print(json.dumps(
        probe(Path(args.source)),
        indent=2,
        ensure_ascii=False,
    ))

def cmd_cut(args: argparse.Namespace) -> None:
    source = Path(args.source).expanduser().resolve()
    output = Path(args.out).expanduser().resolve()
    start = parse_time(args.start)
    end = parse_time(args.end)

    if args.mode == "fast_copy":
        result = cut_fast_copy(
            source,
            start,
            end,
            output,
        )
    else:
        result = cut_exact(
            source,
            start,
            end,
            output,
        )

    print(json.dumps(
        result,
        indent=2,
        ensure_ascii=False,
    ))

def cmd_multicut(args: argparse.Namespace) -> None:
    result = execute_job(
        Path(args.job).expanduser().resolve()
    )

    print(json.dumps(
        result,
        indent=2,
        ensure_ascii=False,
    ))

def cmd_self_test(_: argparse.Namespace) -> None:
    print(json.dumps(
        self_test(),
        indent=2,
        ensure_ascii=False,
    ))

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Abraxas Media Engine"
    )
    sub = parser.add_subparsers(
        dest="command",
        required=True,
    )

    p = sub.add_parser("preflight")
    p.set_defaults(fn=cmd_preflight)

    p = sub.add_parser("probe")
    p.add_argument("--source", required=True)
    p.set_defaults(fn=cmd_probe)

    p = sub.add_parser("cut")
    p.add_argument("--source", required=True)
    p.add_argument("--start", required=True)
    p.add_argument("--end", required=True)
    p.add_argument("--out", required=True)
    p.add_argument(
        "--mode",
        choices=["exact_vt", "fast_copy"],
        default="exact_vt",
    )
    p.set_defaults(fn=cmd_cut)

    p = sub.add_parser("multicut")
    p.add_argument("--job", required=True)
    p.set_defaults(fn=cmd_multicut)

    p = sub.add_parser("self-test")
    p.set_defaults(fn=cmd_self_test)

    args = parser.parse_args()
    args.fn(args)

if __name__ == "__main__":
    main()
