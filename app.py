from flask import Flask, render_template, request, jsonify
import json
import time
from geopy.distance import geodesic

from dijkstra import dijkstra
from A_star_search import a_star_search
from bfs import bfs
from dfs import dfs

app = Flask(__name__)

with open("graph_mentese_custom.json") as f:
    graph = json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

def find_nearest_node(target_coord, coordinates):
    min_dist = float('inf')
    nearest_node = None
    
    for node, node_coord in coordinates.items():
        dist = geodesic(target_coord, node_coord).meters
        if dist < min_dist:
            min_dist = dist
            nearest_node = node
    
    return nearest_node

@app.route('/route', methods=['POST'])
def route():
    data = request.get_json()
    
    start_coord = tuple(data['start'])
    end_coord = tuple(data['end'])
    
    algorithm = data.get('algorithm', 'dijkstra') 

    coord_map = graph["coordinates"]

    start_node = find_nearest_node(start_coord, coord_map)
    end_node = find_nearest_node(end_coord, coord_map)

    if start_node == end_node:
        return jsonify({"error": "Başlangıç ve bitiş noktaları çok yakın veya aynı."}), 400

    try:
        path_nodes = []
        distance = 0
        
        algo_start_time = time.time()

        if algorithm == 'dijkstra':
            print(f"Running Dijkstra from {start_node} to {end_node}")
            path_nodes, distance = dijkstra(graph, start_node, end_node)

        elif algorithm == 'astar':
            print(f"Running A* Search from {start_node} to {end_node}")
            path_nodes, distance = a_star_search(graph, start_node, end_node)

        elif algorithm == 'bfs':
            print(f"Running BFS from {start_node} to {end_node}")
            path_nodes, distance = bfs(graph, start_node, end_node)

        elif algorithm == 'dfs':
            print(f"Running DFS from {start_node} to {end_node}")
            path_nodes, distance = dfs(graph, start_node, end_node)

        else:
            print(f"Unknown algorithm '{algorithm}', defaulting to Dijkstra.")
            path_nodes, distance = dijkstra(graph, start_node, end_node)

        execution_time = (time.time() - algo_start_time) * 1000

        print(f"Algorithm: {algorithm}")
        print(f"Path Found: {path_nodes}")
        print(f"Distance: {distance} meters")
        print(f"Time: {execution_time:.2f} ms")

        if not path_nodes:
            return jsonify({"error": "Seçilen algoritma ile bir yol bulunamadı."}), 400

        path_coords = [coord_map[node] for node in path_nodes]

        return jsonify({
            "path": path_coords,
            "distance": distance,
            "steps": len(path_nodes),
            "path_nodes": path_nodes,
            "execution_time": execution_time,
            "start_node": start_node,
            "end_node": end_node,
            "algorithm_used": algorithm
        })

    except Exception as e:
        print(f"Algoritma hatası ({algorithm}):", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Rota hesaplanırken sunucu hatası oluştu."}), 500

if __name__ == "__main__":
    app.run(debug=True)