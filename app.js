
const { MongoClient } = require("mongodb");

class GraphService {
  constructor(connectionString, dbName, nodeCollectionName, edgeCollectionName) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.nodeCollectionName = nodeCollectionName;
    this.edgeCollectionName = edgeCollectionName;
    this.client = new MongoClient(connectionString, { useUnifiedTopology: true });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
      this.db = this.client.db(this.dbName);
      this.nodeCollection = this.db.collection(this.nodeCollectionName);
      this.edgeCollection = this.db.collection(this.edgeCollectionName);
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  async disconnect() {
    try {
      await this.client.close();
      console.log("Disconnected from MongoDB");
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
    }
  }

  async saveNodes(nodes) {
    try {
      await this.nodeCollection.insertMany(nodes);
      console.log("Nodes saved to MongoDB.");
    } catch (error) {
      console.error("Error saving nodes to MongoDB:", error);
    }
  }

  async saveEdges(edges) {
    try {
      await this.edgeCollection.insertMany(edges);
      console.log("Edges saved to MongoDB.");
    } catch (error) {
      console.error("Error saving edges to MongoDB:", error);
    }
  }
  async saveNodesAndEdges(graph){
    try {
      const nodesToSave = Array.from(graph.nodes.values());
      const edgesToSave = [];
    
      // Convert edges from the graph to a format suitable for saving in MongoDB
      for (const node of graph.nodes.values()) {
        for (const edge of node.edges) {
          edgesToSave.push({
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
            type: edge.type,
            weight: edge.weight
          });
        }
      }
      await this.saveNodes(nodesToSave);
      await this.saveEdges(edgesToSave);
    

    }catch(error){
      console.log("Error saving edges to MongoDB",error);
    }
  }
  async loadNodes() {
    try {
      const nodes = await this.nodeCollection.find().toArray();
      console.log("Nodes loaded from MongoDB.");
      return nodes;
    } catch (error) {
      console.error("Error loading nodes from MongoDB:", error);
      return [];
    }
  }
  async loadEdges() {
    try {
      const edges = await this.edgeCollection.find().toArray();
      console.log("Edges loaded from MongoDB.");
      return edges;
    } catch (error) {
      console.error("Error loading edges from MongoDB:", error);
      return [];
    }
  }
  loadGraphFromNodes(loadedNodes, loadedEdges) {
    const graph = new Graph();
    const nodesMap = new Map();

    // Create nodes with edges information
    loadedNodes.forEach(({ nodeId, type, data }) => {
      graph.addNode(nodeId, type, data);
      nodesMap.set(nodeId, graph.nodes.get(nodeId));
    });

    // Add edges to the graph
    loadedEdges.forEach(({ fromNodeId, toNodeId, type, weight }) => {
      const node = nodesMap.get(fromNodeId);
      if (node) {
        graph.addEdge(fromNodeId, toNodeId, type, weight);
      }
    });

    return graph;
  }

