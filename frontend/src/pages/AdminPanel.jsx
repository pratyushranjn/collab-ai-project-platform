import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getAdminProjects,
  getAdminUsers,
  getAdminProjectById,
  updateAdminProject,
  deleteAdminProject,
  addAdminMemberByEmail,
  removeAdminMember,
  getProjectAnalytics,
} from "../api/adminApi";

// Normalize API shapes: supports {data: {...}} or flat {...}
const norm = (res) => (res && typeof res === "object" && "data" in res ? res.data : res);

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  // edit modal state
  const [editing, setEditing] = useState(null); // project object or null
  // members modal state
  const [membersOf, setMembersOf] = useState(null); // project object or null
  const [assignees, setAssignees] = useState([]);   // [{userId,name,email,role?,count}]
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // load projects from /admin/projects (server-side search)
  const loadProjects = async (query = "") => {
    setLoading(true);
    try {
      const res = await getAdminProjects({ page: 1, limit: 50, q: query });
      const data = norm(res);
      setProjects(Array.isArray(data?.data) ? data.data : data || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // load users from /admin/users (for PM dropdown)
  const loadUsers = async () => {
    try {
      const res = await getAdminUsers({ page: 1, limit: 500 });
      const data = norm(res);
      setUsers(Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : data?.data || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  // server-side search: call admin endpoint when q changes (debounced feel)
  useEffect(() => {
    const t = setTimeout(() => loadProjects(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // You can still keep client filter as a fallback (optional)
  const filtered = useMemo(() => projects, [projects]);

  // --- actions ---
  const onEditClick = async (p) => {
    // load fresh to ensure we have description populated
    try {
      const fresh = await getAdminProjectById(p._id);   // { success, data } or flat
      const proj = norm(fresh) || p;
      setEditing({ ...proj, description: proj?.description ?? "" });
    } catch {
      setEditing({ ...p, description: p?.description ?? "" });
    }
  };
  const onEditChange = (next) => setEditing(next);
  const onCancelEdit = () => setEditing(null);

  const onSaveEdit = async () => {
    try {
      const payload = {
        name: editing.name,
        description: editing.description,
        projectManager:
          editing.projectManager?._id ||
          editing.projectManager || // if it's already an id
          undefined,
      };

      await toast.promise(updateAdminProject(editing._id, payload), {
        loading: "Saving changes...",
        success: "Project updated",
        error: (e) => e?.response?.data?.message || "Failed to save",
      });

      setEditing(null);
      await loadProjects(q.trim());
    } catch (e) {
      // error toast handled by toast.promise
    }
  };

  const onDeleteClick = async (id) => {
    if (!window.confirm("Delete this project and its tasks?")) return;
    try {
      await toast.promise(deleteAdminProject(id), {
        loading: "Deleting project...",
        success: "Project deleted",
        error: (e) => e?.response?.data?.message || "Failed to delete",
      });
      await loadProjects(q.trim());
    } catch (e) {}
  };

  const onMembersClick = async (p) => {
    try {
      // Load fresh detail with populated members
      const fresh = await getAdminProjectById(p._id);   // { success, data }
      const analytics = await getProjectAnalytics(p._id); // { statusCounts, assigneeCounts, leadTime } or wrapped
      const proj = norm(fresh) || p;
      const a = norm(analytics);
      setMembersOf(proj);
      setAssignees(a?.assigneeCounts || []);
      setNewMemberEmail("");
    } catch {
      setMembersOf(p);
      setAssignees([]);
      setNewMemberEmail("");
    }
  };

  const onCloseMembers = () => {
    setMembersOf(null);
    setAssignees([]);
    setNewMemberEmail("");
  };

  const onRemoveMember = async (memberId) => {
    try {
      await toast.promise(removeAdminMember(membersOf._id, memberId), {
        loading: "Removing member...",
        success: "Member removed",
        error: (e) => e?.response?.data?.message || "Failed to remove",
      });

      const fresh = await getAdminProjectById(membersOf._id);
      const analytics = await getProjectAnalytics(membersOf._id);
      const proj = norm(fresh) || membersOf;
      const a = norm(analytics);
      setMembersOf(proj);
      setAssignees(a?.assigneeCounts || []);
      // refresh list row
      await loadProjects(q.trim());
    } catch (e) {}
  };

  const onAddMember = async () => {
    const email = newMemberEmail.trim().toLowerCase();
    if (!email) return toast.error("Enter an email");
    try {
      await toast.promise(addAdminMemberByEmail(membersOf._id, email), {
        loading: "Adding member...",
        success: "Member added",
        error: (e) => e?.response?.data?.message || "Failed to add member",
      });

      setNewMemberEmail("");
      const fresh = await getAdminProjectById(membersOf._id);
      const analytics = await getProjectAnalytics(membersOf._id);
      setMembersOf(norm(fresh) || membersOf);
      setAssignees((norm(analytics)?.assigneeCounts) || []);
      await loadProjects(q.trim());
    } catch (e) {}
  };

  // helpers
  const membersCount = (p) =>
    p?.membersCount ??
    (Array.isArray(p?.members) ? p.members.length : 0);

  // number of working users (role === 'user' OR role missing) assigned to >=1 task
  const workingUserCount = useMemo(() => {
    if (!Array.isArray(assignees)) return 0;
    return assignees.filter((a) => (a.role ?? 'user') === 'user' && (a.count ?? 0) > 0).length;
  }, [assignees]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-72 md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            placeholder="Search projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 md:pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <Th>Name</Th>
                    <Th className="hidden sm:table-cell">Project Manager</Th>
                    <Th className="hidden md:table-cell">Created By(Admin)</Th>
                    <Th className="text-center">Members</Th>
                    <Th className="hidden lg:table-cell">Created At</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.length === 0 && (
                    <tr>
                      <td className="text-center py-8 text-gray-400" colSpan={6}>
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>No projects found</p>
                          {q && <p className="text-sm mt-1">Try adjusting your search query</p>}
                        </div>
                      </td>
                    </tr>
                  )}

                  {filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-800/50 transition-colors">
                      <Td className="font-medium text-white">
                        <div className="flex flex-col">
                          <span>{p.name}</span>
                          <span className="text-xs text-gray-400 sm:hidden mt-1">
                            {p.projectManager ? `PM: ${p.projectManager.name}` : "No PM"}
                          </span>
                        </div>
                      </Td>
                      <Td className="hidden sm:table-cell">
                        {p.projectManager ? (
                          <div>
                            <div className="text-white">{p.projectManager.name}</div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="hidden md:table-cell">
                        {p.createdBy ? (
                          <div>
                            <div className="text-white">{p.createdBy.name}</div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td className="text-center">
                        <div className="flex items-center justify-center">
                          <span className="mr-2">{membersCount(p)}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </Td>
                      <Td className="text-gray-300 hidden lg:table-cell">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      </Td>
                      <Td>
                        <div className="flex space-x-2 justify-end md:justify-start">
                          <button
                            className="p-1.5 rounded-md bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 transition-colors"
                            onClick={() => onEditClick(p)}
                            title="Edit project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="p-1.5 rounded-md bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                            onClick={() => onDeleteClick(p._id)}
                            title="Delete project"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            className="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                            onClick={() => onMembersClick(p)}
                            title="Manage members"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Modal */}
          {editing && (
            <Modal title="Edit Project" onClose={() => setEditing(null)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editing.name}
                    onChange={(e) => onEditChange({ ...editing, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editing.description ?? ""}
                    onChange={(e) => onEditChange({ ...editing, description: e.target.value })}
                    placeholder="Brief summary of the project..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Manager</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editing.projectManager?._id || editing.projectManager || ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      const pm = users.find((u) => u._id === id);
                      onEditChange({ ...editing, projectManager: pm || "" });
                    }}
                  >
                    <option value="">— No PM —</option>
                    {users
                      .filter((u) => u.role === "project-manager")
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    onClick={onSaveEdit}
                  >
                    Save Changes
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    onClick={onCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>
          )}

          {/* Members Modal */}
          {membersOf && (
            <Modal title={`Members of ${membersOf.name}`} onClose={onCloseMembers}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">Working users</h3>
                  <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700">{workingUserCount}</span>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Current Members</h3>

                  {/* Prefer analytics list with counts; fallback to raw members */}
                  {Array.isArray(assignees) && assignees.length > 0 ? (
                    <ul className="divide-y divide-gray-700">
                      {assignees.map((a) => (
                        <li key={a.userId} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="text-white block">{a.name || "Unknown"}</span>
                            <span className="text-gray-400 text-sm">{a.email || ""}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-200">Tasks: {a.count ?? 0}</span>
                            <button
                              className="px-2 py-1 text-xs rounded-md bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                              onClick={() => onRemoveMember(a.userId)}
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : Array.isArray(membersOf.members) && membersOf.members.length > 0 ? (
                    <ul className="divide-y divide-gray-700">
                      {membersOf.members.map((m) => (
                        <li key={m._id} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="text-white block">{m.name}</span>
                            <span className="text-gray-400 text-sm">{m.email}</span>
                          </div>
                          <button
                            className="px-2 py-1 text-xs rounded-md bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors"
                            onClick={() => onRemoveMember(m._id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No members yet</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Add New Member</h3>
                  <div className="flex gap-2">
                    <input
                      placeholder="Enter user email"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                    <button
                      className="px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      onClick={onAddMember}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}

function Th({ children, className = "" }) {
  return <th className={`px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${className}`}>{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`px-3 py-3 whitespace-nowrap ${className}`}>{children}</td>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

