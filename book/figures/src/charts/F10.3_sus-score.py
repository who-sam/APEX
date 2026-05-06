#!/usr/bin/env python3
"""System Usability Scale results (placeholder until study data lands)."""
import sys
import numpy as np
import matplotlib.pyplot as plt

# Replace with measured per-respondent SUS scores from the user study.
TEACHERS = np.array([84, 78, 90, 72, 80, 76])
STUDENTS = np.array([74, 82, 68, 78, 70, 72, 80, 84, 66, 76])


def main(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(7, 4))
    bp = ax.boxplot([STUDENTS, TEACHERS], labels=["Students (n=10)", "Teachers (n=6)"],
                    patch_artist=True, widths=0.5)
    for patch, color in zip(bp["boxes"], ["#1F4E79", "#5DADE2"]):
        patch.set_facecolor(color)
        patch.set_alpha(0.65)
    ax.axhline(68, color="#e67e22", linestyle="--", linewidth=1.2,
               label="SUS = 68 (industry average)")
    ax.set_ylabel("SUS score")
    ax.set_title("Perceived usability (SUS) by role")
    ax.set_ylim(40, 100)
    ax.grid(axis="y", alpha=0.3)
    ax.legend()
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "F10.3_sus-score.pdf")