  async loadGraph() {
    try {
      const loadedNodes = await this.nodeCollection.find().toArray();
      const loadedEdges = await this.edgeCollection.find().toArray();
      console.log("Nodes and edges loaded from MongoDB.");
      return this.loadGraphFromNodes(loadedNodes, loadedEdges);
    } catch (error) {
      console.error("Error loading graph from MongoDB:", error);
      return null;
    }
  }
  loadSampleData() {
    const graph = new Graph();

    // Sample data for nodes
    const projectData = { title: "Sample Project", description: "This is a sample project" };
    const taskData = { title: "Sample Task", description: "This is a sample task" };
    const subTaskData = { title: "Sample Sub Task", description: "This is a sample sub-task" };
    const discussionData = { content: "This is a sample discussion" };
    const userData1 = { username: "user1", role: "developer" };
    const userData2 = { username: "user2", role: "manager" };

    // Add nodes to the graph
    graph.addNode("project1", NODE_TYPE.PROJECT, projectData);
    graph.addNode("task1", NODE_TYPE.TASK, taskData);
    graph.addNode("subtask1", NODE_TYPE.SUB_TASK, subTaskData);
    graph.addNode("user1", NODE_TYPE.USER, userData1);
    graph.addNode("user2", NODE_TYPE.USER, userData2);

    // Add edges between nodes
    graph.addEdge("project1", "task1", EDGE_TYPE.DIRECTED, EDGE_CATEGORY.ASSIGN);
    graph.addEdge("task1", "subtask1", EDGE_TYPE.DIRECTED, EDGE_CATEGORY.DEPENDENCY);

    // Add discussions to nodes and attach users to discussions
    const discussionNodeId1 = graph.addDiscussionToNode("task1", discussionData);
    graph.addEdge(discussionNodeId1, "user1", EDGE_TYPE.UNDIRECTED, EDGE_CATEGORY.RELATED);
    graph.addEdge(discussionNodeId1, "user2", EDGE_TYPE.UNDIRECTED, EDGE_CATEGORY.RELATED);

    return graph;
  }
}
const NODE_TYPE = {
    PROJECT: "project",
    TASK: "task",
    SUB_TASK: "sub_task", // New node type for sub tasks
    USER: "user",
    DISCUSSION: "discussion"
  };
  const EDGE_TYPE = {
    DIRECTED: "directed",
    UNDIRECTED: "undirected"
  };
  
  const EDGE_CATEGORY = {
    ASSIGN: "assign",
    DEPENDENCY: "dependency",
    RELATED: "related"
  };
  
  class Edge {
    constructor(fromNodeId, toNodeId, type, category, weight = 1) {
      this.fromNodeId = fromNodeId;
      this.toNodeId = toNodeId;
      this.type = type;
      this.category = category;
      this.weight = weight;
    }
  }
  class Node {
    constructor(nodeId, type, data) {
      this.nodeId = nodeId;
      this.type = type;
      this.data = data;
      this.edges = [];
    }
  }
  
  class Graph {
    constructor() {
      this.nodes = new Map();
    }
  
    // Add node to the graph
    addNode(nodeId, type, data) {
      if (!this.nodes.has(nodeId)) {
        this.nodes.set(nodeId, new Node(nodeId, type, data));
      }
    }
  
  // Add directed edge between two nodes

  addEdge(fromNodeId, toNodeId, edgeType, edgeCategory, weight = 1) {
    if (this.nodes.has(fromNodeId) && this.nodes.has(toNodeId)) {
      const edge = new Edge(fromNodeId, toNodeId, edgeType, edgeCategory, weight);
      this.nodes.get(fromNodeId).edges.push(edge);

      // if (edgeType === EDGE_TYPE.UNDIRECTED) {
      //   const reverseEdge = new Edge(toNodeId, fromNodeId, edgeType, edgeCategory, weight);
      //   this.nodes.get(toNodeId).edges.push(reverseEdge);
      // }
    }
  }
  addDiscussionToNode(parentNodeId, discussionData) {
    if (!this.nodes.has(parentNodeId)) {
      return null; // Parent node not found, cannot add discussion
    }

    const discussionNodeId = this.generateUniqueId();
    const discussionNode = new Node(discussionNodeId, NODE_TYPE.DISCUSSION, discussionData);
    this.nodes.set(discussionNodeId, discussionNode);

    // Add an "related" undirected edge between parent node and discussion node
    this.addEdge(parentNodeId, discussionNodeId, EDGE_TYPE.UNDIRECTED, EDGE_CATEGORY.RELATED);

    return discussionNodeId;
  }

  generateUniqueId() {
    // Generate a unique ID for a node (you can use any method to generate unique IDs)
    return "node_" + Math.random().toString(36).substr(2, 9);
  }

    findNodesByTypeUnderParent(parentNodeId, targetType) {
      const visited = new Set();
      const result = [];
  
      this.dfsFindNodes(parentNodeId, targetType, visited, result);
  
      return result;
    }
  
    dfsFindNodes(nodeId, targetType, visited, result) {
        if (visited.has(nodeId)) {
          return;
        }
    
        visited.add(nodeId);
    
        if (!this.nodes.has(nodeId)) {
          return;
        }
    
        const node = this.nodes.get(nodeId);
        if (node.type === targetType) {
          result.push(node);
        }
    
        const edges = node.edges;
        for (const neighborId of edges) {
          this.dfsFindNodes(neighborId, targetType, visited, result);
        }
      }

      findDiscussionsByUserUnderParent(parentNodeId, userId) {
        const discussions = [];
    
        // Perform depth-first search (DFS) to find discussions connected to the user
        this.dfsFindDiscussions(parentNodeId, userId, discussions);
    
        return discussions;
      }
    
      dfsFindDiscussions(nodeId, userId, discussions, visited = new Set()) {
        if (visited.has(nodeId)) {
          return;
        }
    
        visited.add(nodeId);
        const node = this.nodes.get(nodeId);
    
        // Check if the node is a discussion and connected to the user
        if (node.type === NODE_TYPE.DISCUSSION) {
          for (const edge of node.edges) {
            const userNode = this.nodes.get(edge.toNodeId);
            if (userNode.nodeId === userId) {
              discussions.push(node);
              break; // No need to check further for this discussion
            }
          }
        }
    
        // Continue DFS for child nodes
        for (const edge of node.edges) {
          this.dfsFindDiscussions(edge.toNodeId, userId, discussions, visited);
        }
      }
  }    function printNodesArray(nodesArray) {
        console.log("Nodes Array:");
        for (const node of nodesArray) {
          console.log(`Node ID: ${node.nodeId}`);
          console.log(`Node Type: ${node.type}`);
          if (node.data) {
            console.log("Node Data:", node.data);
          }
          console.log("-----------------------");
        }
      }
      

const graphService = new GraphService(
  "mongodb://localhost:27017",
  "graphdb-v2",
  "nodes",
  "edges"
);
(async () => {
  await graphService.connect();
  //const graph = graphService.loadSampleData();
  // ... (Add nodes and edges to the graph as shown in previous examples)
 
  const loadedNodes = await graphService.loadNodes();
  const loadedEdges = await graphService.loadEdges();
  const graph = graphService.loadGraphFromNodes(loadedNodes,loadedEdges);
  // Save nodes to MongoDB
  //await graphService.saveNodesAndEdges(graph);

  // Load nodes from MongoDB
  //const loadedNodes = await graphService.loadNodes();
  //const graph = graphService.loadGraphFromNodes(loadedNodes);
  
  const discussionsUnderSubTask1ForUser1 = graph.findDiscussionsByUserUnderParent("project1", "user1");
  printNodesArray(discussionsUnderSubTask1ForUser1);
  //console.log("Loaded nodes:", loadedNodes);

  await graphService.disconnect();
})();