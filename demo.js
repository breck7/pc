// Network simulation setup
const svg = d3
  .select("#networkCanvas")
  .attr("width", "100%")
  .attr("height", 400);

const width = 380;
const height = 400;

// Network nodes (5 validator nodes)
const networkNodes = Array.from({ length: 5 }, (_, i) => ({
  id: `N${i}`,
  x: Math.random() * width,
  y: Math.random() * height * 0.7,
  type: "network",
}));

// User nodes (3 users)
const userNodes = Array.from({ length: 3 }, (_, i) => ({
  id: `U${i}`,
  x: Math.random() * width,
  y: height * 0.7 + Math.random() * height * 0.3,
  type: "user",
}));

const allNodes = [...networkNodes, ...userNodes];

// Draw nodes
svg
  .selectAll(".node")
  .data(allNodes)
  .enter()
  .append("circle")
  .attr("class", (d) => (d.type === "network" ? "node" : "user-node"))
  .attr("r", 8)
  .attr("cx", (d) => d.x)
  .attr("cy", (d) => d.y);

// Transaction simulation
let transactionCount = 1;
const users = ["alice", "bob", "charlie"];
let balances = { alice: 100.0, bob: 50.0, charlie: 0.0 };

function simulateTransaction() {
  // Random user-to-user transaction
  const from = users[Math.floor(Math.random() * users.length)];
  const to = users.filter((u) => u !== from)[Math.floor(Math.random() * 2)];
  const amount = Math.floor(Math.random() * 10) + 1;

  if (balances[from] < amount) return; // Skip if insufficient funds

  // Create animated message
  const userNode = userNodes.find((n) => n.id === `U${users.indexOf(from)}`);
  const targetNode =
    networkNodes[Math.floor(Math.random() * networkNodes.length)];

  const message = svg
    .append("circle")
    .attr("class", "message")
    .attr("cx", userNode.x)
    .attr("cy", userNode.y);

  message
    .transition()
    .duration(1000)
    .attr("cx", targetNode.x)
    .attr("cy", targetNode.y)
    .on("end", () => {
      // Network consensus simulation
      networkNodes.forEach((node, i) => {
        if (node !== targetNode) {
          const relay = svg
            .append("circle")
            .attr("class", "message")
            .attr("cx", targetNode.x)
            .attr("cy", targetNode.y);

          relay
            .transition()
            .duration(500)
            .delay(i * 200)
            .attr("cx", node.x)
            .attr("cy", node.y)
            .remove();
        }
      });

      // After consensus, append to chain
      setTimeout(() => {
        appendTransaction(from, to, amount);
        message.remove();
      }, 1200);
    });
}

const transactions = [];
function appendTransaction(from, to, amount) {
  transactionCount++;
  balances[from] -= amount;
  balances[to] += amount;

  const timestamp = new Date().toISOString();
  const hash = "tx" + Math.random().toString(36).substring(2, 15);

  const transaction = `
write transaction/${transactionCount}
 amount ${amount.toFixed(1)}
 from ${from}
 to ${to}
write wallets/${from}
 balance ${balances[from].toFixed(1)}
write wallets/${to}
 balance ${balances[to].toFixed(1)}
commit
 author Network
 timestamp ${timestamp}
 message Transfer ${amount} from ${from} to ${to}
 order ${transactionCount}
 id ${hash}`;
  transactions.push(transaction);

  const chainContent = document.getElementById("chainContent");
  chainContent.textContent += transaction;
  chainContent.scrollTop = chainContent.scrollHeight;

  const tree = new Particle(`wallets/
 ${Object.keys(balances)
   .map((t, i) => t)
   .join("\n ")}
transactions/
 ${transactions.map((t, i) => i).join("\n ")}`);

  // Update file tree
  const fileTree = document.getElementById("fileTree");
  fileTree.textContent = tree.toString();
}

// Start simulation
setInterval(simulateTransaction, 500);
