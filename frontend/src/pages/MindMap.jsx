import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Circle, Rect, Text, Line } from "react-konva";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function MindMap() {
  const { user } = useAuth();
  const socket = useSocket();

  // user gets their own roomId (their userId)
  const roomId = user?._id;

  const stageRef = useRef(null);
  const containerRef = useRef(null);

  const [stageSize, setStageSize] = useState({ width: 640, height: 360 });
  const [nodes, setNodes] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [history, setHistory] = useState([]);

  // Debug
  useEffect(() => {
  //  console.log(" MindMap using per-user roomId:", roomId);
  }, [roomId]);

  // 🔹 Setup socket listeners
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("joinMindMap", { roomId });

    socket.on("updateNodes", (serverNodes) => setNodes(serverNodes));
    socket.on("updateLines", (serverLines) => setLines(serverLines));
    socket.on("addShape", (shape) => setNodes((prev) => [...prev, shape]));
    socket.on("drawing", (data) => setLines((prev) => [...prev, data.line]));
    socket.on("moveNode", (data) =>
      setNodes((prev) => prev.map((n) => (n.id === data.node.id ? data.node : n)))
    );
    socket.on("editNodeText", (data) =>
      setNodes((prev) => prev.map((n) => (n.id === data.node.id ? data.node : n)))
    );
    socket.on("clearBoard", () => {
      setNodes([]);
      setLines([]);
      setHistory([]);
    });

    // cleanup
    return () => {
      socket.off("updateNodes");
      socket.off("updateLines");
      socket.off("addShape");
      socket.off("drawing");
      socket.off("moveNode");
      socket.off("editNodeText");
      socket.off("clearBoard");
    };
  }, [socket, roomId]);

  // Responsive board sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = (width) => {
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;
      const targetWidth = Math.round(width);
      const idealH = Math.round((targetWidth * 9) / 16);

      const minH = 220;
      const maxH = Math.floor(vh * 0.6);
      const height = Math.max(minH, Math.min(idealH, maxH));

      setStageSize({ width: targetWidth, height });
    };

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateSize(entry.contentRect.width);
      }
    });

    ro.observe(containerRef.current);
    updateSize(containerRef.current.getBoundingClientRect().width);

    return () => ro.disconnect();
  }, []);

  //  Handlers 
  const handleStageBlankClick = (e) => {
    if (e.target !== e.target.getStage()) return;
    const pos = e.target.getStage().getPointerPosition();

    const newNode = {
      id: Date.now(),
      type: "circle",
      x: pos.x,
      y: pos.y,
      text: `Node ${nodes.length + 1}`,
    };

    setNodes((prev) => [...prev, newNode]);
    setHistory((prev) => [...prev, { type: "node", id: newNode.id }]);

    socket?.emit("addShape", { roomId, userId: user._id, shape: newNode });
  };

  const handleNodeClick = (node) => {
    if (selectedNode && selectedNode.id !== node.id) {
      const newLine = { from: selectedNode.id, to: node.id };
      setLines((prev) => [...prev, newLine]);
      setHistory((prev) => [...prev, { type: "line", from: selectedNode.id, to: node.id }]);
      setSelectedNode(null);

      socket?.emit("drawing", { roomId, userId: user._id, line: newLine });
    } else {
      setSelectedNode(node);
    }
  };

  const handleDragEnd = (node, e) => {
    const updatedNode = { ...node, x: e.target.x(), y: e.target.y() };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));

    socket?.emit("moveNode", { roomId, userId: user._id, node: updatedNode });
  };

  const handleDoubleClick = (node) => {
    const newText = prompt("Edit node text:", node.text);
    if (!newText) return;
    const updatedNode = { ...node, text: newText };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));

    socket?.emit("editNodeText", { roomId, userId: user._id, node: updatedNode });
  };

  const startLine = (stage) => {
    const pos = stage.getPointerPosition();
    const newLine = {
      freehand: true,
      points: [pos.x, pos.y],
      stroke: "black",
      strokeWidth: 2,
      tension: 0.5,
      lineCap: "round",
      lineJoin: "round",
    };
    setLines((prev) => [...prev, newLine]);
    setHistory((prev) => [...prev, { type: "line" }]);
    setDrawing(true);
  };

  const extendLine = (stage) => {
    if (!drawing) return;
    const pos = stage.getPointerPosition();
    setLines((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (!last.freehand) return prev;
      const updatedLast = { ...last, points: [...last.points, pos.x, pos.y] };
      return [...prev.slice(0, -1), updatedLast];
    });
  };

  const endLine = () => setDrawing(false);

  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];

      if (last.type === "node") {
        setNodes((prevNodes) => prevNodes.filter((n) => n.id !== last.id));
        setLines((prevLines) => prevLines.filter((l) => l.from !== last.id && l.to !== last.id));
      } else if (last.type === "line") {
        setLines((prevLines) => prevLines.slice(0, -1));
      }

      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setNodes([]);
    setLines([]);
    setHistory([]);
    socket?.emit("clearBoard", { roomId, userId: user._id });
  };

  const onStageMouseDown = (e) => {
    if (e.target === e.target.getStage()) startLine(e.target.getStage());
  };
  const onStageMouseMove = (e) => extendLine(e.target.getStage());
  const onStageMouseUp = endLine;

  const onStageTouchStart = (e) => {
    const stage = e.target.getStage();
    stage?.container().addEventListener("touchmove", (ev) => ev.preventDefault(), {
      passive: false,
    });
    startLine(stage);
  };
  const onStageTouchMove = (e) => extendLine(e.target.getStage());
  const onStageTouchEnd = endLine;

  return (
    <div className="flex flex-col items-center p-4 sm:p-5 space-y-4 sm:space-y-5">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">
        My Personal Whiteboard 🧠
      </h1>

      <div className="flex gap-4 text-2xl cursor-pointer select-none">
        <span onClick={handleUndo} title="Undo Last" className="hover:scale-110 transition-transform">🩹</span>
        <span onClick={handleClear} title="Clear All" className="hover:scale-110 transition-transform">🧹</span>
      </div>

      <div
        ref={containerRef}
        className="w-full max-w-4xl md:max-w-5xl lg:max-w-6xl rounded-xl shadow bg-white overflow-hidden"
      >
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          ref={stageRef}
          onClick={handleStageBlankClick}
          onMouseDown={onStageMouseDown}
          onMouseMove={onStageMouseMove}
          onMouseUp={onStageMouseUp}
          onTouchStart={onStageTouchStart}
          onTouchMove={onStageTouchMove}
          onTouchEnd={onStageTouchEnd}
          className="bg-gray-100"
        >
          <Layer>
            {/* Lines */}
            {lines.map((line, i) =>
              line.freehand ? (
                <Line key={i} {...line} />
              ) : (
                (() => {
                  const fromNode = nodes.find((n) => n.id === line.from);
                  const toNode = nodes.find((n) => n.id === line.to);
                  if (!fromNode || !toNode) return null;
                  return (
                    <Line
                      key={i}
                      points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
                      stroke="black"
                      strokeWidth={2}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                    />
                  );
                })()
              )
            )}

            {/* Nodes */}
            {nodes.map((node) =>
              node.type === "circle" ? (
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
                  <Text x={node.x - 28} y={node.y - 8} text={node.text} fontSize={14} fill="white" />
                </React.Fragment>
              ) : (
                <React.Fragment key={node.id}>
                  <Rect
                    x={node.x}
                    y={node.y}
                    width={120}
                    height={60}
                    cornerRadius={8}
                    fill={selectedNode?.id === node.id ? "orange" : "yellow"}
                    onClick={() => handleNodeClick(node)}
                    draggable
                    onDragEnd={(e) => handleDragEnd(node, e)}
                    onDblClick={() => handleDoubleClick(node)}
                  />
                  <Text
                    x={node.x + 8}
                    y={node.y + 20}
                    width={104}
                    text={node.text}
                    fontSize={14}
                    fill="black"
                    align="center"
                  />
                </React.Fragment>
              )
            )}
          </Layer>
        </Stage>
      </div>

      <p className="text-xs sm:text-sm text-center max-w-3xl px-3 text-gray-400">
        This whiteboard is private to you. Click canvas to add nodes. Click two nodes to connect them. 
        Drag to move. Double-click to edit text. Hold and drag to draw freehand (touch supported).
      </p>
    </div>
  );
}
