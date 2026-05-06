#!/usr/bin/env python3
"""Grader throughput (submissions / second) vs concurrency."""
import sys
import numpy as np
import matplotlib.pyplot as plt

CONC = np.array([1, 2, 4, 8, 16, 32, 64])
# Synthetic placeholder: rises, plateaus, then degrades from Judge0 saturation.
THROUGHPUT = np.array([0.6, 1.1, 2.0, 3.4, 5.2, 6.0, 4.4])


def main(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(7, 4))
    ax.plot(CONC, THROUGHPUT, marker="o", linewidth=1.8, color="#1F4E79")
    ax.set_xlabel("Concurrent submissions")
    ax.set_ylabel("Submissions / second")
    ax.set_title("Auto-grader throughput vs concurrency")
    ax.set_xscale("log", base=2)
    ax.set_xticks(CONC)
    ax.set_xticklabels([str(c) for c in CONC])
    ax.grid(alpha=0.3)
    ax.axvline(16, linestyle="--", color="#27ae60", alpha=0.6,
               label="optimal concurrency")
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "F10.2_grader-throughput.pdf")
