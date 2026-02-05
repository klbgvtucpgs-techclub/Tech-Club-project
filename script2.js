
     
document.addEventListener("DOMContentLoaded", function () {

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", submitForm);
  } else {
    console.error("Submit button not found");
  }

});

// New submit function with file checks
function submitForm() {
   // alert("submit function called");

  const photo = document.getElementById("photo");
  const certificate = document.getElementById("certificate");

  let photoSelected = false;
  let certificateSelected = false;

  if (photo && photo.files.length >0 ) {
    photoSelected=true;
  }



  if (photo.files.length === 0) {
   // alert("Please upload faculty photo.");
    
  }

  if (certificate && certificate.files.length > 0) {
    certificateSelected=true;
  }

  const data = {
    name: document.getElementById("name").value.trim() || "",
    gender: document.getElementById("gender").value || "",
    designation: document.getElementById("designation").value || "",
    department: document.getElementById("department").value || "",
    employeeId: document.getElementById("empid").value.trim() || "",
    submittedAt: new Date().toLocaleString(),photoprovided: photoSelected,
    certificateprovided: certificateSelected
  };

  
  localStorage.setItem("facultySubmission", JSON.stringify(data));

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "faculty_submission.json";
  link.click();

  alert("✅ Submitted successfully!");
  document.getElementById("submitBtn").disabled = true;
}



let isPreview = false;

function togglePreview() {
    isPreview = !isPreview;
    document.body.classList.toggle("preview");

    /* ---------- INPUTS & TEXTAREAS ---------- */
    document.querySelectorAll("input, textarea").forEach(el => {
        if (el.type !== "file") {
            el.readOnly = isPreview;
        }
        if (el.type === "file") {
            el.style.display = isPreview ? "none" : "block";
        }
    });

    /* ---------- SELECT → TEXT IN PREVIEW ---------- */
    document.querySelectorAll("select").forEach(select => {
        if (isPreview) {
            const span = document.createElement("span");
            span.className = "select-preview";
            span.innerText = select.value || "";
            select.after(span);
            select.style.display = "none";
        } else {
            select.style.display = "block";
            const span = select.nextSibling;
            if (span && span.className === "select-preview") {
                span.remove();
            }
        }
    });

    /* ---------- PHOTO PREVIEW ---------- */
    const photoInput = document.getElementById("photo");
    const photoPreview = document.getElementById("photoPreview");

    if (isPreview && photoInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = () => photoPreview.src = reader.result;
        reader.readAsDataURL(photoInput.files[0]);
    }

    if (!isPreview) {
        photoPreview.src = "";
    }
}
function downloadJSON() {
  const data = {
    name: document.getElementById("name").value,
    Gender: document.getElementById("gender").value,
    Qualification:document.getAnimations("qualification"),
    Designation: document.getElementById("designation").value,
    Department: document.getElementById("department").value,
    employeeId: document.getElementById("empid").value,
    FacultyId:ducumnet.getElementById("facid").value
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "faculty_cv.json";
  link.click();
}
