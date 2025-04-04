document.addEventListener("DOMContentLoaded", function () {
  // ========= References =========
  const uploadArea = document.getElementById("upload-area");
  const imageInput = document.getElementById("imageInput");
  const processBtn = document.getElementById("processBtn");
  const messageEl = document.getElementById("message");
  const previewContainer = document.getElementById("preview-container");
  const previewImage = document.getElementById("preview-image");
  const filenameEl = document.getElementById("filename");

  // Sidebar
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const closeSidebarBtn = document.getElementById("closeSidebar");
  const overlay = document.getElementById("overlay");

  // ========= Sidebar Functions =========
  function openSidebar() {
    // Show sidebar
    if (window.innerWidth <= 768) {
      // For smaller screens
      sidebar.style.left = "0";
    } else {
      // For larger screens
      sidebar.style.left = "0";
    }
    overlay.style.display = "block"; // Show overlay
  }

  function closeSidebar() {
    if (window.innerWidth <= 768) {
      sidebar.style.left = "-70%";
    } else {
      sidebar.style.left = "-250px";
    }
    overlay.style.display = "none"; // Hide overlay
  }

  // ========= Event Listeners for Sidebar =========
  sidebarToggle.addEventListener("click", openSidebar);
  closeSidebarBtn.addEventListener("click", closeSidebar);

  // Click on overlay also closes sidebar
  overlay.addEventListener("click", closeSidebar);

  // Handle resizing to reset sidebar if window gets larger
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      // If user resizes to desktop, hide sidebar properly
      sidebar.style.left = "-250px";
      overlay.style.display = "none";
    }
  });

  // ========= File Upload / Drag-Drop =========
  // Click on upload area -> open file dialog
  uploadArea.addEventListener("click", function () {
    imageInput.click();
  });

  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight on dragover
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(
      eventName,
      () => {
        uploadArea.classList.add("dragover");
      },
      false
    );
  });

  // Unhighlight on dragleave/drop
  ["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(
      eventName,
      () => {
        uploadArea.classList.remove("dragover");
      },
      false
    );
  });

  // Handle drop
  uploadArea.addEventListener("drop", function (e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  // Handle file input
  imageInput.addEventListener("change", function () {
    handleFiles(this.files);
  });

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        showPreview(file);
        processBtn.disabled = false;
        messageEl.textContent = "";
      } else {
        messageEl.textContent = "Please select an image file";
      }
    }
  }

  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // Show the <img> in the preview container
      previewImage.src = e.target.result;
      previewContainer.classList.remove("hidden");

      // Add the has-image class to hide icon/text
      uploadArea.classList.add("has-image");

      // Show filename
      filenameEl.textContent = file.name;
      processBtn.disabled = false;
      messageEl.textContent = "";
    };
    reader.readAsDataURL(file);
  }

  // ========= Process button click =========
  processBtn.addEventListener("click", uploadImage);
});

async function uploadImage() {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];
  const filter = document.getElementById("filter").value;
  const processBtn = document.getElementById("processBtn");
  const messageEl = document.getElementById("message");

  if (!file) {
    messageEl.textContent = "Please select an image first";
    return;
  }

  // Indicate processing
  processBtn.disabled = true;
  messageEl.textContent = "Processing...";

  try {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("filter", filter);

    const response = await fetch("/process", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Processing failed");
    }

    // Get the processed image blob
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "processed_image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    messageEl.textContent = "Download started!";
  } catch (error) {
    console.error("Error:", error);
    messageEl.textContent = error.message;
  } finally {
    processBtn.disabled = false;
  }
}
