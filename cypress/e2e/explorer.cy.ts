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
    cy.contains(/fetch failed|network error|failed to fetch|refused/i, { timeout: 10000 }).should("be.visible");
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