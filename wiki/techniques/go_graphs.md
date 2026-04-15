---
title: Go Graphs
type: techniques
created: 2014-12-26
last_updated: 2026-04-15
related: ["[[Go Data Structures]]", "[[Search Engine Crawlers]]", "[[Go Performance Optimization]]"]
sources: ["303bceb2ee84"]
---

# Go Graphs

## Directed Graph (Adjacency List)

In December 2014, the subject implemented a directed graph in Go using an adjacency list to study graph traversal algorithms. The implementation uses three structs: `Graph` (the container), `Vertex` (a node), and `Edge` (a linked list of outgoing edges).

```go
type Graph struct {
    edgnum int
    vexnum int
    adj    []Vertex
}

type Vertex struct {
    Data string
    e    *Edge
}

type Edge struct {
    ivex int
    next *Edge
}
```

### Basic Operations

- **InsertVertex** — appends a vertex to the `adj` slice.
- **InsertEdge** — appends an edge to the linked list associated with the source vertex.
- **Adjacent** — returns all vertices reachable from a given vertex (also used to compute out-degree).
- **InDegree** — scans all edge lists to count incoming edges for a given vertex.

### Traversal

Two standard traversals were implemented, both using a Go `map[int]Vertex` to track visited nodes and prevent infinite loops on cyclic graphs.

**Breadth-First Search (BFS)** uses a slice as a queue:

```go
func (this *Graph) Bfs() {
    res := map[int]Vertex{}
    for _, a := range this.adj {
        Q := []Vertex{a}
        for len(Q) != 0 {
            u := Q[0]
            Q = Q[1:]
            if _, ok := res[this.get_position(u.Data)]; !ok {
                Q = append(Q, this.Adjacent(u)...)
                res[this.get_position(u.Data)] = u
            }
        }
    }
}
```

**Depth-First Search (DFS)** uses recursion:

```go
func (this *Graph) Dfs() {
    res := map[int]Vertex{}
    for _, a := range this.adj {
        this.dfs(a, res)
    }
}

func (this *Graph) dfs(u Vertex, res map[int]Vertex) {
    if _, ok := res[this.get_position(u.Data)]; !ok {
        res[this.get_position(u.Data)] = u
        for p := u.e; p != nil; p = p.next {
            if _, ok := res[p.ivex]; !ok {
                this.dfs(this.adj[p.ivex], res)
            }
        }
    }
}
```

The subject noted that adjacency lists are well suited for sparse graphs, whereas adjacency matrices are preferable for dense graphs.
