import { HashRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { BlockPage } from "@/components/block/BlockPage";
import { TransactionPage } from "@/components/transaction/TransactionPage";
import { AccountPage } from "@/components/account/AccountPage";
import { ConfigureRpcDialog } from "@/components/common/ConfigureRpcDialog";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { EthereumProvider } from "@/hooks/useEthereum";

export function App() {
  return (
    <HashRouter>
      <TooltipProvider>
        <EthereumProvider>
          <ErrorBoundary>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="block/:blockId" element={<BlockPage />} />
                <Route path="tx/:txHash" element={<TransactionPage />} />
                <Route path="account/:address" element={<AccountPage />} />
              </Route>
            </Routes>
          </ErrorBoundary>
          <ConfigureRpcDialog />
        </EthereumProvider>
      </TooltipProvider>
    </HashRouter>
  );
}
