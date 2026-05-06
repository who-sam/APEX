#!/usr/bin/env python3
"""Objectives-vs-evidence matrix as a heat map.

Cells show the strength of evidence (0=none, 1=weak, 2=partial, 3=strong)
that each project objective was met by each evaluation channel.
"""
import sys
import numpy as np
import matplotlib.pyplot as plt

OBJECTIVES = [
    "O1 mixed-format exam",
    "O2 auto-grade coding",
    "O3 manual grade written",
    "O4 secure auth + IDOR",
    "O5 self-hostable",
    "O6 usable for both roles",
]
CHANNELS = ["Unit & integration tests", "End-to-end demo", "Latency / throughput bench", "Security review", "SUS user study"]

# rows = objectives, cols = channels
DATA = np.array([
    [3, 3, 2, 1, 2],
    [3, 3, 3, 1, 2],
    [2, 3, 1, 1, 2],
    [2, 1, 0, 3, 1],
    [1, 3, 1, 0, 1],
    [1, 2, 0, 0, 3],
])


def main(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(8, 4.5))
    im = ax.imshow(DATA, cmap="YlGnBu", vmin=0, vmax=3, aspect="auto")
    ax.set_xticks(range(len(CHANNELS)))
    ax.set_xticklabels(CHANNELS, rotation=20, ha="right")
    ax.set_yticks(range(len(OBJECTIVES)))
    ax.set_yticklabels(OBJECTIVES)
    for i in range(DATA.shape[0]):
        for j in range(DATA.shape[1]):
            ax.text(j, i, str(DATA[i, j]), ha="center", va="center",
                    color="black" if DATA[i, j] < 2 else "white", fontsize=9)
    cbar = fig.colorbar(im, ax=ax, ticks=[0, 1, 2, 3], shrink=0.8)
    cbar.ax.set_yticklabels(["0 none", "1 weak", "2 partial", "3 strong"])
    ax.set_title("Objectives-vs-evidence matrix")
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "F10.4_objectives-matrix.pdf")
