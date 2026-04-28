import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// 📡 ハッキングターミナル — ターミナル風UIでサーバーに侵入
// ============================================================

interface ServerNode {
  id: string;
  name: string;
  ip: string;
  difficulty: number;
  firewall: number;
  maxFirewall: number;
  encrypted: boolean;
  files: string[];
  loot: { credits: number; data: string[] };
  compromised: boolean;
  type: "web" | "database" | "mail" | "admin" | "firewall" | "mainframe";
}

interface LogEntry {
  text: string;
  type: "system" | "success" | "error" | "warning" | "info" | "hack" | "loot";
  time: string;
}

interface GameState {
  level: number;
  credits: number;
  reputation: number;
  tools: string[];
  data: string[];
  currentServer: ServerNode | null;
  servers: ServerNode[];
  connected: boolean;
  traceレベル: number;
  maxTrace: number;
  traceActive: boolean;
}

const SERVER_NAMES = [
  "NEXUS-CORP", "OMEGA-BANK", "DARKNET-HUB", "GOV-SEC", "QUANTUM-LAB",
  "CRYPTO-VAULT", "SHADOW-NET", "CYBER-MAIL", "DATA-FORGE", "ICE-WALL",
  "NEURAL-LINK", "GHOST-PROXY", "VOID-CORE", "STELLAR-DB", "PULSE-SYS"
];

const TOOL_LIST = [
  { name: "portscanner", cost: 0, desc: "Scan open ports" },
  { name: "bruteforce", cost: 100, desc: "Crack weak passwords" },
  { name: "sqlinjector", cost: 250, desc: "Inject SQL into databases" },
  { name: "firewall_bypass", cost: 500, desc: "Bypass firewall rules" },
  { name: "decryptor", cost: 750, desc: "Decrypt encrypted files" },
  { name: "rootkit", cost: 1000, desc: "Install persistent backdoor" },
  { name: "trace_scrambler", cost: 400, desc: "Slow down trace" },
  { name: "zero_day", cost: 2000, desc: "Exploit any system" },
];

function randomIP(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function generateServer(level: number, idx: number): ServerNode {
  const types: ServerNode["type"][] = ["web", "database", "mail", "admin", "firewall", "mainframe"];
  const type = types[idx % types.length];
  const diff = Math.max(1, level + Math.floor(Math.random() * 3) - 1);
  const fw = diff * 20 + Math.floor(Math.random() * 20);
  const files = [];
  const fileNames = ["passwd.db", "accounts.csv", "secrets.enc", "logs.txt", "config.sys", "wallet.dat", "keys.pem", "blueprint.pdf"];
  for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
    files.push(fileNames[Math.floor(Math.random() * fileNames.length)]);
  }
  return {
    id: `srv-${idx}`,
    name: SERVER_NAMES[idx % SERVER_NAMES.length],
    ip: randomIP(),
    difficulty: diff,
    firewall: fw,
    maxFirewall: fw,
    encrypted: diff > 3,
    files,
    loot: { credits: diff * 100 + Math.floor(Math.random() * 200), data: [fileNames[Math.floor(Math.random() * fileNames.length)]] },
    compromised: false,
    type,
  };
}

function now(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

// Audio
const audioCtxRef = { current: null as AudioContext | null };
function getAudio(): AudioContext {
  if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
  return audioCtxRef.current;
}
function playBeep(freq: number, dur: number, type: OscillatorType = "square", vol = 0.06) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
}
function typeSound() { playBeep(800 + Math.random() * 400, 0.03, "square", 0.02); }
function hackSound() { playBeep(200 + Math.random() * 100, 0.1, "sawtooth", 0.05); }
function successSound() { playBeep(600, 0.1); setTimeout(() => playBeep(900, 0.15), 100); }
function errorSound() { playBeep(150, 0.2, "sawtooth", 0.08); }
function alertSound() { playBeep(400, 0.05); setTimeout(() => playBeep(400, 0.05), 100); setTimeout(() => playBeep(400, 0.05), 200); }

