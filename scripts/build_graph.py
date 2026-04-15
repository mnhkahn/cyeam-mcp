"""从 _backlinks.json 生成知识关系图（PNG/SVG）。

依赖: pip install networkx matplotlib
"""

import json
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import networkx as nx

WIKI_DIR = Path(__file__).parent.parent / "wiki"
STATIC_DIR = Path(__file__).parent.parent / "static"


def load_backlinks() -> dict:
    path = WIKI_DIR / "_backlinks.json"
    return json.loads(path.read_text(encoding="utf-8"))


def build_graph(backlinks: dict) -> nx.DiGraph:
    G = nx.DiGraph()
    for source, targets in backlinks.items():
        G.add_node(source)
        for target in targets:
            G.add_edge(source, target)
    return G


def draw_graph(G: nx.DiGraph, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(12, 10))
    pos = nx.spring_layout(G, k=2, iterations=50, seed=42)

    nx.draw_networkx_nodes(G, pos, node_size=800, node_color="skyblue", alpha=0.9)
    nx.draw_networkx_labels(G, pos, font_size=8, font_family="sans-serif")
    nx.draw_networkx_edges(
        G, pos, arrows=True, arrowsize=15, edge_color="gray", alpha=0.5, width=1
    )

    plt.title("Wiki Knowledge Graph", fontsize=14)
    plt.axis("off")
    plt.tight_layout()

    png_path = output_dir / "graph.png"
    svg_path = output_dir / "graph.svg"
    plt.savefig(png_path, dpi=150, bbox_inches="tight")
    plt.savefig(svg_path, format="svg", bbox_inches="tight")
    print(f"Graph saved to {png_path} and {svg_path}")


if __name__ == "__main__":
    backlinks = load_backlinks()
    G = build_graph(backlinks)
    draw_graph(G, STATIC_DIR)
