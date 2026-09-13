import React, { useEffect, useMemo,  useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Archive,
  BookOpen,
  ChevronDown,
  FileText,
  Folder,
  Hash,
  Tag,
  Menu,
  Moon,
  MoreHorizontal,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sun,
  Trash2,
  X,
  LogOut
} from "lucide-react";

import AuthScreen from "./AuthScreen";
import { useAuth } from "./context/AuthContext";

const API = "http://localhost:5000/api/notes";

const starterNotes = [
  {
    _id: "demo-1",
    title: "Welcome to NoteSpace",
    content:
      "Your ideas deserve a calm place to grow. Create a note, add tags, pin important ideas and keep everything organized.",
    folder: "Personal",
    tags: ["welcome", "ideas"],
    pinned: true,
    archived: false,
    trashed: false,
    color: "violet",
    updatedAt: new Date().toISOString()
  },
  {
    _id: "demo-2",
    title: "Project Ideas",
    content:
      "Build a portfolio dashboard, AI study assistant and a campus event planner.",
    folder: "Projects",
    tags: ["college", "development"],
    pinned: false,
    archived: false,
    trashed: false,
    color: "blue",
    updatedAt: new Date().toISOString()
  }
];
function App() {
const {
  user,
  token,

  isAuthenticated,
  login,
  register,
  logout,
  loading,
} = useAuth();

const authHeaders = token
  ? {
      Authorization: `Bearer ${token}`,
    }
  : {};

  const [notes, setNotes] = useState([]);

  const [folders, setFolders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTag, setSelectedTag] = useState("");
  const [dark, setDark] = useState(
    () => localStorage.getItem("notes-theme") === "dark"
  );
  const [mobileNav, setMobileNav] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [notice, setNotice] = useState("");
  const [editorMode, setEditorMode] = useState("write");

  const displayedNotes = useMemo(() => {
    const filtered = selectedTag
      ? notes.filter((note) =>
          (note.tags || []).some(
            (tag) =>
              tag.toLowerCase() === selectedTag.toLowerCase()
          )
        )
      : [...notes];

    return filtered.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.updatedAt) - new Date(b.updatedAt);
      }

      if (sortBy === "az") {
        return (a.title || "").localeCompare(b.title || "");
      }

      if (sortBy === "za") {
        return (b.title || "").localeCompare(a.title || "");
      }

      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes, selectedTag, sortBy]);

  useEffect(() => {
  if (!isAuthenticated || !token) return;

  loadNotes();
}, [view, search, isAuthenticated, token]);
  useEffect(() => {
  if (!isAuthenticated || !token) return;

  loadFolders();
}, [isAuthenticated, token]);
  // Close profile menu when clicking outside it
  useEffect(() => {
    if (!profileMenu) return;

    const handleProfileEscape = (event) => {
      if (event.key === "Escape") {
        setProfileMenu(false);
      }
    };

    document.addEventListener("keydown", handleProfileEscape);

    return () => {
      document.removeEventListener("keydown", handleProfileEscape);
    };
  }, [profileMenu]);

  useEffect(() => {
    if (!profileMenu) return;

    const handleProfileOutside = (event) => {
      if (!event.target.closest(".profile")) {
        setProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleProfileOutside);

    return () => {
      document.removeEventListener("mousedown", handleProfileOutside);
    };
  }, [profileMenu]);

async function deleteFolder(folder) {
  const confirmed = window.confirm(
    `Delete the folder "${folder.name}"?\n\nNotes inside it will be moved to Personal.`
  );

  if (!confirmed) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/folders/${folder._id}`,
      {
        method: "DELETE",
        headers: {
          ...authHeaders,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete folder");
    }

    // Remove folder from sidebar
    setFolders((prev) =>
      prev.filter((item) => item._id !== folder._id)
    );

    // If currently viewing this folder, return to All notes
    if (view === folder.name) {
      setView("All");
      setSelected(null);
    }

    // Reload notes so moved notes appear correctly
    await loadNotes();

    setNotice(`Folder "${folder.name}" deleted successfully.`);
  } catch (error) {
    console.error("❌ Delete folder error:", error);
    alert(error.message || "Failed to delete folder");
  }
}

  async function renameFolder(folder) {
    const newName = window.prompt(
      "Enter new folder name:",
      folder.name
    );

    if (!newName || !newName.trim()) return;

    const trimmedName = newName.trim();

    if (trimmedName === folder.name) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/folders/${folder._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Failed to rename folder"
        );
      }

      setFolders((prev) =>
        prev
          .map((item) =>
            item._id === folder._id
              ? { ...item, name: data.name }
              : item
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
      );

      if (view === folder.name) {
        setView(data.name);
        setSelected(null);
      }

      await loadNotes();

      setNotice(
        `Folder renamed to "${data.name}".`
      );
    } catch (error) {
      console.error("❌ Rename folder error:", error);
      alert(
        error.message || "Failed to rename folder"
      );
    }
  }

async function loadFolders() {
  try {
    const res = await fetch("http://localhost:5000/api/folders", {
  headers: authHeaders,
});

    if (!res.ok) {
      throw new Error("Failed to load folders");
    }

    const data = await res.json();
    setFolders(data);
  } catch (error) {
    console.error("Failed to load folders:", error);
  }
}

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("notes-theme", dark ? "dark" : "light");
  }, [dark]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyboardShortcuts(e) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // ⌘/Ctrl + N → New note
      if (modifier && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNote();
      }

      // ⌘/Ctrl + K → Focus search
      if (modifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(
          ".search input"
        );
        searchInput?.focus();
      }

      // ⌘/Ctrl + S → Save current note
      if (modifier && e.key.toLowerCase() === "s") {
        e.preventDefault();

        if (selected?.content !== undefined) {
          updateNote({
            title: selected.title,
            content: selected.content,
            folder: selected.folder,
            tags: selected.tags,
            color: selected.color,
            pinned: selected.pinned,
            archived: selected.archived,
            trashed: selected.trashed,
          });
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboardShortcuts
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboardShortcuts
      );
    };
  }, []);



function handleEditorShortcuts(e) {
  const textarea = e.target;

  if (!textarea.classList.contains("editor-content")) return;

  const modifier = e.metaKey || e.ctrlKey;

  // Tab → insert two spaces
  if (e.key === "Tab" && !modifier) {
    e.preventDefault();

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = selected?.content || "";

    if (e.shiftKey) {
      // Shift + Tab → remove indentation
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const beforeLine = text.slice(lineStart, start);

      if (beforeLine.startsWith("  ")) {
        updateNote({
          content:
            text.slice(0, lineStart) +
            text.slice(lineStart + 2),
        });

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(
            Math.max(lineStart, start - 2),
            Math.max(lineStart, end - 2)
          );
        });
      }

      return;
    }

    // Normal Tab → insert two spaces
    updateNote({
      content:
        text.slice(0, start) +
        "  " +
        text.slice(end),
    });

    requestAnimationFrame(() => {
      textarea.focus();

      const position = start + 2;

      textarea.setSelectionRange(
        position,
        position
      );
    });

    return;
  }

  if (!modifier) return;

  // ⌘/Ctrl + B → Bold
  if (e.key.toLowerCase() === "b") {
    e.preventDefault();
    formatText("**", "**");
  }

  // ⌘/Ctrl + I → Italic
  if (e.key.toLowerCase() === "i") {
    e.preventDefault();
    formatText("*", "*");
  }

  // ⌘/Ctrl + Shift + 8 → Bullet list
  if (e.shiftKey && e.key === "8") {
    e.preventDefault();
    insertMarkdown("- ");
  }

  // ⌘/Ctrl + Shift + 7 → Numbered list
  if (e.shiftKey && e.key === "7") {
    e.preventDefault();
    insertMarkdown("1. ");
  }
}
function cleanMarkdownPreview(content = "") {
  return content
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*-\s*\[[ xX]\]\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatText(before, after = before) {
  const textarea = document.querySelector(".editor-content");

  if (!textarea || !selected) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = selected.content || "";
  const selectedText = text.slice(start, end);

  const replacement = before + selectedText + after;

  updateNote({
    content:
      text.slice(0, start) +
      replacement +
      text.slice(end)
  });

  requestAnimationFrame(() => {
    textarea.focus();

    const newStart = start + before.length;
    const newEnd = newStart + selectedText.length;

    textarea.setSelectionRange(newStart, newEnd);
  });
}

function insertMarkdown(prefix) {
  const textarea = document.querySelector(".editor-content");

  if (!textarea || !selected) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = selected.content || "";
  const selectedText = text.slice(start, end);

  const replacement = prefix + selectedText;

  updateNote({
    content:
      text.slice(0, start) +
      replacement +
      text.slice(end)
  });

  requestAnimationFrame(() => {
    textarea.focus();

    const cursorPosition =
      start + replacement.length;

    textarea.setSelectionRange(
      cursorPosition,
      cursorPosition
    );
  });
}

async function loadNotes() {
    const params = new URLSearchParams();

    if (search) params.set("search", search);



    if (view === "Archived") {
      params.set("archived", "true");
    } else if (view === "Trash") {
      params.set("trashed", "true");
    } else if (view !== "All") {
      params.set("folder", view);
    }

    try {
      const res = await fetch(`${API}?${params}`, {
  headers: authHeaders,
});
      if (!res.ok) {
        throw new Error("Failed to load notes");
      }

      const data = await res.json();
      setNotes(data);
      setNotice("");
    } catch (error) {
      console.error(error);

      setNotes(
        starterNotes.filter((n) => {
          if (view === "Archived") return n.archived;
          if (view === "Trash") return n.trashed;
          if (view !== "All") return n.folder === view;

          return !n.archived && !n.trashed;
        })
      );

      setNotice("Demo mode: backend unavailable.");
    }
  }


async function togglePin(note, e) {
  if (e) e.stopPropagation();

  await updateNote({
    pinned: !note.pinned
  });
}

async function moveToTrash(note, e) {
  if (e) e.stopPropagation();

  const confirmed = window.confirm(
    `Move "${note.title || "Untitled note"}" to Trash?`
  );

  if (!confirmed) return;

  await updateNote({
    trashed: true
  });

  if (selected?._id === note._id) {
    setSelected(null);
  }
}

async function updateNote(patch) {
  if (!selected?._id) return;

  const noteId = selected._id;

  const next = {
    ...selected,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  // Update UI immediately
  setSelected(next);

  setNotes((prev) =>
    prev.map((n) =>
      n._id === noteId ? next : n
    )
  );

  // Local/demo notes don't need MongoDB
  if (
    String(noteId).startsWith("local-") ||
    String(noteId).startsWith("demo-")
  ) {
    return;
  }

  setSaving(true);

  try {
    const res = await fetch(`${API}/${noteId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    ...authHeaders,
  },
  body: JSON.stringify(patch),
});

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to save note: ${res.status} ${errorText}`
      );
    }

    const savedNote = await res.json();

    // Only replace the note if it is still the selected note
    setSelected((current) =>
      current?._id === noteId ? savedNote : current
    );

    setNotes((prev) =>
      prev.map((n) =>
        n._id === noteId ? savedNote : n
      )
    );

    console.log("✅ Note saved:", savedNote);
  } catch (error) {
    console.error("❌ Update note error:", error);
  } finally {
    setSaving(false);
  }
}
async function createNote() {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        title: "Untitled note",
        content: "",
        folder: view !== "All" && view !== "Archived" && view !== "Trash"
          ? view
          : "Personal",
        tags: [],
        color: "violet",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to create note: ${res.status} ${errorText}`
      );
    }

    const newNote = await res.json();

    setNotes((prev) => [newNote, ...prev]);
    setSelected(newNote);
    setNotice("");
    setSaveError(false);

    console.log("✅ Note created:", newNote);
  } catch (error) {
    console.error("❌ Create note error:", error);
    setNotice("Unable to create note. Check that the backend is running.");
  }
}

  async function action(type) {
    if (!selected) return;

    if (
      String(selected._id).startsWith("demo-") ||
      String(selected._id).startsWith("local-")
    ) {
      if (type === "archive") {
        setNotes((prev) =>
          prev.map((n) =>
            n._id === selected._id
              ? { ...n, archived: true }
              : n
          )
        );
      }

      if (type === "restore") {
        setNotes((prev) =>
          prev.map((n) =>
            n._id === selected._id
              ? {
                  ...n,
                  archived: false,
                  trashed: false
                }
              : n
          )
        );
      }

      if (type === "pin") {
        const next = {
          ...selected,
          pinned: !selected.pinned
        };

        setSelected(next);

        setNotes((prev) =>
          prev.map((n) =>
            n._id === selected._id ? next : n
          )
        );

        return;
      }

      setSelected(null);
      return;
    }

    const endpoint =
      type === "pin"
        ? "pin"
        : type === "archive"
        ? "archive"
        : "restore";

    const res = await fetch(
      `${API}/${selected._id}/${endpoint}`,
     {
  method: "PATCH",
  headers: authHeaders,
}
    );

    const data = await res.json();

    setNotes((prev) =>
      prev
        .map((n) => (n._id === data._id ? data : n))
        .filter((n) => {
          if (view === "Archived") return n.archived;
          if (view === "Trash") return n.trashed;

          return !n.archived && !n.trashed;
        })
    );

    setSelected(type === "pin" ? data : null);
  }

  async function removeNote() {
    if (!selected) return;

    if (
      String(selected._id).startsWith("demo-") ||
      String(selected._id).startsWith("local-")
    ) {
      setNotes((prev) =>
        prev.filter((n) => n._id !== selected._id)
      );

      setSelected(null);

      setNotice(
        view === "Trash"
          ? "Note deleted permanently."
          : "Note moved to Trash."
      );

      return;
    }

    try {
      const res = await fetch(`${API}/${selected._id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`);
      }

      const data = await res.json();

      setSelected(null);

      await loadNotes();

      setNotice(
        data.deleted
          ? "Note deleted permanently."
          : "Note moved to Trash."
      );
    } catch (error) {
      console.error("❌ Delete note error:", error);
      setNotice("Unable to delete note.");
    }
  }

