
// Global data object that will act as our database
let appData = {
    users: [],
    currentUser: null
};

// Helper functions
function showMessage(elementId, text, type) {
    const messageElement = document.getElementById(elementId);
    if (!messageElement) return;
    
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    
    // Clear message after 3 seconds
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 3000);
}

function getUserFromData() {
    return appData.currentUser;
}

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (response.ok) {
            appData = await response.json();
            console.log("Data loaded successfully:", appData);
        } else {
            console.error("Failed to load data:", response.statusText);
        }
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', async () => {
    // Load data first
    await loadData();
    
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('nav');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }
    
    // Check if user is logged in and redirect accordingly
    const currentPath = window.location.pathname;
    const isLoggedIn = appData.currentUser;
    
    // List of protected pages that require login
    const protectedPages = ['/dashboard.html'];
    
    // List of pages only accessible when NOT logged in
    const guestOnlyPages = ['/login.html', '/register.html'];
    
    // Check if current page is protected and user is not logged in
    if (protectedPages.some(page => currentPath.endsWith(page)) && !isLoggedIn) {
        window.location.href = '/login.html';
    }
    
    // Check if current page is guest-only and user is logged in
    if (guestOnlyPages.some(page => currentPath.endsWith(page)) && isLoggedIn) {
        window.location.href = '/dashboard.html';
    }
    
    // Handle user registration
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Simple validation
            if (password !== confirmPassword) {
                showMessage('message', 'Passwords do not match!', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('message', 'Password must be at least 6 characters!', 'error');
                return;
            }
            
            // Check if user already exists
            if (appData.users.some(user => user.email === email)) {
                showMessage('message', 'Email already registered!', 'error');
                return;
            }
            
            // Create new user
            const newUser = {
                id: Date.now().toString(),
                fullName,
                email,
                password,
                meetings: []
            };
            
            appData.users.push(newUser);
            
            // In a real app, we would save data to server here
            console.log("User registered:", newUser);
            console.log("Updated data:", appData);
            
            showMessage('message', 'Registration successful! Redirecting to login...', 'success');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        });
    }
    
    // Handle user login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Find user
            const user = appData.users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Store current user info (without password)
                const userInfo = {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email
                };
                appData.currentUser = userInfo;
                
                // In a real app, we would save session to server here
                console.log("User logged in:", userInfo);
                
                showMessage('loginMessage', 'Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                showMessage('loginMessage', 'Invalid email or password!', 'error');
            }
        });
    }
    
    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appData.currentUser = null;
            
            // In a real app, we would clear session on server here
            console.log("User logged out");
            
            window.location.href = '/index.html';
        });
    }
    
    // Dashboard functionality
    if (currentPath.endsWith('/dashboard.html')) {
        const currentUser = getUserFromData();
        
        // Display user name
        const userNameElement = document.getElementById('userName');
        if (userNameElement && currentUser) {
            userNameElement.textContent = currentUser.fullName;
        }
        
        // Handle meeting scheduling
        const schedulingForm = document.getElementById('schedulingForm');
        if (schedulingForm) {
            schedulingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const title = document.getElementById('meetingTitle').value;
                const date = document.getElementById('meetingDate').value;
                const time = document.getElementById('meetingTime').value;
                const description = document.getElementById('meetingDescription').value;
                
                if (!currentUser) {
                    showMessage('scheduleMessage', 'You must be logged in to schedule meetings!', 'error');
                    return;
                }
                
                // Create new meeting
                const newMeeting = {
                    id: Date.now().toString(),
                    title,
                    date,
                    time,
                    description
                };
                
                // Add meeting to user's meetings
                const userIndex = appData.users.findIndex(u => u.id === currentUser.id);
                
                if (userIndex !== -1) {
                    if (!appData.users[userIndex].meetings) {
                        appData.users[userIndex].meetings = [];
                    }
                    appData.users[userIndex].meetings.push(newMeeting);
                    
                    // In a real app, we would save data to server here
                    console.log("Meeting scheduled:", newMeeting);
                    console.log("Updated user data:", appData.users[userIndex]);
                    
                    showMessage('scheduleMessage', 'Meeting scheduled successfully!', 'success');
                    
                    // Reset form
                    schedulingForm.reset();
                    
                    // Update meetings list
                    displayMeetings();
                } else {
                    showMessage('scheduleMessage', 'Error scheduling meeting!', 'error');
                }
            });
        }
        
        // Display user's meetings
        function displayMeetings() {
            const meetingsList = document.getElementById('meetingsList');
            const noMeetings = document.getElementById('noMeetings');
            
            if (!meetingsList) return;
            
            // Get updated user data
            const currentUser = getUserFromData();
            
            if (!currentUser) return;
            
            const userIndex = appData.users.findIndex(u => u.id === currentUser.id);
            if (userIndex === -1) return;
            
            const meetings = appData.users[userIndex].meetings || [];
            
            // Clear existing content except for the noMeetings message
            const children = Array.from(meetingsList.children);
            children.forEach(child => {
                if (child.id !== 'noMeetings') {
                    meetingsList.removeChild(child);
                }
            });
            
            if (meetings.length === 0) {
                if (noMeetings) noMeetings.style.display = 'block';
                return;
            }
            
            if (noMeetings) noMeetings.style.display = 'none';
            
            // Sort meetings by date and time
            meetings.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            });
            
            // Add each meeting to the list
            meetings.forEach(meeting => {
                const meetingItem = document.createElement('div');
                meetingItem.className = 'meeting-item';
                meetingItem.dataset.id = meeting.id;
                
                // Format the date
                const formattedDate = new Date(meeting.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                meetingItem.innerHTML = `
                    <h3>${meeting.title}</h3>
                    <div class="meeting-date">📅 ${formattedDate}</div>
                    <div class="meeting-time">⏰ ${meeting.time}</div>
                    ${meeting.description ? `<div class="meeting-description">${meeting.description}</div>` : ''}
                    <button class="delete-btn">Delete Meeting</button>
                `;
                
                meetingsList.appendChild(meetingItem);
                
                // Add delete functionality
                const deleteBtn = meetingItem.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => {
                    deleteMeeting(meeting.id);
                });
            });
        }
        
        // Delete meeting function
        function deleteMeeting(meetingId) {
            const currentUser = getUserFromData();
            
            if (!currentUser) return;
            
            const userIndex = appData.users.findIndex(u => u.id === currentUser.id);
            if (userIndex === -1) return;
            
            // Filter out the deleted meeting
            appData.users[userIndex].meetings = appData.users[userIndex].meetings.filter(m => m.id !== meetingId);
            
            // In a real app, we would save data to server here
            console.log("Meeting deleted:", meetingId);
            console.log("Updated user data:", appData.users[userIndex]);
            
            // Update the display
            displayMeetings();
            
            showMessage('scheduleMessage', 'Meeting deleted successfully!', 'success');
        }
        
        // Initialize meetings display
        displayMeetings();
    }
});
