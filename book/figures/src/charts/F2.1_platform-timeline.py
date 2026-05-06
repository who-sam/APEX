#!/usr/bin/env python3
"""Timeline of representative online-assessment platforms.

Shows release year of major platforms in the literature review. Intended as
a context figure: "where APEX sits in the lineage", not a benchmark.
"""
import sys
import matplotlib.pyplot as plt

PLATFORMS = [
    ("Moodle",          2002),
    ("Sakai",           2004),
    ("Canvas LMS",      2008),
    ("HackerRank",      2009),
    ("CodeRunner",      2014),
    ("Coursera grader", 2014),
    ("edX EdX-Code",    2013),
    ("Judge0",          2017),
    ("APEX",            2026),
]


def main(out_path: str) -> None:
    PLATFORMS.sort(key=lambda kv: kv[1])
    names = [p[0] for p in PLATFORMS]
    years = [p[1] for p in PLATFORMS]
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.scatter(years, [0] * len(years), s=60, color="#1F4E79", zorder=3)
    for x, y in zip(years, names):
        ax.text(x, 0.05, f"{y}\n{x}", rotation=45, ha="left", va="bottom", fontsize=8)
    ax.hlines(0, min(years) - 1, max(years) + 1, color="gray", linewidth=1)
    ax.set_yticks([])
    ax.set_xlim(min(years) - 2, max(years) + 2)
    ax.set_title("Selected online-assessment platforms by year")
    ax.spines["left"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["top"].set_visible(False)
    fig.tight_layout()
    fig.savefig(out_path, format="pdf", bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "F2.1_platform-timeline.pdf")