if (loading) {
  return (
    <div className="auth-loading">
      Loading NoteSpace...
    </div>
  );
}

if (!isAuthenticated) {
  return <AuthScreen />;
}

  const title = view === "All" ? "All notes" : view;

  return (
    <div className="app-shell">

      <aside
        className={`sidebar ${
          mobileNav ? "open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            <BookOpen size={19} />
          </div>

          <span>NoteSpace</span>

          <button
            className="icon-btn mobile-close"
            onClick={() => setMobileNav(false)}
          >
            <X size={18} />
          </button>
        </div>

        <button
          className="new-note"
          onClick={createNote}
        >
          <Plus size={18} />
          New note
          <span>⌘ N</span>
        </button>

        <nav>
          <button
            className={
              view === "All"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setView("All");
              setSelected(null);
            }}
          >
            <FileText size={18} />
            All notes
            <b>{notes.length}</b>
          </button>

            <button
              className={
                view === "Archived"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => {
                setView("Archived");
                setSelected(null);
              }}
            >
              <Archive size={18} />
              Archived
            </button>

            <button
              className={
                view === "Pinned"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() => {
                setView("Pinned");
                setSelected(null);
              }}
            >
              <Pin size={18} />
              Pinned
              <b>{notes.filter((n) => n.pinned && !n.archived && !n.trashed).length}</b>
            </button>


          <button
            className={
              view === "Trash"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => {
              setView("Trash");
              setSelected(null);
            }}
          >
            <Trash2 size={18} />
            Trash
          </button>

          {view === "Trash" && notes.length > 0 && (
            <button
              className="empty-trash-btn"
              title="Permanently delete all notes in Trash"
              onClick={async () => {
                const confirmed = window.confirm(
                  "Empty Trash?\n\nAll notes in Trash will be permanently deleted. This cannot be undone."
                );

                if (!confirmed) return;

                try {
                  const res = await fetch(
                    `${API}/trash/empty`,
                    {
                      method: "DELETE",
                      headers: authHeaders,
                    }
                  );

                  const data = await res.json();

                  if (!res.ok) {
                    throw new Error(
                      data.message || "Failed to empty Trash"
                    );
                  }

                  setNotes([]);
                  setSelected(null);
                  setNotice(
                    `${data.deletedCount || 0} note(s) permanently deleted.`
                  );
                } catch (error) {
                  console.error("❌ Empty Trash error:", error);
                  setNotice("Unable to empty Trash.");
                }
              }}
            >
              <Trash2 size={14} />
              Empty Trash
            </button>
          )}
        </nav>

        <div className="section-label">
  <span>Folders</span>

  <button
    className="tiny-btn"
    title="Create folder"
    onClick={async () => {
      const name = window.prompt("Enter folder name:");

      if (!name || !name.trim()) return;

      try {
const res = await fetch(
  "http://localhost:5000/api/folders",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      name: name.trim(),
    }),
  }
);


        const data = await res.json();

        if (!res.ok) {
          alert(data.message || "Failed to create folder");
          return;
        }

        setFolders((prev) =>
          [...prev, data].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );

        setView(data.name);
        setSelected(null);
      } catch (error) {
        console.error(error);
        alert("Unable to connect to the backend");
      }
    }}
  >
    <Plus size={15} />
  </button>
</div>


<div className="folder-list">
  {folders.map((folder) => (
    <div
      key={folder._id}
      className={
        view === folder.name
          ? "folder-row active"
          : "folder-row"
      }
    >
      <button
        className="folder"
        onClick={() => {
          setView(folder.name);
          setSelected(null);
          setMobileNav(false);
        }}
      >
        <Folder size={16} />

        <span>{folder.name}</span>
      </button>

      <button
        className="folder-action"
        title={`Rename ${folder.name}`}
        onClick={() => renameFolder(folder)}
      >
        <MoreHorizontal size={15} />
      </button>

      <button
        className="folder-delete"
        title={`Delete ${folder.name}`}
        onClick={() => deleteFolder(folder)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  ))}
</div>

        <div className="sidebar-bottom">

          <button
  className={`nav-item ${view === "Settings" ? "active" : ""}`}
  onClick={() => setView("Settings")}
>
  <Settings size={18} />
  Settings
</button>
          <button
            className="nav-item"
            onClick={() => setDark(!dark)}
          >
            {dark ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}

            {dark ? "Light mode" : "Dark mode"}
          </button>

          <div className="profile">
  <button
    className="profile-trigger"
    onClick={() => setProfileMenu((current) => !current)}
    aria-expanded={profileMenu}
    aria-haspopup="menu"
  >
    <div className="avatar">UM</div>

    <div className="profile-info">
      <strong>{user?.name || "Umesh"}</strong>
      <small>Workspace</small>
    </div>

    <MoreHorizontal size={17} />
  </button>

  {profileMenu && (
    <div className="profile-menu">
      <div className="profile-menu-header">
        <strong>{user?.name || "Umesh"}</strong>
        <small>{user?.email || "No email"}</small>
      </div>



      <button
        className="profile-menu-item"
        onClick={() => {
          setProfileMenu(false);
          setView("Settings");
        }}
      >
        <Settings size={16} />
        Settings
      </button>

      <button
        className="profile-menu-item logout"
        onClick={() => {
          setProfileMenu(false);
          logout();
        }}
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )}
</div>



        </div>
      </aside>

      <main className="main">

        <header className="topbar">

          <button
            className="icon-btn mobile-menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronDown size={15} />
            <strong>{title}</strong>
          </div>

          <div className="search">
            <Search size={18} />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search notes..."
            />

            <kbd>⌘ K</kbd>
          </div>

          <button
            className="icon-btn"
            onClick={() => setDark(!dark)}
          >
            {dark ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

        </header>

        {notice && (
          <div className="notice">
            {notice}

            <button
              onClick={() => setNotice("")}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {view === "Settings" ? (
  <SettingsPage
    user={user}
    dark={dark}
    setDark={setDark}
    logout={logout}
  />
) : (
  <div className="workspace">

          <section className="notes-panel">

            <div className="panel-head">

              <div>
                <h1>{title}</h1>
                <p>
                  {notes.length}{" "}
                  {notes.length === 1
                    ? "note"
                    : "notes"}
                </p>
              </div>

                <div className="panel-actions">
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    title="Sort notes"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="az">A–Z</option>
                    <option value="za">Z–A</option>
                  </select>

                  <button
                    className="round-add"
                    onClick={createNote}
                    title="New note (⌘/Ctrl + N)"
                  >
                    <Plus size={19} />
                  </button>
                </div>

            </div>

            <div className="notes-grid">

              {displayedNotes.map((note) => (
                <article
                  key={note._id}
                  className={`note-card ${
                    selected?._id === note._id
                      ? "selected"
                      : ""
                  } card-${
                    note.color || "default"
                  }`}
                  onClick={() =>
                    setSelected(note)
                  }
                >

                  <div className="card-top">

                    <span className="folder-chip">
                      <Folder size={12} />
                      {note.folder}
                    </span>

                    <div className="card-actions">

                      <button
                        type="button"
                        className={note.pinned ? "card-action active" : "card-action"}
                        onClick={(e) => togglePin(note, e)}
                        title={note.pinned ? "Unpin note" : "Pin note"}
                      >
                        <Pin
                          size={14}
                          fill={note.pinned ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        type="button"
                        className="card-action danger"
                        onClick={(e) => moveToTrash(note, e)}
                        title="Move to Trash"
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>

                  </div>

                  <h3>
                    {note.title ||
                      "Untitled note"}
                  </h3>

                  <p>
                    {note.content
                      ? cleanMarkdownPreview(note.content)
                      : "Start writing your thoughts..."}
                  </p>

                  <div className="card-bottom">

                    <div className="tags">
                      {(note.tags || [])
                        .slice(0, 2)
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={
                              selectedTag.toLowerCase() ===
                              tag.toLowerCase()
                                ? "tag-chip active"
                                : "tag-chip"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTag(
                                selectedTag.toLowerCase() ===
                                  tag.toLowerCase()
                                  ? ""
                                  : tag
                              );
                            }}
                          >
                            <Tag size={11} />
                            {tag}
                          </button>
                        ))}
                    </div>

                    <small>
                      {formatDate(
                        note.updatedAt
                      )}
                    </small>

                  </div>

                </article>
              ))}

              {!notes.length && (
                <div className="empty">
                  <FileText size={38} />

                  <h3>No notes here</h3>

                  <p>
                    Create your first note
                    to get started.
                  </p>

                  <button
                    className="new-note inline"
                    onClick={createNote}
                  >
                    <Plus size={17} />
                    New note
                  </button>
                </div>
              )}

            </div>

          </section>

          <section
            className={`editor ${
              selected ? "visible" : ""
            }`}
          >

            {selected ? (
              <>
                <div className="editor-toolbar">

                  <span className="save-status">
  {saving
    ? "Saving..."
    : saveError
      ? "Save failed"
      : "Saved"}
</span>

                  <div className="toolbar-actions">

                    <button
                      className="icon-btn"
                      title="Pin"
                      onClick={() =>
                        action("pin")
                      }
                    >
                      <Pin
                        size={18}
                        fill={
                          selected.pinned
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>

                    {view === "Trash" ? (
                      <button
                        className="icon-btn"
                        title="Restore"
                        onClick={() =>
                          action("restore")
                        }
                      >
                        <RotateCcw size={18} />
                      </button>
                    ) : (
                      <button
                        className="icon-btn"
                        title="Archive"
                        onClick={() =>
                          action("archive")
                        }
                      >
              <Archive size={18} />
                      </button>
                    )}

                    <button
                      className="icon-btn danger"
                      title="Delete"
                      onClick={removeNote}
                    >
                      <Trash2 size={18} />
                    </button>

                    <button
                      className="icon-btn"
                      onClick={() =>
                        setSelected(null)
                      }
                    >
                      <X size={18} />
                    </button>

                  </div>

                </div>

                <input
                  className="editor-title"
                  value={selected.title}
                  onChange={(e) =>
                    updateNote({
                      title: e.target.value
                    })
                  }
                  placeholder="Untitled"
                />


                <div className="editor-meta">

                  <div>
                    <Folder size={15} />

                    <select
  value={selected.folder}
  onChange={(e) =>
    updateNote({
      folder: e.target.value
    })
  }
>
  <option value="Personal">Personal</option>

  {folders.map((folder) => (
    <option
      key={folder._id}
      value={folder.name}
    >
      {folder.name}
    </option>
  ))}
</select>
                  </div>

                  <div>
                    <Tag size={15} />

                    <input
                      value={(
                        selected.tags || []
                      ).join(", ")}
                      onChange={(e) =>
                        updateNote({
                          tags: e.target.value
                            .split(",")
                            .map((x) =>
                              x.trim()
                            )
                            .filter(Boolean)
                        })
                      }
                      placeholder="Add tags"
                    />
                  </div>

                </div>

                                  <div className="format-toolbar">
                    <button type="button" onClick={() => formatText("**", "**")} title="Bold">
                      <strong>B</strong>
                    </button>
                    <button type="button" onClick={() => formatText("*", "*")} title="Italic">
                      <em>I</em>
                    </button>
                    <button type="button" onClick={() => insertMarkdown("# ")} title="Heading">
                      H1
                    </button>
                    <button type="button" onClick={() => insertMarkdown("## ")} title="Subheading">
                      H2
                    </button>
                    <button type="button" onClick={() => insertMarkdown("- ")} title="Bullet list">
                      • List
                    </button>
                    <button type="button" onClick={() => insertMarkdown("- [ ] ")} title="Checklist">
                      ☑ Check
                    </button>
                    <button type="button" onClick={() => formatText("`", "`")} title="Code">
                      Code
                    </button>
                  </div>

                  <div className="editor-mode-switch">
                    <button
                      type="button"
                      className={editorMode === "write" ? "active" : ""}
                      onClick={() => setEditorMode("write")}
                    >
                      ✍️ Write
                    </button>

                    <button
                      type="button"
                      className={editorMode === "preview" ? "active" : ""}
                      onClick={() => setEditorMode("preview")}
                    >
                      👁 Preview
                    </button>
                  </div>

{editorMode === "write" ? (
                    <textarea
                      className="editor-content"
                    onKeyDown={handleEditorShortcuts}
                      value={selected.content}
                      onChange={(e) =>
                        updateNote({
                          content: e.target.value
                        })
                      }
                      placeholder="Start writing..."
                    />
                  ) : (
                    <div className="markdown-preview editor-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selected.content || "*Nothing to preview yet.*"}
                      </ReactMarkdown>
                    </div>
                  )}

                                  <div className="editor-stats">
                    <span>
                      {(selected.content || "").length} characters
                    </span>
                    <span>
                      {(selected.content || "").trim()
                        ? (selected.content || "").trim().split(/\s+/).length
                        : 0} words
                    </span>
                  </div>

<div className="editor-footer">
                  <span>
                    Last edited{" "}
                    {formatDate(
                      selected.updatedAt
                    )}
                  </span>

                  <span>
                    Markdown supported
                  </span>
                </div>
              </>
            ) : (
              <div className="editor-placeholder">

                <div className="placeholder-icon">
                  <FileText size={28} />
                </div>

                <h2>Select a note</h2>

                <p>
                  Choose a note from the list
                  or create a new one.
                </p>

              </div>
            )}

          </section>

          </div>

      )}

    </main>

  </div>
);


}
function SettingsPage({ user, dark, setDark, logout }) {
  return (
    <section className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your NoteSpace preferences.</p>
      </div>

      <div className="settings-card">

        <div className="settings-section">
          <div>
            <h2>Account</h2>
            <p>{user?.email || "No email available"}</p>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <div>
            <h2>Appearance</h2>
            <p>Change the appearance of NoteSpace.</p>
          </div>

          <button
            className={`theme-toggle ${dark ? "active" : ""}`}
            onClick={() => setDark(!dark)}
            aria-pressed={dark}
            aria-label={
              dark
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb" />
            </span>
            <span>{dark ? "Dark mode" : "Light mode"}</span>
          </button>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <div>
            <h2>Profile</h2>
            <p>{user?.name || "Umesh"}</p>
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <div>
            <h2>Session</h2>
            <p>Sign out from this account.</p>
          </div>

          <button
            className="settings-danger"
            onClick={logout}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>

      </div>
    </section>
  );
}

function formatDate(date) {
  if (!date) return "now";

  const d = new Date(date);

  const diff =
    Date.now() - d.getTime();

  if (diff < 60000) return "just now";

  if (diff < 3600000)
    return `${Math.floor(
      diff / 60000
    )}m`;

  if (diff < 86400000)
    return `${Math.floor(
      diff / 3600000
    )}h`;

  return d.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric"
    }
  );
}

export default App;
