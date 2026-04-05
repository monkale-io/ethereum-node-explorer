const HARDHAT_RPC = "http://127.0.0.1:8545";

describe("Monkale Ethereum Node Explorer", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.intercept("POST", HARDHAT_RPC, (req) => {
      // Suppress expected Hardhat node errors in console during E2E tests
      if (req.body && req.body.method === "net_peerCount") {
        req.reply({ jsonrpc: "2.0", id: req.body.id, result: "0x0" });
      }
    });
  });

  const setupRPC = () => {
    cy.visit("/");
    cy.get("body").then(($body) => {
      const ctaBtn = $body.find('button:contains("Configure RPC Endpoint")');
      if (ctaBtn.length > 0 && ctaBtn.is(':visible')) {
        cy.wrap(ctaBtn).first().click();
      } else {
        cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
      }
    });

    cy.contains("label", "RPC URL").click();
    cy.focused().clear().type(HARDHAT_RPC);
    cy.contains("button", /^save$/i).click();
  };

  it("configures RPC and loads dashboard with live data", () => {
    cy.visit("/");

    cy.contains("a", /Monkale Ethereum Node Explorer/i).should("be.visible");

    cy.contains("button", /^Configure RPC Endpoint$/).should("be.visible").click();

    cy.contains("h2", "Configure RPC Endpoint").should("be.visible");

    cy.contains("label", "RPC URL").click();
    cy.focused().clear().type(HARDHAT_RPC);

    cy.contains("button", /test connection/i).click();
    cy.contains(/connected.*chain id/i, { timeout: 10000 }).should("be.visible");

    cy.contains("button", /^save$/i).click();

    cy.contains("Node Status", { timeout: 10000 }).should("be.visible");
    cy.contains("Latest Blocks").should("be.visible");
    cy.contains("Connected").should("be.visible");

    cy.get("input").invoke('attr', 'placeholder').should('match', /block, tx hash/i);

    cy.get("a[href*='/block/']").first().should("be.visible", { timeout: 10000 }).click();

    cy.contains("Block Details", { timeout: 10000 }).should("be.visible");
    cy.contains("Block Number").should("be.visible");
    cy.contains("Gas Used").should("be.visible");
  });

  it("toggles theme correctly", () => {
    cy.visit("/");
    cy.get('button[aria-label="Toggle theme"]').first().click({ force: true });
    cy.contains("[role='menuitem']", /dark/i).click();

    cy.get("html").should("have.class", "dark");
  });

  it("handles RPC error gracefully", () => {
    cy.visit("/");
    cy.get("body").then(($body) => {
      const ctaBtn = $body.find('button:contains("Configure RPC Endpoint")');
      if (ctaBtn.length > 0 && ctaBtn.is(':visible')) {
        cy.wrap(ctaBtn).first().click();
      } else {
        cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
      }
    });

    cy.contains("label", "RPC URL").click();
    cy.focused().clear().type("http://localhost:9999"); // Invalid port

    cy.contains("button", /test connection/i).click();
    cy.contains(/fetch failed|network error|failed to fetch|refused|failed/i, { timeout: 10000 }).should("be.visible");
  });

  it("search functionality routes correctly to block", () => {
    setupRPC();

    cy.get("input").should('have.attr', 'placeholder').and('match', /tx hash/i);
    cy.get("input[placeholder*='tx hash']").first().clear().type("0{enter}");

    cy.url().should("match", /.*\/block\/0/);
    cy.contains(/Block Details/i).should("be.visible");
  });

  it("handles not found block correctly", () => {
    setupRPC();

    cy.get("input[placeholder*='tx hash']").first().clear().type("999999999{enter}");

    cy.contains(/Block Not Found/i, { timeout: 10000 }).should("be.visible");
    cy.contains("button", /Back to Dashboard/i).click();
    cy.url().should("match", /.*\//);
  });

  it("search functionality routes correctly to address", () => {
    setupRPC();

    const testAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    cy.get("input[placeholder*='tx hash']").first().clear().type(`${testAddress}{enter}`);

    cy.url().should("match", new RegExp(`/account/${testAddress}$`, "i"));
    cy.contains(/Account Details/i).should("be.visible");
    cy.contains(testAddress, { matchCase: false }).should("be.visible");
  });

  it("search functionality handles ENS name resolution", () => {
    setupRPC();

    // Intercept eth_call for ENS resolution (Universal Resolver)
    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const postData = req.body;
      if (postData.method === "eth_call") {
        // Return ABI-encoded vitalik.eth address (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)
        // viem's getEnsAddress decodes this specific hex format
        req.reply({
          jsonrpc: "2.0",
          id: postData.id,
          result: "0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000cc14892dd5bce77521a1bc6831d11f5d6f85b62b0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        });
      } else {
        req.continue();
      }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type("vitalik.eth{enter}");

    // Should navigate to the resolved address
    cy.url().should("match", /\/account\/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045/i);
    cy.contains(/Account Details/i).should("be.visible");
  });

  it("search functionality shows error for unknown ENS name", () => {
    setupRPC();

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const postData = req.body;
      if (postData.method === "eth_call") {
        // Return generic 0x0 array for not found
        req.reply({
          jsonrpc: "2.0",
          id: postData.id,
          result: "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        });
      } else {
        req.continue();
      }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type("unknown.eth{enter}");

    cy.contains("ENS name not found").should("be.visible");
  });

  it("navigates using block pagination buttons", () => {
    setupRPC();

    cy.get("a[href*='/block/']").first().should("be.visible", { timeout: 10000 }).as("firstBlock");

    cy.get("@firstBlock").invoke("attr", "href").then((href) => {
      const blockNum = parseInt(href!.split("/").pop()!);

      cy.get("@firstBlock").click();
      cy.contains(/Block Details/i).should("be.visible");

      if (blockNum > 0) {
        cy.contains("button", /Previous block/i).should("be.visible").click();
        cy.url().should("match", new RegExp(`.*\\/block\\/${blockNum - 1}`));
      }
    });
  });

  it("handles not found transaction correctly", () => {
    setupRPC();

    cy.get("input[placeholder*='tx hash']").first().clear().type("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef{enter}");

    cy.contains(/Transaction Not Found/i, { timeout: 10000 }).should("be.visible");
  });

  it("prevents empty search submissions", () => {
    setupRPC();

    cy.get("button").contains(/^search$/i).should("be.disabled");

    cy.get("input[placeholder*='tx hash']").first().clear().type("   ");
    cy.get("button").contains(/^search$/i).should("be.disabled");
  });

  it("focuses search bar on slash keypress", () => {
    setupRPC();

    cy.get("body").type("/");
    cy.get("input[placeholder*='tx hash']").first().should("be.focused");
  });

  it("copy to clipboard updates icon state", () => {
    setupRPC();

    cy.get("a[href*='/block/']").first().should("be.visible", { timeout: 10000 }).click();

    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, "writeText").as("clipboardWrite");
    });

    cy.get("svg.lucide-copy").first().closest("button").should("be.visible").click();

    cy.get("@clipboardWrite").should("have.been.called");
    cy.get("svg.lucide-check").first().should("be.visible");
  });

  it("identifies smart contracts vs EAO", () => {
    cy.visit("/");

    cy.get("body").then(($body) => {
      const ctaBtn = $body.find('button:contains("Configure RPC Endpoint")');
      if (ctaBtn.length > 0 && ctaBtn.is(':visible')) {
        cy.wrap(ctaBtn).first().click();
      } else {
        cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
      }
    });

    cy.contains("label", "RPC URL").click();
    cy.focused().clear().type(HARDHAT_RPC);
    cy.contains("button", /^save$/i).click();

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const postData = req.body;
      if (postData.method === "eth_getCode") {
        req.reply({ jsonrpc: "2.0", id: postData.id, result: "0x608060405234801561001057600080fd5b506004361" });
      } else if (postData.method === "eth_getBalance") {
        req.reply({ jsonrpc: "2.0", id: postData.id, result: "0x0" });
      } else if (postData.method === "eth_getTransactionCount") {
        req.reply({ jsonrpc: "2.0", id: postData.id, result: "0x1" });
      } else {
        req.continue();
      }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type("0x1234567890123456789012345678901234567890{enter}");
    cy.contains("Contract Bytecode", { timeout: 10000 }).should("be.visible");
  });

  it("dashboard auto-updates when new block is mined", () => {
    setupRPC();

    cy.contains("Latest Blocks", { timeout: 10000 }).should("be.visible");
    cy.get("a[href*='/block/']").first().should("be.visible").as("firstBlockItem");

    cy.get("@firstBlockItem").invoke("text").then((initialText) => {
      cy.request({
        method: "POST",
        url: HARDHAT_RPC,
        body: { jsonrpc: "2.0", method: "evm_mine", params: [], id: 1 }
      });

      cy.wait(4000); // Give the dashboard poll time to pick up the new block

      cy.get("a[href*='/block/']").first().should(($el) => {
        expect($el.text()).not.to.eq(initialText);
      });
    });
  });

  it("document title contains app name", () => {
    cy.visit("/");
    cy.title().should("match", /Monkale/i);
  });

  it("mobile viewport collapses full header title", () => {
    cy.viewport(375, 667);
    setupRPC();

    cy.contains("span", /^Monkale Ethereum Node Explorer$/).should("not.be.visible");
    cy.contains("span", /^Monkale$/).should("be.visible");
  });

  it("header logo navigates home", () => {
    setupRPC();

    cy.get("a[href*='/block/']").first().should("be.visible", { timeout: 10000 }).click();
    cy.contains(/Block Details/i).should("be.visible");

    cy.contains("a", /Monkale Ethereum Node Explorer/i).click();

    cy.url().should("match", /.*\/$/);
    cy.contains("Latest Blocks").should("be.visible");
  });

  it("data formatting integrity validates wei and gas", () => {
    cy.visit("/");

    cy.get("body").then(($body) => {
      const ctaBtn = $body.find('button:contains("Configure RPC Endpoint")');
      if (ctaBtn.length > 0 && ctaBtn.is(':visible')) {
        cy.wrap(ctaBtn).first().click();
      } else {
        cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
      }
    });

    cy.contains("label", "RPC URL").click();
    cy.focused().clear().type(HARDHAT_RPC);
    cy.contains("button", /^save$/i).click();

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const postData = req.body;
      if (postData.method === "eth_getBlockByNumber" || postData.method === "eth_getBlockByHash") {
        req.reply({
          jsonrpc: "2.0",
          id: postData.id,
          result: {
            number: "0x1",
            hash: "0x123",
            timestamp: "0x60000000",
            gasUsed: "0x100000",
            gasLimit: "0x200000",
            transactions: []
          }
        });
      } else {
        req.continue();
      }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type("1{enter}");
    cy.contains("1,048,576").should("be.visible");
  });

  it("transaction logs tab shows log entries", () => {
    setupRPC();

    const TX_HASH = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const CONTRACT_ADDR = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    // ERC-20 Transfer: topic[0]=sig, topic[1]=from, topic[2]=to; data=uint256(1000)
    const EVENT_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const FROM_TOPIC = "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const TO_TOPIC = "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8";
    const DATA_VALUE = "0x00000000000000000000000000000000000000000000000000000000000003e8";

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({
          jsonrpc: "2.0", id, result: {
            hash: TX_HASH, blockNumber: "0x1", blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            to: CONTRACT_ADDR, value: "0x0", gas: "0x5208",
            gasPrice: "0x3b9aca00", 
            // Mock an ERC-20 transfer call
            input: "0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000003e8", 
            nonce: "0x0",
            transactionIndex: "0x0", type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
          },
        });
      } else if (method === "eth_getTransactionReceipt") {
        req.reply({
          jsonrpc: "2.0", id, result: {
            transactionHash: TX_HASH, blockNumber: "0x1",
            blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            transactionIndex: "0x0",
            from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            to: CONTRACT_ADDR, contractAddress: null,
            status: "0x1", gasUsed: "0x5208",
            cumulativeGasUsed: "0x5208", effectiveGasPrice: "0x3b9aca00",
            logsBloom: "0x" + "0".repeat(512),
            logs: [{
              address: CONTRACT_ADDR,
              topics: [EVENT_SIG, FROM_TOPIC, TO_TOPIC],
              data: DATA_VALUE,
              logIndex: "0x0", transactionIndex: "0x0",
              transactionHash: TX_HASH,
              blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              blockNumber: "0x1", removed: false,
            }],
            type: "0x2",
          },
        });
      } else if (method === "eth_call") {
        // Mock the getContractName call for name() which is 0x06fdde03
        if (req.body.params?.[0]?.data?.startsWith("0x06fdde03")) {
          req.reply({
            jsonrpc: "2.0", id, result: "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000954657374546f6b656e0000000000000000000000000000000000000000000000" // "TestToken"
          });
        } else {
          req.reply({ jsonrpc: "2.0", id, result: "0x" });
        }
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else {
        req.continue();
      }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");

    // Overview tab assertions
    cy.contains("Interacted With").should("be.visible");
    cy.contains("TestToken").should("be.visible");
    cy.contains("Method").should("be.visible");
    cy.contains("transfer").should("be.visible");
    cy.contains("Recipient").should("be.visible");
    cy.contains("0x70997970c51812dc3a010c7d01b50e0d17dc79c8", { matchCase: false }).should("be.visible");

    cy.contains("[role='tab']", /Logs \(1\)/i).should("be.visible").click();

    // card title is always "Event"; decoded name appears in Event DetailRow
    cy.contains("Transfer").should("be.visible");
    // Contract label and emitting contract address/name
    cy.contains("Contract").should("be.visible");
    cy.contains(CONTRACT_ADDR, { matchCase: false }).should("be.visible");
    cy.contains("TestToken").should("be.visible");

    // decoded param labels
    cy.contains("from").should("be.visible");
    cy.contains("to").should("be.visible");
    cy.contains("value").should("be.visible");
    // decoded value (1000 decimal)
    cy.contains("1000").should("be.visible");
  });

  // ── Settings dialog – 4byte toggle ─────────────────────────────────────────

  it("4byte toggle and description are present in settings dialog", () => {
    cy.visit("/");
    cy.get("body").then(($body) => {
      const ctaBtn = $body.find('button:contains("Configure RPC Endpoint")');
      if (ctaBtn.length > 0 && ctaBtn.is(":visible")) {
        cy.wrap(ctaBtn).first().click();
      } else {
        cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
      }
    });
    cy.contains("h2", "Configure RPC Endpoint").should("be.visible");
    cy.get('input[id="use-4byte"]').should("exist");
    cy.contains(/Resolve unknown events via 4byte.directory/i).should("be.visible");
    cy.contains(/human-readable/i).should("be.visible");
  });

  it("4byte toggle persists its state across dialog close and reopen", () => {
    setupRPC();

    cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
    cy.get('input[id="use-4byte"]').should("be.checked");
    cy.get('input[id="use-4byte"]').click();
    cy.get('input[id="use-4byte"]').should("not.be.checked");
    cy.get("body").type("{esc}");

    cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
    cy.get('input[id="use-4byte"]').should("not.be.checked");
  });

  it("4byte toggle state is remembered after page reload", () => {
    setupRPC();

    cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
    cy.get('input[id="use-4byte"]').click();
    cy.get('input[id="use-4byte"]').should("not.be.checked");
    cy.get("body").type("{esc}");

    cy.reload();

    cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
    cy.get('input[id="use-4byte"]').should("not.be.checked");
  });

  // ── Transaction logs – use4byte=true, known event (locally decoded) ────────

  it("does NOT call 4byte for locally-decoded known events", () => {
    setupRPC();

    const TX_HASH = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const CONTRACT_ADDR = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
    const EVENT_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const FROM_TOPIC = "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    const TO_TOPIC = "0x00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c8";
    const DATA_VALUE = "0x00000000000000000000000000000000000000000000000000000000000003e8";

    cy.intercept("GET", "https://www.4byte.directory/**").as("fourByteReq");

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({ jsonrpc: "2.0", id, result: {
          hash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT_ADDR, value: "0x0", gas: "0x5208", gasPrice: "0x3b9aca00",
          input: "0xa9059cbb00000000000000000000000070997970c51812dc3a010c7d01b50e0d17dc79c800000000000000000000000000000000000000000000000000000000000003e8",
          nonce: "0x0", transactionIndex: "0x0", type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
        }});
      } else if (method === "eth_getTransactionReceipt") {
        req.reply({ jsonrpc: "2.0", id, result: {
          transactionHash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          transactionIndex: "0x0",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT_ADDR, contractAddress: null,
          status: "0x1", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
          effectiveGasPrice: "0x3b9aca00",
          logsBloom: "0x" + "0".repeat(512),
          logs: [{ address: CONTRACT_ADDR, topics: [EVENT_SIG, FROM_TOPIC, TO_TOPIC],
            data: DATA_VALUE, logIndex: "0x0", transactionIndex: "0x0",
            transactionHash: TX_HASH,
            blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            blockNumber: "0x1", removed: false }],
          type: "0x2",
        }});
      } else if (method === "eth_call") {
        req.reply({ jsonrpc: "2.0", id, result: "0x" });
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else { req.continue(); }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs/i).click();
    cy.contains("Transfer").should("be.visible");

    // 4byte should never have been called for a locally-known ERC-20 Transfer
    cy.get("@fourByteReq.all").should("have.length", 0);
  });

  // ── Transaction logs – use4byte=true, unknown event ───────────────────────

  it("auto-resolves unknown event via 4byte when use4byte is enabled", () => {
    setupRPC();

    const TX_HASH = "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
    const CONTRACT = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const DEPOSIT_TOPIC = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";

    cy.intercept(
      "GET",
      `https://www.4byte.directory/api/v1/event-signatures/?hex_signature=${DEPOSIT_TOPIC}`,
      { count: 1, results: [{ text_signature: "Deposit(address,uint256)" }] },
    ).as("fourByteDeposit");

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({ jsonrpc: "2.0", id, result: {
          hash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, value: "0x1", gas: "0x5208", gasPrice: "0x3b9aca00",
          input: "0xd0e30db0", nonce: "0x0", transactionIndex: "0x0",
          type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
        }});
      } else if (method === "eth_getTransactionReceipt") {
        req.reply({ jsonrpc: "2.0", id, result: {
          transactionHash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          transactionIndex: "0x0",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, contractAddress: null,
          status: "0x1", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
          effectiveGasPrice: "0x3b9aca00",
          logsBloom: "0x" + "0".repeat(512),
          logs: [{ address: CONTRACT,
            topics: [DEPOSIT_TOPIC, "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266"],
            data: "0x00000000000000000000000000000000000000000000000000000000000003e8",
            logIndex: "0x0", transactionIndex: "0x0", transactionHash: TX_HASH,
            blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            blockNumber: "0x1", removed: false }],
          type: "0x2",
        }});
      } else if (method === "eth_call") {
        req.reply({ jsonrpc: "2.0", id, result: "0x" });
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else { req.continue(); }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs/i).click();

    cy.wait("@fourByteDeposit");
    cy.contains("Deposit", { timeout: 10000 }).should("be.visible");
    // raw Event Sig row still present (no local ABI to decode params)
    cy.contains("Event Sig").should("be.visible");
    cy.contains("Other").should("not.exist");
  });

  it("shows 'Other' in Event row when 4byte returns no results", () => {
    setupRPC();

    const TX_HASH = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    const CONTRACT = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const UNKNOWN_TOPIC = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    cy.intercept(
      "GET",
      `https://www.4byte.directory/api/v1/event-signatures/?hex_signature=${UNKNOWN_TOPIC}`,
      { count: 0, results: [] },
    ).as("fourByteEmpty");

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({ jsonrpc: "2.0", id, result: {
          hash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, value: "0x0", gas: "0x5208", gasPrice: "0x3b9aca00",
          input: "0x", nonce: "0x0", transactionIndex: "0x0",
          type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
        }});
      } else if (method === "eth_getTransactionReceipt") {
        req.reply({ jsonrpc: "2.0", id, result: {
          transactionHash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          transactionIndex: "0x0",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, contractAddress: null,
          status: "0x1", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
          effectiveGasPrice: "0x3b9aca00",
          logsBloom: "0x" + "0".repeat(512),
          logs: [{ address: CONTRACT, topics: [UNKNOWN_TOPIC], data: "0x",
            logIndex: "0x0", transactionIndex: "0x0", transactionHash: TX_HASH,
            blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            blockNumber: "0x1", removed: false }],
          type: "0x2",
        }});
      } else if (method === "eth_call") {
        req.reply({ jsonrpc: "2.0", id, result: "0x" });
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else { req.continue(); }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs/i).click();

    cy.wait("@fourByteEmpty");
    cy.contains("Other", { timeout: 10000 }).should("be.visible");
    cy.contains("button", /Resolve/i).should("not.exist");
  });

  // ── Transaction logs – use4byte=false (opted out), unknown event ──────────

  it("shows 'Other' with no Resolve button when use4byte is disabled", () => {
    cy.window().then((win) => {
      win.localStorage.setItem(
        "eth-explorer-config",
        JSON.stringify({ state: { rpcUrl: HARDHAT_RPC, use4byte: false }, version: 0 }),
      );
    });

    const TX_HASH = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    const CONTRACT = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const UNKNOWN_TOPIC = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";

    cy.intercept("GET", "https://www.4byte.directory/**").as("fourByteAuto");

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({ jsonrpc: "2.0", id, result: {
          hash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, value: "0x0", gas: "0x5208", gasPrice: "0x3b9aca00",
          input: "0x", nonce: "0x0", transactionIndex: "0x0",
          type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
        }});
      } else if (method === "eth_getTransactionReceipt") {
        req.reply({ jsonrpc: "2.0", id, result: {
          transactionHash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          transactionIndex: "0x0",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, contractAddress: null,
          status: "0x1", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
          effectiveGasPrice: "0x3b9aca00",
          logsBloom: "0x" + "0".repeat(512),
          logs: [{ address: CONTRACT, topics: [UNKNOWN_TOPIC], data: "0x",
            logIndex: "0x0", transactionIndex: "0x0", transactionHash: TX_HASH,
            blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            blockNumber: "0x1", removed: false }],
          type: "0x2",
        }});
      } else if (method === "eth_call") {
        req.reply({ jsonrpc: "2.0", id, result: "0x" });
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else { req.continue(); }
    });

    cy.visit("/");
    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs/i).click();

    cy.contains("Other", { timeout: 10000 }).should("be.visible");
    cy.contains("button", /Resolve/i).should("not.exist");
    // 4byte should NOT have been called at all
    cy.get("@fourByteAuto.all").should("have.length", 0);
  });

  // ── Deduplication ──────────────────────────────────────────────────────────

  it("sends only one 4byte request for multiple logs sharing the same unknown topic", () => {
    setupRPC();

    const TX_HASH = "0xddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddde";
    const CONTRACT = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const DEPOSIT_TOPIC = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";

    cy.intercept(
      "GET",
      `https://www.4byte.directory/api/v1/event-signatures/?hex_signature=${DEPOSIT_TOPIC}`,
      { count: 1, results: [{ text_signature: "Deposit(address,uint256)" }] },
    ).as("fourByteDedup");

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({ jsonrpc: "2.0", id, result: {
          hash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, value: "0x0", gas: "0x5208", gasPrice: "0x3b9aca00",
          input: "0x", nonce: "0x0", transactionIndex: "0x0",
          type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
        }});
      } else if (method === "eth_getTransactionReceipt") {
        const sameLog = {
          address: CONTRACT, topics: [DEPOSIT_TOPIC],
          data: "0x00000000000000000000000000000000000000000000000000000000000003e8",
          transactionHash: TX_HASH,
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          blockNumber: "0x1", removed: false,
        };
        req.reply({ jsonrpc: "2.0", id, result: {
          transactionHash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          transactionIndex: "0x0",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, contractAddress: null,
          status: "0x1", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
          effectiveGasPrice: "0x3b9aca00",
          logsBloom: "0x" + "0".repeat(512),
          logs: [
            { ...sameLog, logIndex: "0x0", transactionIndex: "0x0" },
            { ...sameLog, logIndex: "0x1", transactionIndex: "0x0" },
            { ...sameLog, logIndex: "0x2", transactionIndex: "0x0" },
          ],
          type: "0x2",
        }});
      } else if (method === "eth_call") {
        req.reply({ jsonrpc: "2.0", id, result: "0x" });
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else { req.continue(); }
    });

    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs \(3\)/i).click();

    // All three cards should show "Deposit"
    cy.contains("Deposit", { timeout: 10000 }).should("be.visible");
    // 4byte was called only once despite three logs with the same topic
    cy.get("@fourByteDedup.all").should("have.length", 1);
  });

  // ── Settings interaction flow ──────────────────────────────────────────────

  it("disabling use4byte after auto-resolution shows 'Other' (no Resolve button) on reload", () => {
    setupRPC();

    const TX_HASH = "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
    const CONTRACT = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const DEPOSIT_TOPIC = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";

    cy.intercept(
      "GET",
      `https://www.4byte.directory/api/v1/event-signatures/?hex_signature=${DEPOSIT_TOPIC}`,
      { count: 1, results: [{ text_signature: "Deposit(address,uint256)" }] },
    );

    cy.intercept("POST", HARDHAT_RPC, (req) => {
      const { method, id } = req.body;
      if (method === "eth_getTransactionByHash") {
        req.reply({ jsonrpc: "2.0", id, result: {
          hash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, value: "0x0", gas: "0x5208", gasPrice: "0x3b9aca00",
          input: "0x", nonce: "0x0", transactionIndex: "0x0",
          type: "0x0", v: "0x1b", r: "0x1", s: "0x1",
        }});
      } else if (method === "eth_getTransactionReceipt") {
        req.reply({ jsonrpc: "2.0", id, result: {
          transactionHash: TX_HASH, blockNumber: "0x1",
          blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          transactionIndex: "0x0",
          from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          to: CONTRACT, contractAddress: null,
          status: "0x1", gasUsed: "0x5208", cumulativeGasUsed: "0x5208",
          effectiveGasPrice: "0x3b9aca00",
          logsBloom: "0x" + "0".repeat(512),
          logs: [{ address: CONTRACT, topics: [DEPOSIT_TOPIC], data: "0x",
            logIndex: "0x0", transactionIndex: "0x0", transactionHash: TX_HASH,
            blockHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            blockNumber: "0x1", removed: false }],
          type: "0x2",
        }});
      } else if (method === "eth_call") {
        req.reply({ jsonrpc: "2.0", id, result: "0x" });
      } else if (method === "eth_blockNumber") {
        req.reply({ jsonrpc: "2.0", id, result: "0x5" });
      } else { req.continue(); }
    });

    // Step 1: navigate to tx with use4byte=true, verify auto-resolution
    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs/i).click();
    cy.contains("Deposit", { timeout: 10000 }).should("be.visible");

    // Step 2: open settings, disable 4byte
    cy.contains("[role='tab']", /Overview/i).click();
    cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
    cy.get('input[id="use-4byte"]').click();
    cy.get('input[id="use-4byte"]').should("not.be.checked");
    cy.get("body").type("{esc}");

    // Step 3: reload and navigate back to same tx
    cy.reload();
    cy.get("input[placeholder*='tx hash']").first().clear().type(`${TX_HASH}{enter}`);
    cy.contains(/Transaction Details/i, { timeout: 10000 }).should("be.visible");
    cy.contains("[role='tab']", /Logs/i).click();

    // "Other" is shown with no Resolve button when 4byte is disabled
    cy.contains("Other", { timeout: 10000 }).should("be.visible");
    cy.contains("button", /Resolve/i).should("not.exist");
  });

  it("closes RPC configuration dialog on cancel", () => {
    cy.visit("/");
    
    cy.get("body").then(($body) => {
      const ctaBtn = $body.find('button:contains("Configure RPC Endpoint")');
      if (ctaBtn.length > 0 && ctaBtn.is(':visible')) {
        cy.wrap(ctaBtn).first().click();
      } else {
        cy.get('button[aria-label="Configure RPC endpoint"]').first().click({ force: true });
      }
    });

    cy.contains("h2", "Configure RPC Endpoint").should("be.visible");
    cy.get("body").type("{esc}");
    cy.contains("h2", "Configure RPC Endpoint").should("not.exist");
  });
});