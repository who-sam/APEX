#!/usr/bin/env python3
"""Feature-coverage radar comparing APEX vs Moodle, Canvas, HackerRank, CodeRunner.

Scores 0-5 are subjective and based on the comparison criteria documented in
chapter 2 (literature). Adjust before defence if better data is available.
"""
import sys
import numpy as np
import matplotlib.pyplot as plt

CATEGORIES = [
    "Live coding\n(Monaco)",
    "Auto-grading\nvia sandbox",
    "MCQ + written\nin one exam",
    "Manual grading\nqueue",
    "Class invite\n+ rosters",
    "Reminders\n(in-app + email)",
    "Self-host\n(simple)",
]

SYSTEMS = {
    "APEX":        [5, 4, 5, 5, 4, 4, 5],
    "Moodle":      [2, 2, 5, 5, 5, 5, 3],
    "Canvas":      [2, 2, 5, 5, 5, 5, 1],
    "HackerRank":  [5, 5, 2, 1, 2, 3, 1],
    "CodeRunner":  [4, 4, 1, 1, 4, 3, 4],
}


def main(out_path: str) -> None:
    angles = np.linspace(0, 2 * np.pi, len(CATEGORIES), endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    for label, values in SYSTEMS.items():
        v = values + values[:1]
        ax.plot(angles, v, linewidth=1.6, label=label)
        ax.fill(angles, v, alpha=0.08)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(CATEGORIES, fontsize=9)
    ax.set_yticks([1, 2, 3, 4, 5])
    ax.set_yticklabels(["1", "2", "3", "4", "5"], fontsize=8)
    ax.set_ylim(0, 5)
    ax.set_title("Feature coverage (0--5, higher is better)", pad=18, fontsize=11)
    ax.legend(loc="upper right", bbox_to_anchor=(1.25, 1.05), fontsize=9)
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "F1.2_feature-radar.pdf")
