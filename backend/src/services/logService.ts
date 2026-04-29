const logs: Record<string, string[]> = {};
const clients: Record<string, any[]> = {};

export function addLog(deploymentId: string, message: string) {
  console.log("LOG:", message);
  if (!logs[deploymentId]) {
    logs[deploymentId] = [];
  }

  logs[deploymentId].push(message);

  if (clients[deploymentId]) {
    clients[deploymentId].forEach((res) => {
      res.write(`data: ${message}\n\n`);
    });
  }
}

export function getLogs(deploymentId: string) {
  return logs[deploymentId] || [];
}

export function addClient(deploymentId: string, res: any) {
  if (!clients[deploymentId]) {
    clients[deploymentId] = [];
  }

  clients[deploymentId].push(res);
}

export function removeClient(deploymentId: string, res: any) {
  if (!clients[deploymentId]) return;

  clients[deploymentId] = clients[deploymentId].filter(
    (client) => client !== res
  );
}