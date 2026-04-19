function attachGroupsPanelLogic(){
  document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ groups.js initialized");

  const groupList = document.getElementById("group-list");
  const featureList = document.getElementById("feature-list");
  const mainPanel = document.getElementById("main-panel");
  let activeGroupId = null;

  // ---- Helper to safely fetch JSON ----
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // ======================================
  // 1️⃣ GROUP CLICK → Load Features
  // ======================================
  document.addEventListener("click", async (e) => {
    const groupItem = e.target.closest(".group-item");
    if (!groupItem || !groupList.contains(groupItem)) return;

    // highlight active group
    document.querySelectorAll(".group-item").forEach(g => g.classList.remove("active"));
    groupItem.classList.add("active");

    activeGroupId = groupItem.dataset.groupId;
    console.log("📂 Selected Group ID:", activeGroupId);

    try {
      const data = await fetchJSON(`/groups/${activeGroupId}/section-buttons/`);
      renderFeatures(data.features || []);
    } catch (err) {
      console.error("❌ Error loading features:", err);
    }
  });

  // ======================================
  // 2️⃣ Render Feature Buttons
  // ======================================
  function renderFeatures(features) {
    featureList.innerHTML = "";
    if (!features.length) {
      featureList.innerHTML = "<li class='empty'>No features yet</li>";
      return;
    }

    features.forEach(f => {
      const li = document.createElement("li");
      li.className = "feature-item";
      li.dataset.feature = f.name;
      li.textContent = f.display_name;
      featureList.appendChild(li);
    });
  }

  // ======================================
  // 3️⃣ FEATURE CLICK → Load Panel
  // ======================================
  document.addEventListener("click", async (e) => {
    const featureItem = e.target.closest(".feature-item");
    if (!featureItem || !featureList.contains(featureItem)) return;
    if (!activeGroupId) return;

    const feature = featureItem.dataset.feature;
    console.log("🧩 Loading feature:", feature);

    try {
      const res = await fetch(`/groups/${activeGroupId}/load-subsection/${feature}/`);
      mainPanel.innerHTML = await res.text();
    } catch (err) {
      console.error("❌ Error loading feature panel:", err);
    }
  });

  // ======================================
  // 4️⃣ CREATE GROUP BUTTON
  // ======================================
  document.addEventListener("click", async (e) => {
    if (e.target.id === "create-group-btn") {
      e.preventDefault();
      const modal = document.getElementById("create-group-modal");
      if (!modal) return alert("Modal not found!");

      modal.classList.add("visible");
      console.log("🟢 Opened create group modal");
    }
  });

  // ======================================
  // 5️⃣ CREATE GROUP FORM SUBMIT
  // ======================================
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "create-group-form") return;
    e.preventDefault();

    const form = e.target;
    const csrf = form.querySelector("[name=csrfmiddlewaretoken]").value;
    const groupName = form.querySelector("[name=group_name]").value.trim();

    if (!groupName) return alert("Please enter a group name");

    try {
      const res = await fetch("/groups/create/submit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrf
        },
        body: JSON.stringify({ name: groupName, features: [] })
      });

      const data = await res.json();
      if (data.success && data.group_html) {
        document.getElementById("group-list")
          .insertAdjacentHTML("beforeend", data.group_html);
        modal.classList.remove("visible");
        alert("✅ Group created!");
      } else {
        alert("❌ Failed: " + (data.error || "unknown error"));
      }
    } catch (err) {
      console.error("❌ Error creating group:", err);
      alert("Something went wrong creating the group");
    }
  });

  // ======================================
  // 6️⃣ ADD FEATURE BUTTON
  // ======================================
  document.addEventListener("click", (e) => {
    if (e.target.id === "add-feature-btn") {
      e.preventDefault();
      if (!activeGroupId) return alert("Select a group first!");
      const modal = document.getElementById("add-feature-modal");
      if (modal) modal.classList.add("visible");
    }
  });
});
}