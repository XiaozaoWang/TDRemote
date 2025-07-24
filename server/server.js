const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();
const port = 3000;

// 存储每个 TD 项目的 websocket 对象
let tdConnections = {};
let projectStatus = {};

// const corsOptions = {
//   origin: "http://localhost:5173", // 允许前端的地址
//   credentials: true,
// };
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true); // 动态允许任何来源
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// 每次更新时写入数据库
async function updateProjectStatus(name) {
  await prisma.tDProject.upsert({
    where: { name },
    update: { lastSeen: new Date() },
    create: { name, lastSeen: new Date() },
  });
}

// HTTP 接口：返回所有项目（含离线）
app.get("/status", async (req, res) => {
  const allProjects = await prisma.tDProject.findMany();
  res.json(allProjects);
});

// WebSocket 接收来自 TD 的状态
// const wss = new WebSocket.Server({ port: 8765 });
const wss = new WebSocket.Server({ server }); // 👈 把 WebSocket 和 HTTP 共用同一个端口
wss.on("connection", (ws) => {
  console.log("TD connected via WebSocket");
  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      // console.log("✅ Received message:", data);
      if (data.project) {
        tdConnections[data.project] = ws;
        projectStatus[data.project] = {
          ...data,
          lastSeen: Date.now(),
        };
        await updateProjectStatus(data.project);
      }
    } catch (err) {
      console.error("Invalid message:", message);
    }
  });

  ws.on("close", () => {
    // 删除断开的连接
    for (const [name, conn] of Object.entries(tdConnections)) {
      if (conn === ws) {
        delete tdConnections[name];
        console.log(`⚠️ 项目 "${name}" 已断开连接`);
      }
    }
  });
});

app.post("/control", async (req, res) => {
  const { project, action } = req.body;

  const ws = tdConnections[project];
  if (!ws) {
    console.log("error", project, action, tdConnections);
    return res.status(404).json({ error: "项目不在线或连接丢失" });
  }

  let command = null;
  if (action === "blackout") {
    command = { command: "blackout" };
  } else if (action === "shutdown") {
    command = { command: "shutdown" };
  }

  if (command) {
    console.log(`✅ Sending command: ${action} to ${project}`);
    ws.send(JSON.stringify(command));
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "未知动作" });
  }
});

// app.listen(port, () => {
//   console.log(`HTTP server running at http://localhost:${port}`);
// });

app.listen(port, "0.0.0.0", () => {
  console.log(`HTTP server running at http://0.0.0.0:${port}`);
});
