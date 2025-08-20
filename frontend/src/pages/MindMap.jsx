import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Circle, Text, Line } from "react-konva";
import { io } from "socket.io-client";

export default function MindMap({ roomId, user }) {
  const stageRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
    });

    socketRef.current.emit("joinMindMap", { roomId });

    // Listen for node and line updates
    socketRef.current.on("updateNodes", (serverNodes) => setNodes(serverNodes));
    socketRef.current.on("updateLines", (serverLines) => setLines(serverLines));
    socketRef.current.on("addShape", (data) =>
      setNodes((prev) => [...prev, data.shape])
    );
    socketRef.current.on("drawing", (data) =>
      setLines((prev) => [...prev, data.line])
    );

    socketRef.current.on("moveNode", (data) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === data.node.id ? { ...n, x: data.node.x, y: data.node.y } : n))
      );
    });

    socketRef.current.on("editNodeText", (data) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === data.node.id ? { ...n, text: data.node.text } : n))
      );
    });

    return () => socketRef.current.disconnect();
  }, [roomId]);

  const handleStageClick = (e) => {
    if (e.target !== e.target.getStage()) return;
    const pointerPos = e.target.getStage().getPointerPosition();

    const newNode = {
      id: Date.now(),
      x: pointerPos.x,
      y: pointerPos.y,
      text: `Node ${nodes.length + 1}`,
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);

    socketRef.current.emit("addShape", { roomId, shape: newNode });
  };

  const handleNodeClick = (node) => {
    if (selectedNode && selectedNode.id !== node.id) {
      const newLine = { points: [selectedNode.x, selectedNode.y, node.x, node.y] };
      setLines((prev) => [...prev, newLine]);
      setSelectedNode(null);

      socketRef.current.emit("drawing", { roomId, line: newLine });
    } else {
      setSelectedNode(node);
    }
  };

  const handleDragEnd = (node, e) => {
    const updatedNode = { ...node, x: e.target.x(), y: e.target.y() };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    socketRef.current.emit("moveNode", { roomId, node: updatedNode });
  };

  const handleDoubleClick = (node) => {
    const newText = prompt("Edit node text:", node.text);
    if (!newText) return;
    const updatedNode = { ...node, text: newText };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    socketRef.current.emit("editNodeText", { roomId, node: updatedNode });
  };

  return (
    <div className="flex flex-col items-center justify-start p-6 space-y-6">
      <h1 className="text-3xl font-bold">Mind Map 🧠</h1>
      <p className="text-gray-600 max-w-xl text-center">
        Create and visualize your ideas collaboratively in real-time.
      </p>

      <Stage
        width={800}
        height={400}
        ref={stageRef}
        onClick={handleStageClick}
        className="bg-gray-100 rounded shadow"
      >
        <Layer>
          {lines.map((line, idx) => (
            <Line key={idx} points={line.points} stroke="black" strokeWidth={2} />
          ))}

          {nodes.map((node) => (
            <React.Fragment key={node.id}>
              <Circle
                x={node.x}
                y={node.y}
                radius={30}
                fill={selectedNode?.id === node.id ? "blue" : "green"}
                onClick={() => handleNodeClick(node)}
                draggable
                onDragEnd={(e) => handleDragEnd(node, e)}
                onDblClick={() => handleDoubleClick(node)}
              />
              <Text
                x={node.x - 25}
                y={node.y - 10}
                text={node.text}
                fontSize={14}
                fill="white"
              />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>

      <p className="text-gray-500 text-sm">
        Click canvas to add nodes. Click two nodes to connect. Drag nodes to move. Double-click node to edit text.
      </p>
    </div>
  );
}
