/**
 * dev 서버 시작 전 포트 점유 프로세스 종료 (Windows)
 * usage: node scripts/kill-port.js [port]
 */
const { execSync } = require('child_process');

const port = Number(process.argv[2] || process.env.PORT || 5000);

if (process.platform !== 'win32') {
  process.exit(0);
}

try {
  const out = execSync(
    `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
    { encoding: 'utf8' },
  );

  const pids = [...new Set(out.trim().split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];
  const myPid = String(process.pid);

  for (const pid of pids) {
    if (pid === myPid) continue;
    try {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`[kill-port] port ${port} → PID ${pid} terminated`);
    } catch {
      /* already gone */
    }
  }
} catch {
  /* nothing listening */
}
