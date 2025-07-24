import { useState, useEffect } from "react";
import axios from "axios";
// const BACKEND_URL = "http://172.16.100.130:3000";
const BACKEND_URL = "https://tdremote-production.up.railway.app/status";

function ProjectStatusList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get(`${BACKEND_URL}/status`).then((res) => {
        setProjects(res.data);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedProjects = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const sendCommand = (project, action) => {
    axios
      .post(`${BACKEND_URL}/control`, {
        project,
        action,
      })
      .then(() => {
        console.log(`✅ Sent command: ${action} to ${project}`);
      })
      .catch((err) => {
        console.error("❌ Command failed:", err);
      });
  };

  return (
    <div className="p-6 font-mono">
      <h1 className="text-2xl mb-4 font-bold">TouchDesigner 实时监控</h1>
      <ul>
        {sortedProjects.map((project) => {
          const isOnline = new Date() - new Date(project.lastSeen) < 3000; // 为避免时间差异，这个值不要小于3000毫秒
          if (project.name === "td-monitor.toe") {
            // 计算时间差（毫秒）
            const timeDiff = new Date() - new Date(project.lastSeen);
            console.log(
              "Project:",
              project.name,
              "timeDiff:",
              timeDiff,
              "isOnline:",
              isOnline
            );
          }
          return (
            <li key={project.name} className="mb-4">
              <div className="flex items-center space-x-4">
                <span className="min-w-[200px]">
                  {project.name} -{" "}
                  {isOnline ? (
                    <span className="text-green-600">🟢 正在运行</span>
                  ) : (
                    <span className="text-gray-400">⚪️ 离线</span>
                  )}
                </span>

                {/* 按钮组 */}
                <button
                  disabled={!isOnline}
                  onClick={() => sendCommand(project.name, "blackout")}
                  className={`px-2 py-1 rounded text-white ${
                    isOnline
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  黑屏
                </button>
                <button
                  disabled={!isOnline}
                  onClick={() => sendCommand(project.name, "shutdown")}
                  className={`px-2 py-1 rounded text-white ${
                    isOnline
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  关闭
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ProjectStatusList;
