import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCOxB2OXsTD5m4KCHbxFNhWIjn_3JiZZHU",
  authDomain: "attendance-82604.firebaseapp.com",
  projectId: "attendance-82604",
  storageBucket: "attendance-82604.firebasestorage.app",
  messagingSenderId: "684977293672",
  appId: "1:684977293672:web:8c57936adc38a48d032edd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("registrationForm");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const submitButton = document.getElementById("submitButton");
const successModal = document.getElementById("successModal");
const closeModal = document.getElementById("closeModal");

/*
  Validation rules:
  - First Name: required, at least 2 characters
  - Last Name: required, at least 2 characters
  - Email: required + realistic email syntax + recognized TLD
  - Phone: required, 7–15 characters, digits/spaces/+/- only
*/

const validTlds = new Set([
  "com", "org", "net", "edu", "gov", "mil", "int",
  "co", "me", "info", "biz", "name", "pro", "mobi",
  "io", "ai", "app", "dev", "tech", "online", "site",
  "store", "shop", "cloud", "xyz", "live", "world",
  "website", "digital", "email", "social", "agency",
  "design", "media", "blog", "news", "solutions",
  "services", "company", "space", "today", "life",
  "academy", "school", "college", "institute",
  "international", "network", "group", "center",
  "support", "systems", "software", "technology",
  "photography", "marketing", "consulting",
  "africa", "ng", "com.ng", "org.ng", "net.ng",
  "edu.ng", "gov.ng", "co.uk", "org.uk", "ac.uk",
  "ca", "us", "uk", "de", "fr", "es", "it", "nl",
  "be", "ch", "at", "se", "no", "dk", "fi", "ie",
  "pt", "pl", "cz", "gr", "ru", "ua", "tr", "za",
  "gh", "ke", "ug", "tz", "rw", "au", "nz", "in",
  "pk", "bd", "my", "sg", "ph", "jp", "kr", "cn",
  "ae", "sa", "qa", "eg", "br", "mx", "ar", "cl",
  "co", "pe"
]);

const validators = {
  firstName(value) {
    const clean = value.trim();
    if (!clean) return "First name is required.";
    if (clean.length < 2) return "First name must be at least 2 characters.";
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(clean)) {
      return "Please enter a valid first name.";
    }
    return "";
  },

  lastName(value) {
    const clean = value.trim();
    if (!clean) return "Last name is required.";
    if (clean.length < 2) return "Last name must be at least 2 characters.";
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(clean)) {
      return "Please enter a valid last name.";
    }
    return "";
  },

  email(value) {
    const clean = value.trim().toLowerCase();
    if (!clean) return "Email address is required.";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,63}$/;
    if (!emailPattern.test(clean)) return "Please enter a valid email address.";

    const parts = clean.split("@");
    const localPart = parts[0];
    const domain = parts[1];

    if (
      localPart.length > 64 ||
      domain.length > 253 ||
      domain.startsWith(".") ||
      domain.endsWith(".") ||
      domain.includes("..")
    ) {
      return "Please enter a valid email address.";
    }

    const tld = domain.split(".").slice(-1)[0];
    if (!validTlds.has(tld)) {
      return `".${tld}" is not a recognized email domain ending.`;
    }

    return "";
  },

  phone(value) {
    const clean = value.trim();
    if (!clean) return "Phone number is required.";
    const phonePattern = /^[0-9+\- ]{7,15}$/;
    if (!phonePattern.test(clean)) {
      return "Phone must be 7–15 characters using digits, spaces, + or - only.";
    }
    return "";
  }
};

const fields = [firstName, lastName, email, phone];

function validateField(field) {
  const message = validators[field.name](field.value);
  const error = document.getElementById(field.id + "Error");

  field.classList.toggle("invalid", Boolean(message));
  field.setAttribute("aria-invalid", Boolean(message));
  error.textContent = message;

  return !message;
}

fields.forEach(field => {
  field.addEventListener("input", () => validateField(field));
  field.addEventListener("blur", () => validateField(field));
});

// SUBMISSION LOGIC
async function fakeSubmitToServer(data) {
  // 1. Generate a random 4-digit code (e.g., AH-4921)
  const accessCode = "AH-" + Math.floor(1000 + Math.random() * 9000);

  // 2. Save the user to Firebase
  await addDoc(collection(db, "registrations"), {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    accessCode: accessCode,
    attended: false 
  });

  // 3. Send the Email using EmailJS
  emailjs.init("WAvdlzhoxY5tBBkh_");

  const emailParams = {
    to_name: data.firstName,
    to_email: data.email,
    email: data.email,
    access_code: accessCode
  };

  await emailjs.send(
    "service_gwortlm",
    "template_7i2wz27",
    emailParams
  );
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const results = fields.map(validateField);

  if (results.includes(false)) {
    fields.find(field => field.classList.contains("invalid"))?.focus();
    return;
  }

  const data = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim()
  };

  submitButton.disabled = true;
  submitButton.textContent = "Registering...";

  try {
    await fakeSubmitToServer(data);

    form.reset();
    fields.forEach(field => {
      field.classList.remove("invalid");
      field.removeAttribute("aria-invalid");
      document.getElementById(field.id + "Error").textContent = "";
    });

    successModal.classList.add("show");
    closeModal.focus();

  } catch (error) {
    console.error("Registration failed:", error);
    alert("Oops! Something went wrong while registering. Please try again. 😥");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Register <span aria-hidden="true">→</span>';
  }
});

function hideModal() {
  successModal.classList.remove("show");
}

closeModal.addEventListener("click", hideModal);

successModal.addEventListener("click", event => {
  if (event.target === successModal) hideModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && successModal.classList.contains("show")) {
    hideModal();
  }
});