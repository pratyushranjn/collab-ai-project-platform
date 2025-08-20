import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Navbar />
        <main className="flex-1 mt-16 text-white" style={{ backgroundColor: "#0f172a" }}>
          <Outlet />
        </main>
      </div>
      
    </div>
  );
}

