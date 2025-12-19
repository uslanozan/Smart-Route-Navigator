def calculate_distance(graph, path):
    """Bulunan yolun toplam ağırlığını (metre) hesaplar."""
    total_dist = 0
    edges = graph["edges"]
    for i in range(len(path) - 1):
        u, v = path[i], path[i+1]
        if u in edges:
            for edge in edges[u]:
                if edge["node"] == v:
                    total_dist += edge["weight"]
                    break
    return total_dist

def dfs(graph, start_point, end_point):
    edges = graph["edges"]
    
    stack = [(start_point, [start_point])]
    visited = set()
    
    while stack:
        current_node, path = stack.pop()
        
        if current_node == end_point:
            return path, calculate_distance(graph, path)
        
        if current_node not in visited:
            visited.add(current_node)
            
            neighbors = edges.get(current_node, [])
            for neighbor in neighbors:
                next_node = neighbor["node"]
                if next_node not in visited:
                    new_path = list(path)
                    new_path.append(next_node)
                    stack.append((next_node, new_path))
                    
    return [], 0

if __name__ == "__main__":
    test_graph = {
        "nodes": ["A", "B", "C", "D"],
        "edges": {
            "A": [{"node": "B", "weight": 2}, {"node": "C", "weight": 4}],
            "B": [{"node": "C", "weight": 1}, {"node": "D", "weight": 7}],
            "C": [{"node": "D", "weight": 3}],
            "D": []
        }
    }
    print("DFS Result:", dfs(test_graph, "A", "D"))