import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function Layout() {
  return (
    <div className="app-shell flex min-h-screen flex-col text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-4 mt-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            Released under the{" "}
            <a
              href="https://www.gnu.org/licenses/gpl-3.0.en.html#license-text"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              GNU General Public License v3.0
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
