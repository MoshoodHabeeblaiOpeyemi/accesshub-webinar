import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const form = document.getElementById("attendanceForm");
const checkInBtn = document.getElementById("checkInBtn");
const attendeeList = document.getElementById("attendeeList");

// NEW: Track current user session for log out
let currentUserDocId = null;
const logoutBtn = document.getElementById("logoutBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("attendeeEmail").value.trim().toLowerCase();
  const code = document.getElementById("accessCode").value.trim();

  checkInBtn.textContent = "Verifying... ⏳";
  checkInBtn.disabled = true;

  try {
    const q = query(collection(db, "registrations"), where("email", "==", email), where("accessCode", "==", code));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      currentUserDocId = userDoc.id; // 👈 Save user's Firestore doc ID
      
      // Mark as attended in database! ✅
      await updateDoc(doc(db, "registrations", userDoc.id), { attended: true });

      // Hide login, reveal dashboard! 🎭
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
      document.querySelector(".hero p").textContent = "You are successfully checked in!";
      
      checkInBtn.textContent = "Join Webinar →";
      checkInBtn.disabled = false;

      loadLiveAttendees();
    } else {
      alert("❌ Invalid Email or Access Code. Please try again!");
      checkInBtn.textContent = "Join Webinar →";
      checkInBtn.disabled = false;
    }
  } catch (error) {
    console.error("Error logging in:", error);
    alert("⚠️ Connection error. Please try again.");
    checkInBtn.disabled = false;
  }
});

// Watch the database for anyone who has 'attended: true' 👀
function loadLiveAttendees() {
  const q = query(collection(db, "registrations"), where("attended", "==", true));
  onSnapshot(q, (snapshot) => {
    attendeeList.innerHTML = ""; 
    snapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = `${data.firstName} ${data.lastName}`;
      attendeeList.appendChild(li);
    });
  });
}

// LOG OUT / LEAVE WEBINAR LOGIC 🚪
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (currentUserDocId) {
      try {
        logoutBtn.textContent = "Leaving... ⏳";
        logoutBtn.disabled = true;

        // Flip 'attended' back to false in Firebase! 🔄
        await updateDoc(doc(db, "registrations", currentUserDocId), { attended: false });

        // Reset UI back to login screen
        dashboardSection.style.display = "none";
        loginSection.style.display = "block";
        document.getElementById("attendanceForm").reset();
        document.querySelector(".hero p").textContent = "Enter your email and access code to join.";
        
        logoutBtn.textContent = "Leave Webinar 🚪";
        logoutBtn.disabled = false;
        currentUserDocId = null;
      } catch (error) {
        console.error("Error logging out:", error);
        alert("⚠️ Error leaving webinar. Please try again.");
        logoutBtn.disabled = false;
      }
    } else {
      location.reload();
    }
  });
}