export default function HackingGame() {
  const [game, setGame] = useState<GameState>(() => {
    const servers = Array.from({ length: 6 }, (_, i) => generateServer(1, i));
    return {
      level: 1,
      credits: 0,
      reputation: 0,
      tools: ["portscanner"],
      data: [],
      currentServer: null,
      servers,
      connected: false,
      traceレベル: 0,
      maxTrace: 100,
      traceActive: false,
    };
  });
  const [logs, setLogs] = useState<LogEntry[]>([
    { text: "SYSTEM INITIALIZED", type: "system", time: now() },
    { text: '████████████████████████████████████████', type: "system", time: now() },
    { text: "  H A C K   T E R M I N A L   v2.0", type: "hack", time: now() },
    { text: '████████████████████████████████████████', type: "system", time: now() },
    { text: 'Type "help" for commands', type: "info", time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const traceIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const addLog = useCallback((text: string, type: LogEntry["type"] = "system") => {
    setLogs(prev => [...prev.slice(-200), { text, type, time: now() }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (game.traceActive) {
      traceIntervalRef.current = setInterval(() => {
        setGame(prev => {
          const scrambler = prev.tools.includes("trace_scrambler") ? 0.5 : 1;
          const newTrace = prev.traceLevel + scrambler;
          if (newTrace >= prev.maxTrace) {
            addLog("!!! TRACE COMPLETE — CONNECTION SEVERED !!!", "error");
            addLog(`Lost ${Math.floor(prev.credits * 0.2)} credits as penalty`, "error");
            errorSound();
            clearInterval(traceIntervalRef.current);
            return {
              ...prev,
              traceレベル: 0,
              traceActive: false,
              connected: false,
              currentServer: null,
              credits: Math.max(0, prev.credits - Math.floor(prev.credits * 0.2)),
            };
          }
          if (newTrace > prev.maxTrace * 0.7 && prev.traceLevel <= prev.maxTrace * 0.7) {
            addLog("⚠ WARNING: Trace at 70% — disconnect soon!", "warning");
            alertSound();
          }
          return { ...prev, traceレベル: newTrace };
        });
      }, 1000);
      return () => clearInterval(traceIntervalRef.current);
    }
  }, [game.traceActive, addLog]);

  const typeLog = async (text: string, type: LogEntry["type"] = "system", delay = 20) => {
    setTyping(true);
    let current = "";
    for (let i = 0; i < text.length; i++) {
      current += text[i];
      if (i % 3 === 0) typeSound();
      await new Promise(r => setTimeout(r, delay));
    }
    addLog(current, type);
    setTyping(false);
  };

  const processCommand = async (cmd: string) => {
    const parts = cmd.trim().toLowerCase().split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    addLog(`> ${cmd}`, "info");

    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();

    switch (command) {
      case "help":
        addLog("═══════════════════════════════════════", "system");
        addLog("  AVAILABLE COMMANDS:", "hack");
        addLog("  scan          — List available servers", "info");
        addLog("  connect <ip>  — Connect to server", "info");
        addLog("  disconnect    — Disconnect from server", "info");
        addLog("  hack          — Attempt to breach firewall", "info");
        addLog("  download      — Download server files", "info");
        addLog("  ls            — List files on server", "info");
        addLog("  tools         — Show your hacking tools", "info");
        addLog("  shop          — Buy new tools", "info");
        addLog("  buy <tool>    — Purchase a tool", "info");
        addLog("  status        — Show your stats", "info");
        addLog("  nuke          — Use zero_day exploit", "info");
        addLog("  clear         — Clear terminal", "info");
        addLog("═══════════════════════════════════════", "system");
        break;

      case "scan":
        await typeLog("Scanning network...", "hack", 30);
        hackSound();
        await new Promise(r => setTimeout(r, 500));
        addLog("╔══════════════════════════════════════╗", "system");
        addLog("║  NETWORK SCAN RESULTS                ║", "hack");
        addLog("╠══════════════════════════════════════╣", "system");
        for (const s of game.servers) {
          const status = s.compromised ? "✓ OWNED" : "● ACTIVE";
          const icon = s.type === "web" ? "🌐" : s.type === "database" ? "🗄️" : s.type === "mail" ? "📧" : s.type === "admin" ? "👤" : s.type === "firewall" ? "🛡️" : "💻";
          addLog(`║ ${icon} ${s.ip.padEnd(16)} ${s.name.padEnd(14)} LV${s.difficulty} ${status}`, s.compromised ? "success" : "warning");
        }
        addLog("╚══════════════════════════════════════╝", "system");
        break;

      case "connect": {
        if (game.connected) { addLog("Already connected. Disconnect first.", "error"); errorSound(); break; }
        const ip = args[0];
        if (!ip) { addLog("Usage: connect <ip>", "error"); break; }
        const server = game.servers.find(s => s.ip === ip);
        if (!server) { addLog(`Server ${ip} not found`, "error"); errorSound(); break; }
        await typeLog(`Connecting to ${server.ip}...`, "hack", 25);
        hackSound();
        await new Promise(r => setTimeout(r, 800));
        addLog(`Connected to ${server.name} [${server.ip}]`, "success");
        addLog(`Firewall: ${server.firewall}/${server.maxFirewall} | ${server.encrypted ? "🔒 ENCRYPTED" : "🔓 OPEN"}`, "warning");
        successSound();
        setGame(prev => ({ ...prev, currentServer: server, connected: true, traceActive: true, traceレベル: 0 }));
        break;
      }

      case "disconnect":
        if (!game.connected) { addLog("Not connected to any server.", "error"); break; }
        addLog(`Disconnected from ${game.currentServer?.name}`, "info");
        clearInterval(traceIntervalRef.current);
        setGame(prev => ({ ...prev, currentServer: null, connected: false, traceActive: false, traceレベル: 0 }));
        break;

      case "hack": {
        if (!game.connected || !game.currentServer) { addLog("Not connected to any server.", "error"); errorSound(); break; }
        const srv = game.currentServer;
        if (srv.compromised) { addLog("Server already compromised.", "info"); break; }
        if (srv.encrypted && !game.tools.includes("decryptor")) {
          addLog("Server is encrypted. Need 'decryptor' tool.", "error"); errorSound(); break;
        }
        await typeLog("Initiating breach sequence...", "hack", 20);
        hackSound();
        // Simulate hacking
        const power = game.tools.length * 10 + (game.tools.includes("bruteforce") ? 15 : 0) + (game.tools.includes("firewall_bypass") ? 25 : 0);
        const phases = ["Scanning ports...", "Injecting payload...", "Bypassing authentication...", "Escalating privileges...", "Gaining root access..."];
        for (let i = 0; i < phases.length; i++) {
          await new Promise(r => setTimeout(r, 400));
          const dmg = Math.floor(power * (0.5 + Math.random() * 0.5) / phases.length);
          srv.firewall = Math.max(0, srv.firewall - dmg);
          addLog(`  [${i + 1}/${phases.length}] ${phases[i]} (-${dmg} FW)`, "hack");
          hackSound();
        }
        await new Promise(r => setTimeout(r, 300));
        if (srv.firewall <= 0) {
          srv.compromised = true;
          addLog("", "success");
          addLog("██ ROOT ACCESS GRANTED ██", "success");
          addLog(`Server ${srv.name} compromised!`, "success");
          addLog(`+${srv.loot.credits} credits | +${srv.loot.data.length} data files`, "loot");
          successSound();
          setGame(prev => ({
            ...prev,
            credits: prev.credits + srv.loot.credits,
            reputation: prev.reputation + srv.difficulty * 10,
            data: [...prev.data, ...srv.loot.data],
            servers: prev.servers.map(s => s.id === srv.id ? srv : s),
          }));
        } else {
          addLog(`Firewall still active: ${srv.firewall}/${srv.maxFirewall}`, "warning");
          addLog("Hack again to continue breaking through.", "info");
          setGame(prev => ({
            ...prev,
            servers: prev.servers.map(s => s.id === srv.id ? srv : s),
          }));
        }
        break;
      }

      case "nuke": {
        if (!game.connected || !game.currentServer) { addLog("Not connected.", "error"); break; }
        if (!game.tools.includes("zero_day")) { addLog("Need 'zero_day' tool. Buy it from shop.", "error"); errorSound(); break; }
        const srv2 = game.currentServer;
        await typeLog("DEPLOYING ZERO-DAY EXPLOIT...", "hack", 40);
        hackSound();
        await new Promise(r => setTimeout(r, 1000));
        srv2.firewall = 0;
        srv2.compromised = true;
        addLog("💀💀💀 SYSTEM DESTROYED 💀💀💀", "success");
        addLog(`+${srv2.loot.credits * 2} credits (bonus)`, "loot");
        successSound();
        setGame(prev => ({
          ...prev,
          credits: prev.credits + srv2.loot.credits * 2,
          reputation: prev.reputation + srv2.difficulty * 25,
          data: [...prev.data, ...srv2.loot.data],
          tools: prev.tools.filter(t => t !== "zero_day"), // one-time use
          servers: prev.servers.map(s => s.id === srv2.id ? srv2 : s),
        }));
        break;
      }

      case "download":
      case "ls": {
        if (!game.connected || !game.currentServer) { addLog("Not connected.", "error"); break; }
        const srv3 = game.currentServer;
        if (command === "ls") {
          addLog(`Files on ${srv3.name}:`, "info");
          for (const f of srv3.files) addLog(`  📄 ${f}`, "info");
        } else {
          if (!srv3.compromised) { addLog("Must hack server first!", "error"); errorSound(); break; }
          await typeLog("Downloading files...", "hack", 25);
          for (const f of srv3.files) {
            await new Promise(r => setTimeout(r, 200));
            addLog(`  ⬇ ${f} ... done`, "success");
          }
          addLog("All files downloaded.", "success");
          successSound();
        }
        break;
      }

      case "tools":
        addLog("Your tools:", "info");
        for (const t of game.tools) {
          const info = TOOL_LIST.find(tl => tl.name === t);
          addLog(`  🔧 ${t} — ${info?.desc || ""}`, "info");
        }
        break;

      case "shop":
        addLog("╔════════════════════════════════════════╗", "system");
        addLog("║  DARKNET SHOP                          ║", "hack");
        addLog("╠════════════════════════════════════════╣", "system");
        for (const t of TOOL_LIST) {
          const owned = game.tools.includes(t.name);
          addLog(`║ ${owned ? "✓" : "●"} ${t.name.padEnd(18)} ${("$" + t.cost).padEnd(7)} ${t.desc}`, owned ? "success" : "warning");
        }
        addLog("╚════════════════════════════════════════╝", "system");
        addLog(`Your credits: $${game.credits}`, "info");
        break;

      case "buy": {
        const toolName = args[0];
        if (!toolName) { addLog("Usage: buy <tool_name>", "error"); break; }
        const tool = TOOL_LIST.find(t => t.name === toolName);
        if (!tool) { addLog(`Unknown tool: ${toolName}`, "error"); errorSound(); break; }
        if (game.tools.includes(toolName)) { addLog("Already owned.", "info"); break; }
        if (game.credits < tool.cost) { addLog(`Need $${tool.cost}, have $${game.credits}`, "error"); errorSound(); break; }
        setGame(prev => ({ ...prev, credits: prev.credits - tool.cost, tools: [...prev.tools, toolName] }));
        addLog(`Purchased ${toolName}!`, "success");
        successSound();
        break;
      }

      case "status":
        addLog("═══════════════════════════════════════", "system");
        addLog(`  Credits: $${game.credits}`, "loot");
        addLog(`  Reputation: ${game.reputation}`, "info");
        addLog(`  レベル: ${game.level}`, "info");
        addLog(`  Tools: ${game.tools.length}/${TOOL_LIST.length}`, "info");
        addLog(`  Data files: ${game.data.length}`, "info");
        addLog(`  Servers owned: ${game.servers.filter(s => s.compromised).length}/${game.servers.length}`, "success");
        addLog("═══════════════════════════════════════", "system");
        break;

      case "clear":
        setLogs([]);
        break;

      default:
        addLog(`Command not found: ${command}`, "error");
        addLog('Type "help" for available commands', "info");
        errorSound();
    }

    // Level up check
    const owned = game.servers.filter(s => s.compromised).length;
    if (owned >= game.servers.length) {
      const newLevel = game.level + 1;
      addLog("", "system");
      addLog("████████████████████████████████████████", "success");
      addLog(`  レベル ${newLevel} UNLOCKED — NEW SERVERS LOADED`, "success");
      addLog("████████████████████████████████████████", "success");
      successSound();
      const newServers = Array.from({ length: 6 }, (_, i) => generateServer(newLevel, i + newLevel * 6));
      setGame(prev => ({ ...prev, level: newLevel, servers: newServers, connected: false, currentServer: null, traceActive: false, traceレベル: 0 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || typing) return;
    const cmd = input;
    setInput("");
    processCommand(cmd);
  };

  const colorMap: Record<string, string> = {
    system: "#444",
    success: "#0f0",
    error: "#f33",
    warning: "#fa0",
    info: "#0af",
    hack: "#f0f",
    loot: "#ff0",
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: 16, fontFamily: "'Courier New', monospace" }}
      onClick={() => inputRef.current?.focus()}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 800, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "#111", borderRadius: "8px 8px 0 0", border: "1px solid #222" }}>
          <span style={{ color: "#0f0", fontSize: 14 }}>📡 HACK TERMINAL v2.0</span>
          <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
            <span style={{ color: "#ff0" }}>💰 ${game.credits}</span>
            <span style={{ color: "#0af" }}>⭐ Rep: {game.reputation}</span>
            <span style={{ color: "#f0f" }}>🔧 Tools: {game.tools.length}</span>
            <span style={{ color: "#0f0" }}>📊 LV{game.level}</span>
          </div>
        </div>

        {/* Trace bar */}
        {game.traceActive && (
          <div style={{ background: "#111", padding: "4px 8px", borderLeft: "1px solid #222", borderRight: "1px solid #222" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
              <span style={{ color: game.traceLevel > game.maxTrace * 0.7 ? "#f33" : "#fa0" }}>
                ⚡ TRACE: {Math.floor(game.traceLevel)}/{game.maxTrace}
              </span>
              <div style={{ flex: 1, height: 6, background: "#222", borderRadius: 3 }}>
                <div style={{
                  width: `${(game.traceLevel / game.maxTrace) * 100}%`,
                  height: "100%",
                  background: game.traceLevel > game.maxTrace * 0.7 ? "#f33" : game.traceLevel > game.maxTrace * 0.4 ? "#fa0" : "#0f0",
                  borderRadius: 3,
                  transition: "width 0.3s",
                }} />
              </div>
              {game.currentServer && (
                <span style={{ color: "#0af" }}>
                  🔗 {game.currentServer.name} [{game.currentServer.ip}]
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Terminal */}
      <div style={{
        width: "100%", maxWidth: 800, height: 500,
        background: "rgba(0,5,0,0.95)",
        border: "1px solid #222",
        borderRadius: game.traceActive ? 0 : "0 0 8px 8px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 12, fontSize: 13, lineHeight: 1.6 }}>
          {logs.map((log, i) => (
            <div key={i} style={{ color: colorMap[log.type] || "#aaa" }}>
              <span style={{ color: "#333", marginRight: 8, fontSize: 10 }}>[{log.time}]</span>
              {log.text}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", borderTop: "1px solid #222", background: "#080808" }}>
          <span style={{ color: "#0f0", padding: "8px 4px 8px 12px", fontSize: 14 }}>
            {game.connected ? `${game.currentServer?.name?.toLowerCase()}@root$` : "guest@local$"}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", color: "#0f0",
              fontSize: 14, padding: 8, outline: "none", fontFamily: "'Courier New', monospace",
            }}
            autoFocus
            spellCheck={false}
          />
        </form>
      </div>

      <p style={{ color: "#333", fontSize: 11, marginTop: 8, fontFamily: "monospace" }}>
        Type "help" to begin | Hack servers, earn credits, buy tools, level up
      </p>
    </div>
  );
}
