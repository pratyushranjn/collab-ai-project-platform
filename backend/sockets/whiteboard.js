const Whiteboard = require("../models/Whiteboard");

// get or create board
async function roomState(roomId) {
  let board = await Whiteboard.findOne({ roomId });

  if (!board) {
    board = new Whiteboard({ roomId });
    await board.save();
    console.log("[Whiteboard] Created new board:", roomId);
  }

  return board
}

// save changes + log action
async function saveBoard(roomId, updateFn, action) {
  let board = await Whiteboard.findOne({ roomId });
  if (!board) {
    board = new Whiteboard({ roomId });
  }

  // apply update
  updateFn(board.data);

  // force mongoose to notice nested object
  board.markModified("data");

  if (action) board.actions.push(action);

  await board.save();
  return board.data;
}

// Register all socket events
function registerWhiteboard(socket) {
  // console.log("[Whiteboard] Socket registered:", socket.id);

  // join room
  socket.on("joinMindMap", async ({ roomId }) => {
    if (!roomId) {
      socket.emit("error", "roomId is required to join whiteboard.");
      return;
    }

    socket.join(roomId);

    const board = await roomState(roomId);
    socket.emit("updateNodes", board.data.nodes || []);
    socket.emit("updateLines", board.data.lines || []);
  });

  // add node
  socket.on("addShape", async ({ roomId, userId, shape }) => {
    if (!roomId || !shape) return;

    await saveBoard(
      roomId,
      (data) => {
        data.nodes.push(shape);
      },
      { userId, type: "addShape", payload: { node: shape } }
    );

    socket.to(roomId).emit("addShape", shape);
  });

  // draw line
  socket.on("drawing", async ({ roomId, userId, line }) => {
    if (!roomId || !line) return;

    await saveBoard(
      roomId,
      (data) => {
        data.lines.push(line);
      },
      { userId, type: "drawLine", payload: { line } }
    );

    socket.to(roomId).emit("drawing", { line });
  });

  // move node
  socket.on("moveNode", async ({ roomId, userId, node }) => {
    if (!roomId || !node) return;

    await saveBoard(
      roomId,
      (data) => {
        const target = data.nodes.find((n) => n.id === node.id);
        if (target) {
          target.x = node.x;
          target.y = node.y;
        }
      },
      { userId, type: "moveNode", payload: { node } }
    );

    socket.to(roomId).emit("moveNode", { roomId, node });
  });

  // edit node text
  socket.on("editNodeText", async ({ roomId, userId, node }) => {
    if (!roomId || !node) return;

    await saveBoard(
      roomId,
      (data) => {
        const target = data.nodes.find((n) => n.id === node.id);
        if (target) target.text = node.text;
      },
      { userId, type: "editNodeText", payload: { node } }
    );

    socket.to(roomId).emit("editNodeText", { roomId, node });
  });

  // clear board
  socket.on("clearBoard", async ({ roomId, userId }) => {
    if (!roomId) return;

    await saveBoard(
      roomId,
      (data) => {
        data.nodes = [];
        data.lines = [];
      },
      { userId, type: "clearBoard", payload: {} }
    );

    socket.to(roomId).emit("clearBoard");
  });
}

module.exports = { registerWhiteboard };
