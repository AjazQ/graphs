

const { MongoClient } = require("mongodb");

class GraphService {
  constructor(connectionString, dbName, collectionName) {
    this.connectionString = connectionString;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.client = new MongoClient(connectionString, { useUnifiedTopology: true });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection(this.collectionName);
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
      await this.collection.insertMany(nodes);
      console.log("Nodes saved to MongoDB.");
    } catch (error) {
      console.error("Error saving nodes to MongoDB:", error);
    }
  }

  async loadNodes() {
    try {
      const nodes = await this.collection.find().toArray();
      console.log("Nodes loaded from MongoDB.");
      return nodes;
    } catch (error) {
      console.error("Error loading nodes from MongoDB:", error);
      return [];
    }
  }
  loadGraphFromNodes(loadedNodes) {
    const graph = new Graph();

    loadedNodes.forEach(({ nodeId, type, data, edges }) => {
      graph.addNode(nodeId, type, data);
      edges.forEach((neighborId) => {
        graph.addEdge(nodeId, neighborId);
      });
    });

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
  class Node {
    constructor(nodeId, type, data) {
      this.nodeId = nodeId;
      this.type = type;
      this.data = data;
      this.edges = []; // Array to store outgoing edges (direction)
      this.reverseEdges = []; // Array to store incoming edges (reverse direction)
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
    addEdge(fromNodeId, toNodeId) {
      if (this.nodes.has(fromNodeId) && this.nodes.has(toNodeId)) {
        this.nodes.get(fromNodeId).edges.push(toNodeId);
        this.nodes.get(toNodeId).reverseEdges.push(fromNodeId);
      }
    }

    addDiscussionToNode(nodeId, author, content, userNodeId) {
        if (!this.nodes.has(nodeId)) {
          console.log("Node not found.");
          return;
        }
    
        const randomValue = Math.floor(Math.random() * 1000); // Generate a random value
        const discussionId = `discussion_${Date.now()}_${randomValue}`; // Create a unique ID for each discussion
        const discussionData = {
          author: author,
          timestamp: new Date(),
          content: content
        };
    
        const discussionNode = new Node(discussionId, NODE_TYPE.DISCUSSION, discussionData);
        this.nodes.set(discussionId, discussionNode); // Add discussion node to graph
    
        this.addEdge(nodeId, discussionId); // Add edge between the node and the discussion
    
        // If userNodeId is provided, create an edge between User node and Discussion node
        if (userNodeId && this.nodes.has(userNodeId)) {
          this.addEdge(userNodeId, discussionId);
        }
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

      findDiscussionsByUserUnderParent(parentNodeId, userNodeId) {
        const discussions = [];
        const visited = new Set();
    
        this.dfsFindDiscussions(parentNodeId, userNodeId, visited, discussions);
    
        return discussions;
      }
    
      dfsFindDiscussions(nodeId, userNodeId, visited, discussions) {
        if (visited.has(nodeId)) {
          return;
        }
    
        visited.add(nodeId);
    
        if (!this.nodes.has(nodeId)) {
          return;
        }
    
        if (this.nodes.get(nodeId).type === NODE_TYPE.DISCUSSION) {
          if (this.nodes.get(nodeId).reverseEdges.includes(userNodeId)) {
            discussions.push(this.nodes.get(nodeId));
          }
        }
    
        const edges = this.nodes.get(nodeId).edges;
        for (const neighborId of edges) {
          this.dfsFindDiscussions(neighborId, userNodeId, visited, discussions);
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
      
  // Example usage:
  //const graph = new Graph();

//   graph.addNode("project1", NODE_TYPE.PROJECT, { name: "Project A", description: "This is project A" });
//   graph.addNode("project2", NODE_TYPE.PROJECT, { name: "Project B", description: "This is project B" });
//   graph.addNode("task1", NODE_TYPE.TASK, { description: "Task 1" });
//   graph.addNode("task2", NODE_TYPE.TASK, { description: "Task 2" });
//   graph.addNode("user1", NODE_TYPE.USER, { name: "John Doe", email: "john@example.com" });
//   graph.addNode("user1", NODE_TYPE.USER, { name: "Jane Smith", email: "jane@example.com" });

//   // Add a sample sub task under "task1"
//   graph.addNode("subTask1", NODE_TYPE.SUB_TASK, { description: "Sub Task 1", parentTask: "task1" });
//   graph.addNode("subTask2", NODE_TYPE.SUB_TASK, { description: "Sub Task 2", parentTask: "task1" });
  
//   // Add some sample sub tasks under "task2"
//   graph.addNode("subTask3", NODE_TYPE.SUB_TASK, { description: "Sub Task 3", parentTask: "task2" });
//   graph.addNode("subTask4", NODE_TYPE.SUB_TASK, { description: "Sub Task 4", parentTask: "task2" });
  
//   //graph.addEdge("project1", "project2");
//   graph.addEdge("project1", "task1");
//   graph.addEdge("project1", "task2");
//   graph.addEdge("task1", "user1");
  
//   // Add edges between task1 and its sub tasks
//   graph.addEdge("task1", "subTask1");
//   graph.addEdge("task1", "subTask2");
  
//   // Add edges between task2 and its sub tasks
//   graph.addEdge("task2", "subTask3");
//   graph.addEdge("task2", "subTask4");
  

// const projectsUnderProject1 = graph.findNodesByTypeUnderParent("project1", NODE_TYPE.SUB_TASK);
// //console.log("Sub tasks under project1:", projectsUnderProject1);
// //printNodesArray(projectsUnderProject1);

// graph.addDiscussionToNode("subTask1", "John Doe", "Discussing progress...","user1");
// graph.addDiscussionToNode("subTask1", "Jane Smith", "Need more information...","user2");

// // Add discussions to "project1"
// graph.addDiscussionToNode("project1", "Alice", "Project status update...","user1");
// graph.addDiscussionToNode("project1", "Bob", "Budget discussion...","user2");

// // Find all discussions under "subTask1"
// const discussionsUnderSubTask1 = graph.findNodesByTypeUnderParent("subTask1", NODE_TYPE.DISCUSSION);
// //printNodesArray(discussionsUnderSubTask1);
// //  console.log(graph.getNodes());
// const discussionsUnderSubTask1ForUser1 = graph.findDiscussionsByUserUnderParent("project1", "user1");
// printNodesArray(discussionsUnderSubTask1ForUser1);
// //console.log("Discussions under subTask1 connected to user1:", discussionsUnderSubTask1ForUser1);  


const graphService = new GraphService("mongodb://localhost:27017", "graphdb-v2", "nodes");

(async () => {
  await graphService.connect();

  // ... (Add nodes and edges to the graph as shown in previous examples)

  // Save nodes to MongoDB
  //const nodesToSave = Array.from(graph.nodes.values());
  //await graphService.saveNodes(nodesToSave);

  // Load nodes from MongoDB
  const loadedNodes = await graphService.loadNodes();
  const graph = graphService.loadGraphFromNodes(loadedNodes);
  
  const discussionsUnderSubTask1ForUser1 = graph.findDiscussionsByUserUnderParent("project1", "user1");
  printNodesArray(discussionsUnderSubTask1ForUser1);
  //console.log("Loaded nodes:", loadedNodes);

  await graphService.disconnect();
})();