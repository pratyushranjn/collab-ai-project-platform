import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 ">
        Welcome, {user?.name || "User"}!
      </h1>

    </div>
  );
}
