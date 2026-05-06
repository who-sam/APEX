#!/usr/bin/env python3
"""Endpoint usage heatmap (which endpoint is hit by which client surface).

Rows are roles, columns are endpoint groups. Values are 0/1 access counts
for documentation purposes (replace with real telemetry if available).
"""
import sys
import numpy as np
import matplotlib.pyplot as plt

ROLES = ["public", "student", "teacher", "scheduler"]
GROUPS = ["/auth", "/classes", "/exams", "/problems", "/test-cases",
          "/submissions", "/student/*", "/notifications", "/profile",
          "/announcements", "/folders"]

# 1 = called, 0 = blocked / not used
ACCESS = np.array([
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],  # public
    [1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],  # student
    [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1],  # teacher
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],  # scheduler (notification.Create + email)
])


def main(out_path: str) -> None:
    fig, ax = plt.subplots(figsize=(9, 3.2))
    im = ax.imshow(ACCESS, cmap="Blues", aspect="auto")
    ax.set_xticks(range(len(GROUPS)))
    ax.set_xticklabels(GROUPS, rotation=30, ha="right", fontsize=9)
    ax.set_yticks(range(len(ROLES)))
    ax.set_yticklabels(ROLES, fontsize=9)
    for i in range(ACCESS.shape[0]):
        for j in range(ACCESS.shape[1]):
            ax.text(j, i, "yes" if ACCESS[i, j] else "—", ha="center", va="center",
                    color="white" if ACCESS[i, j] else "gray", fontsize=8)
    ax.set_title("API access matrix by role")
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "FA.1_endpoint-heatmap.pdf")
