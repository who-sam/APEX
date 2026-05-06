#!/usr/bin/env python3
"""End-to-end submission latency distribution (synthetic until real bench data lands).

Replace SAMPLES with measurements collected by the benchmark harness in
chapter 10. Histogram + p50/p95/p99 markers.
"""
import sys
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(2026)
# log-normal mimics realistic compile + run times (skewed long tail)
SAMPLES = rng.lognormal(mean=np.log(1.4), sigma=0.55, size=1500) * 1000  # ms


def main(out_path: str) -> None:
    p50, p95, p99 = np.percentile(SAMPLES, [50, 95, 99])
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.hist(SAMPLES, bins=60, color="#1F4E79", alpha=0.8)
    for label, p, color in [("p50", p50, "#2ecc71"),
                            ("p95", p95, "#f39c12"),
                            ("p99", p99, "#e74c3c")]:
        ax.axvline(p, color=color, linewidth=1.4, linestyle="--",
                   label=f"{label} = {int(p)} ms")
    ax.set_xlabel("Submission latency (ms)")
    ax.set_ylabel("Count")
    ax.set_title("End-to-end coding-submission latency (n=1500)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "F10.1_latency-distribution.pdf")
