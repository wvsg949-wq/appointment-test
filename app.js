const config = window.SUPABASE_CONFIG || {};

const hasConfig =
  config.url &&
  config.anonKey &&
  !config.url.includes("PASTE_YOUR") &&
  !config.anonKey.includes("PASTE_YOUR");

const db = hasConfig
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;

function showMessage(elementId, text, type) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.className = type || "info";
  element.textContent = text;
}

function clearMessage(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.className = "";
  element.textContent = "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

/* Public appointment form */
const appointmentForm = document.getElementById("appointmentForm");

if (appointmentForm) {
  if (!hasConfig) {
    showMessage(
      "message",
      "Please add your Supabase URL and anon key in config.js first.",
      "error"
    );
  }

  appointmentForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!db) {
      showMessage("message", "Supabase is not configured.", "error");
      return;
    }

    const website = document.getElementById("website").value.trim();
    const name = document.getElementById("name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const submitBtn = document.getElementById("submitBtn");

    if (website) {
      showMessage("message", "Thank you! We received your request.", "success");
      return;
    }

    if (name.length < 2) {
      showMessage("message", "Please enter a valid name.", "error");
      return;
    }

    if (mobile.length < 7) {
      showMessage("message", "Please enter a valid mobile number.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    clearMessage("message");

    const { error } = await db
      .from("appointment_requests")
      .insert([{ name, mobile }]);

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Request";

    if (error) {
  console.error(error);
  showMessage("message", error.message, "error");
  return;
}

    appointmentForm.reset();
    showMessage(
      "message",
      "Thank you! We received your request. Our team will call you soon.",
      "success"
    );
  });
}

/* Admin panel */
const loginForm = document.getElementById("loginForm");
const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const requestsTable = document.getElementById("requestsTable");
const searchInput = document.getElementById("searchInput");

let allRequests = [];

if (loginForm) {
  if (!hasConfig) {
    showMessage(
      "loginMessage",
      "Please add your Supabase URL and anon key in config.js first.",
      "error"
    );
  } else {
    checkSession();
  }

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    clearMessage("loginMessage");

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
      showMessage("loginMessage", "Invalid email or password.", "error");
      return;
    }

    const isAdmin = await verifyAdmin();

    loginBtn.disabled = false;
    loginBtn.textContent = "Login";

    if (!isAdmin) {
      await db.auth.signOut();
      showMessage("loginMessage", "This user is not an admin.", "error");
      return;
    }

    showDashboard();
    loadRequests();
  });
}

async function checkSession() {
  const { data } = await db.auth.getSession();

  if (!data.session) {
    showLogin();
    return;
  }

  const isAdmin = await verifyAdmin();

  if (!isAdmin) {
    await db.auth.signOut();
    showLogin();
    return;
  }

  showDashboard();
  loadRequests();
}

async function verifyAdmin() {
  const { data, error } = await db
    .from("admins")
    .select("user_id")
    .single();

  return !error && !!data;
}

function showLogin() {
  if (!loginBox || !dashboard) return;
  loginBox.classList.remove("hidden");
  dashboard.classList.add("hidden");
}

function showDashboard() {
  if (!loginBox || !dashboard) return;
  loginBox.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

async function loadRequests() {
  if (!db || !requestsTable) return;

  showMessage("adminMessage", "Loading requests...", "info");

  const { data, error } = await db
    .from("appointment_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showMessage("adminMessage", "Could not load requests.", "error");
    return;
  }

  allRequests = data || [];
  clearMessage("adminMessage");
  renderRequests();
}

function renderRequests() {
  if (!requestsTable) return;

  const query = (searchInput?.value || "").trim().toLowerCase();

  const filtered = allRequests.filter((item) => {
    return (
      String(item.name || "").toLowerCase().includes(query) ||
      String(item.mobile || "").toLowerCase().includes(query) ||
      String(item.status || "").toLowerCase().includes(query)
    );
  });

  document.getElementById("totalCount").textContent = allRequests.length;
  document.getElementById("newCount").textContent =
    allRequests.filter((item) => item.status === "New").length;
  document.getElementById("confirmedCount").textContent =
    allRequests.filter((item) => item.status === "Confirmed").length;

  if (filtered.length === 0) {
    requestsTable.innerHTML = `
      <tr>
        <td colspan="6">No appointment requests found.</td>
      </tr>
    `;
    return;
  }

  requestsTable.innerHTML = filtered
    .map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.mobile)}</td>
          <td>${formatDate(item.created_at)}</td>
          <td>
            <select onchange="updateStatus('${item.id}', this.value)">
              <option value="New" ${item.status === "New" ? "selected" : ""}>New</option>
              <option value="Called" ${item.status === "Called" ? "selected" : ""}>Called</option>
              <option value="Confirmed" ${item.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
              <option value="Cancelled" ${item.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </td>
          <td>
            <textarea placeholder="Add notes" onblur="updateNotes('${item.id}', this.value)">${escapeHtml(item.notes || "")}</textarea>
          </td>
          <td>
            <button class="small-btn danger" onclick="deleteRequest('${item.id}')">Delete</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

window.updateStatus = async function (id, status) {
  const { error } = await db
    .from("appointment_requests")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage("adminMessage", "Could not update status.", "error");
    return;
  }

  allRequests = allRequests.map((item) =>
    item.id === id ? { ...item, status } : item
  );

  renderRequests();
};

window.updateNotes = async function (id, notes) {
  const { error } = await db
    .from("appointment_requests")
    .update({ notes })
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage("adminMessage", "Could not update notes.", "error");
    return;
  }

  allRequests = allRequests.map((item) =>
    item.id === id ? { ...item, notes } : item
  );
};

window.deleteRequest = async function (id) {
  if (!confirm("Delete this request?")) return;

  const { error } = await db
    .from("appointment_requests")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    showMessage("adminMessage", "Could not delete request.", "error");
    return;
  }

  allRequests = allRequests.filter((item) => item.id !== id);
  renderRequests();
};

const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", loadRequests);
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    await db.auth.signOut();
    showLogin();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", renderRequests);
}
