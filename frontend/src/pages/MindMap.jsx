import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Circle, Rect, Text, Line } from "react-konva";
import { io } from "socket.io-client";

export default function MindMap({ roomId }) {
  const stageRef = useRef(null);
  const containerRef = useRef(null);

  // Smaller default + we'll clamp height responsively
  const [stageSize, setStageSize] = useState({ width: 640, height: 360 });
  const [nodes, setNodes] = useState([]);
  const [lines, setLines] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawing, setDrawing] = useState(false);

  const socketRef = useRef(null);

  // Socket setup 
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });
    socketRef.current.emit("joinMindMap", { roomId });

    socketRef.current.on("updateNodes", (serverNodes) => setNodes(serverNodes));
    socketRef.current.on("updateLines", (serverLines) => setLines(serverLines));
    socketRef.current.on("addShape", (data) => setNodes((prev) => [...prev, data.shape]));
    socketRef.current.on("drawing", (data) =>
      setLines((prev) => [...prev, data.line])
    );
    socketRef.current.on("moveNode", (data) =>
      setNodes((prev) => prev.map((n) => (n.id === data.node.id ? data.node : n)))
    );
    socketRef.current.on("editNodeText", (data) =>
      setNodes((prev) => prev.map((n) => (n.id === data.node.id ? data.node : n)))
    );

    return () => socketRef.current?.disconnect();
  }, [roomId]);

  // Responsive Stage: fit to container, but don't get too tall 
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = (width) => {
      const vw = window.innerWidth || document.documentElement.clientWidth || 0;
      const vh = window.innerHeight || document.documentElement.clientHeight || 0;

      const targetWidth = Math.round(width);
      const idealH = Math.round((targetWidth * 9) / 16);

      // clamp height between a small mobile minimum and 60% of viewport height
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
    // Initial run (in case observer fires late)
    updateSize(containerRef.current.getBoundingClientRect().width);

    return () => ro.disconnect();
  }, []);

  // ---------------- Node / Sticky Note ----------------
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
    socketRef.current?.emit("addShape", { roomId, shape: newNode });
  };

  const handleNodeClick = (node) => {
    if (selectedNode && selectedNode.id !== node.id) {
      const newLine = { points: [selectedNode.x, selectedNode.y, node.x, node.y] };
      setLines((prev) => [...prev, newLine]);
      setSelectedNode(null);
      socketRef.current?.emit("drawing", { roomId, line: newLine });
    } else {
      setSelectedNode(node);
    }
  };

  const handleDragEnd = (node, e) => {
    const updatedNode = { ...node, x: e.target.x(), y: e.target.y() };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    socketRef.current?.emit("moveNode", { roomId, node: updatedNode });
  };

  const handleDoubleClick = (node) => {
    const newText = prompt("Edit node text:", node.text);
    if (!newText) return;
    const updatedNode = { ...node, text: newText };
    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    socketRef.current?.emit("editNodeText", { roomId, node: updatedNode });
  };

  // Freehand Drawing 
  const startLine = (stage) => {
    const pos = stage.getPointerPosition();
    const newLine = {
      points: [pos.x, pos.y],
      stroke: "black",
      strokeWidth: 2,
      tension: 0.5,
      lineCap: "round",
      lineJoin: "round",
    };
    setLines((prev) => [...prev, newLine]);
    setDrawing(true);
  };

  const extendLine = (stage) => {
    if (!drawing) return;
    const pos = stage.getPointerPosition();
    setLines((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedLast = { ...last, points: [...last.points, pos.x, pos.y] };
      const updated = [...prev.slice(0, -1), updatedLast];
      socketRef.current?.emit("drawing", { roomId, line: updatedLast });
      return updated;
    });
  };

  const endLine = () => setDrawing(false);

  // Mouse + Touch handlers
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
        Mind Map & Whiteboard 🧠
      </h1>

      <p className="max-w-2xl text-center text-sm sm:text-base" style={{ color: "#BCBCBC" }}>
        Create and visualize your ideas collaboratively in real time.
      </p>

      {/* Narrower board on small screens; grows by breakpoint */}
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
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.stroke || "black"}
                strokeWidth={line.strokeWidth ?? 2}
                tension={line.tension ?? 0.5}
                lineCap={line.lineCap ?? "round"}
                lineJoin={line.lineJoin ?? "round"}
              />
            ))}

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

      <p className="text-xs sm:text-sm text-center max-w-3xl px-3" style={{ color: "#BCBCBC" }}>
        Click empty canvas to add nodes. Click two nodes to connect them. Drag to move. Double-click
        to edit text. Hold and drag to draw freehand (touch supported).
      </p>
    </div>
  );
}
