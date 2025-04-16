const express = require("express");
const mssql = require("mssql");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const path = require("path"); // Required for serving static files
const cookieParser = require("cookie-parser");

const app = express();
const port = 3000;

// Body parser middleware
app.use(bodyParser.json());

// Cookie parser middleware
app.use(cookieParser());

// Serve static files from the current directory (without a public folder)
app.use(express.static(path.join(__dirname)));

// SQL Server connection configuration using Windows Authentication
const dbConfig = {
    server: 'localhost\\SQLEXPRESS', // Use your server name here
    database: 'BloodScriptDB',
    user: 'bloodadmin', // Use your SQL Server username here
    password: 'bloodadmin123', // Use your SQL Server password heres
    options: {
        encrypt: true, // Use encryption
        trustServerCertificate: true, // Trust the server certificate
    },
};

// Establish connection to the database
mssql.connect(dbConfig, (err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to the database");
    }
});

// Handle GET request to the root URL ("/") to serve the index.html file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // Serve index.html from the root directory
});

// Sign Up Route
app.post("/api/donor/signup", async (req, res) => {
    const {
        firstName, lastName, mobile, email, gender, dob,
        address, county, eircode, age, bloodGroup,
        username, password
    } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const request = new mssql.Request();
        request.input("firstName", mssql.NVarChar, firstName);
        request.input("lastName", mssql.NVarChar, lastName);
        request.input("mobile", mssql.NVarChar, mobile);
        request.input("email", mssql.NVarChar, email);
        request.input("gender", mssql.NVarChar, gender);
        request.input("dob", mssql.Date, dob);
        request.input("address", mssql.NVarChar, address);
        request.input("county", mssql.NVarChar, county);
        request.input("eircode", mssql.NVarChar, eircode);
        request.input("age", mssql.Int, age);
        request.input("bloodGroup", mssql.NVarChar, bloodGroup);
        request.input("username", mssql.NVarChar, username);
        request.input("passwordHash", mssql.NVarChar, hashedPassword);

        await request.query(`
            INSERT INTO Donors (
                first_name, last_name, mobile, email, gender, dob,
                address, county, eircode, age, blood_group,
                username, password_hash
            ) VALUES (
                @firstName, @lastName, @mobile, @email, @gender, @dob,
                @address, @county, @eircode, @age, @bloodGroup,
                @username, @passwordHash
            )
        `);

        res.status(201).json({ message: "Signup successful!" });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Signup failed. Username may already exist." });
    }
});

// Login Route
app.post("/api/donor/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const request = new mssql.Request();
        request.input("username", mssql.NVarChar, username);

        const result = await request.query(`
            SELECT * FROM Donors WHERE username = @username
        `);

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: "Invalid username or password." });
        }

        const donor = result.recordset[0];
        const isPasswordValid = await bcrypt.compare(password, donor.password_hash);

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username or password." });
        }

        // Update last_login timestamp
        const updateLogin = new mssql.Request();
        updateLogin.input("id", mssql.Int, donor.id);
        await updateLogin.query(`UPDATE Donors SET last_login = GETDATE() WHERE id = @id`);

        // Set cookie
        res.cookie("donorId", donor.id, {
            httpOnly: true,
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.status(200).json({ message: "Login successful!" });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Login failed." });
    }
});

// Donor Password Reset Route
app.post("/api/donor/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;
  
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required." });
    }
  
    try {
      const normalizedEmail = email.trim().toLowerCase();
      console.log("Reset attempt for email:", normalizedEmail);
  
      // YOU MISSED HASHING THE NEW PASSWORD HERE
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      const request = new mssql.Request();
      request.input("email", mssql.NVarChar, normalizedEmail);
      request.input("password_hash", mssql.NVarChar, hashedPassword); // USE HASHED PASSWORD
  
      const result = await request.query(`
        UPDATE Donors
        SET password_hash = @password_hash
        WHERE LOWER(email) = @email
      `);
  
      console.log("Rows affected:", result.rowsAffected[0]);
  
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ message: "No user found with this email." });
      }
  
      res.status(200).json({ message: "Password has been reset successfully!" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Server error. Please try again later." });
    }
  });        


// Blood Availability Search Endpoint
app.post("/api/blood/search", async (req, res) => {
    const { county, bloodType, component } = req.body;
  
    try {
      const request = new mssql.Request();
  
      request.input("county", mssql.NVarChar, county);
      request.input("bloodType", mssql.NVarChar, bloodType);
      request.input("component", mssql.NVarChar, component);
  
      const result = await request.query(`
        SELECT hospital, county, bloodType, component, units
        FROM blood_availability 
        WHERE county = @county AND bloodType = @bloodType AND component = @component
      `);
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching blood availability:", err);
      res.status(500).json({ message: "Failed to fetch blood availability" });
    }
  });

  // Blood Request Submission Endpoint
  app.post("/api/blood-request", async (req, res) => {
    const {
      full_name,
      mobile,
      email,
      blood_group,
      component,
      county,
      hospital,
      required_date,
      units,
      reason
    } = req.body;
  
    // Basic Validation
    if (
      !full_name || !mobile || !email || !blood_group || !component ||
      !county || !hospital || !required_date || !units
    ) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }
  
    try {
      const request = new mssql.Request();
      request.input("full_name", mssql.NVarChar, full_name);
      request.input("mobile", mssql.NVarChar, mobile);
      request.input("email", mssql.NVarChar, email);
      request.input("blood_group", mssql.NVarChar, blood_group);
      request.input("component", mssql.NVarChar, component);
      request.input("county", mssql.NVarChar, county);
      request.input("hospital", mssql.NVarChar, hospital);
      request.input("required_date", mssql.Date, required_date);
      request.input("units", mssql.Int, units);
      request.input("reason", mssql.NVarChar, reason || "");
  
      await request.query(`
        INSERT INTO BloodRequests (
          full_name, mobile, email, blood_group, component, county,
          hospital, required_date, units, reason
        ) VALUES (
          @full_name, @mobile, @email, @blood_group, @component, @county,
          @hospital, @required_date, @units, @reason
        )
      `);
  
      res.status(200).json({ message: "Blood request submitted successfully!" });
  
    } catch (err) {
      console.error("Error submitting request:", err);
      res.status(500).json({ message: "Failed to submit request" });
    }
  });  
  
  
// Fetch camps by county for blooddonationcamp.html
app.get("/api/camps", async (req, res) => {
    const { county } = req.query;

    if (!county) {
        return res.status(400).json({ message: "County is required" });
    }

    try {
        const request = new mssql.Request();
        request.input("county", mssql.NVarChar, county);

        const result = await request.query(`
            SELECT 
                camp_name, org_name, camp_address, county, 
                camp_date, start_time, end_time, organizer_mobile
            FROM VoluntaryCamps
            WHERE county = @county
            ORDER BY camp_date ASC
        `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching camps by county:", err);
        res.status(500).json({ message: "Failed to fetch camps" });
    }
});


// Get Donor Profile
app.get("/api/donor/profile", async (req, res) => {
    const donorId = req.cookies.donorId;
    if (!donorId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const request = new mssql.Request();
        request.input("id", mssql.Int, donorId);
        const result = await request.query(`
            SELECT 
                id,
                first_name, 
                last_name, 
                email, 
                blood_group, 
                mobile AS phone, 
                gender, 
                dob,
                total_donations,
                last_login
            FROM Donors
            WHERE id = @id
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Donor not found" });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({ message: "Failed to load profile" });
    }
});

// Get Donor Certificates
app.get("/api/donor/certificates", async (req, res) => {
    const donorId = req.cookies.donorId;
    if (!donorId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const request = new mssql.Request();
        request.input("donorId", mssql.Int, donorId);
        const result = await request.query(`
            SELECT date, location, status, component
            FROM DonationCertificates
            WHERE donor_id = @donorId
            ORDER BY date DESC
        `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching certificates:", err);
        res.status(500).json({ message: "Failed to load certificates" });
    }
});


// Update Donor Profile
app.put("/api/donor/update-profile", async (req, res) => {
    const {
        id, firstName, lastName, email,
        bloodGroup, phone, gender, dob
    } = req.body;

    try {
        const request = new mssql.Request();
        request.input("id", mssql.Int, id);
        request.input("firstName", mssql.NVarChar, firstName);
        request.input("lastName", mssql.NVarChar, lastName);
        request.input("email", mssql.NVarChar, email);
        request.input("bloodGroup", mssql.NVarChar, bloodGroup);
        request.input("phone", mssql.NVarChar, phone);
        request.input("gender", mssql.NVarChar, gender);
        request.input("dob", mssql.Date, dob);

        await request.query(`
            UPDATE Donors
            SET 
                first_name = @firstName,
                last_name = @lastName,
                email = @email,
                blood_group = @bloodGroup,
                mobile = @phone,
                gender = @gender,
                dob = @dob
            WHERE id = @id
        `);

        res.status(200).json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error("Error updating profile:", err);
        res.status(500).json({ message: "Update failed" });
    }
});

// Change Donor Password
app.put("/api/donor/change-password", async (req, res) => {
    const donorId = req.cookies.donorId;
    const { currentPassword, newPassword } = req.body;

    if (!donorId) return res.status(401).json({ message: "Unauthorized" });

    try {
        const request = new mssql.Request();
        request.input("id", mssql.Int, donorId);

        // Fetch current password hash
        const result = await request.query(`SELECT password_hash FROM Donors WHERE id = @id`);
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const storedHash = result.recordset[0].password_hash;
        const isMatch = await bcrypt.compare(currentPassword, storedHash);

        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        // Update password
        await new mssql.Request()
            .input("id", mssql.Int, donorId)
            .input("newHash", mssql.NVarChar, newHash)
            .query("UPDATE Donors SET password_hash = @newHash WHERE id = @id");

        res.status(200).json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Password update failed:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Get Donation History for Logged-In Donor
app.get("/api/donor/donation-history", async (req, res) => {
    const donorId = req.cookies.donorId;
    if (!donorId) return res.status(401).json({ message: "Unauthorized" });
  
    try {
      const request = new mssql.Request();
      request.input("donorId", mssql.Int, donorId);
  
      const result = await request.query(`
        SELECT date, location, component, status
        FROM DonationCertificates
        WHERE donor_id = @donorId
        ORDER BY date DESC
      `);
  
      res.status(200).json(result.recordset);
    } catch (err) {
      console.error("Error fetching donation history:", err);
      res.status(500).json({ message: "Failed to load donation history" });
    }
  });

//admin login route
app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const request = new mssql.Request();
        request.input("username", mssql.NVarChar, username);

        const result = await request.query(`
            SELECT * FROM AdminUsers WHERE username = @username
        `);

        if (result.recordset.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const admin = result.recordset[0];
        const isMatch = await bcrypt.compare(password, admin.password_hash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Set admin cookie
        res.cookie("adminId", admin.id, {
            httpOnly: true,
            sameSite: "Lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ message: "Login failed" });
    }
});

// Get all donors for admin management
app.get("/api/admin/users", async (req, res) => {
    try {
        const request = new mssql.Request();
        const result = await request.query(`
            SELECT id, username, email FROM Donors
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Admin user fetch error:", err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// Delete user by ID
app.delete("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const request = new mssql.Request();
        await request.query(`DELETE FROM Donors WHERE id = ${id}`);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Failed to delete user" });
    }
});


// Update donor by admin
app.put("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;

    try {
        const request = new mssql.Request();
        await request.query(`
            UPDATE Donors SET 
            username = '${username}', 
            email = '${email}'
            WHERE id = ${id}
        `);
        res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ message: "Failed to update user" });
    }
});

// Admin Dashboard Stats Endpoint
app.get("/api/admin/stats", async (req, res) => {
    try {
        const request = new mssql.Request();

        const usersQuery = await request.query(`SELECT COUNT(*) AS totalUsers FROM Donors`);
        const donationsQuery = await request.query(`SELECT COUNT(*) AS totalDonations FROM DonationCertificates`);
        const pendingQuery = await request.query(`SELECT COUNT(*) AS pendingRequests FROM VoluntaryCamps`);

        const stats = {
            totalUsers: usersQuery.recordset[0].totalUsers,
            totalDonations: donationsQuery.recordset[0].totalDonations,
            pendingRequests: pendingQuery.recordset[0].pendingRequests
        };

        res.status(200).json(stats);
    } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
});

// Admin Delete Donor by ID
app.delete("/api/donor/:id", async (req, res) => {
    const donorId = req.params.id;
  
    try {
      const request = new mssql.Request();
      request.input("id", mssql.Int, donorId);
  
      await request.query("DELETE FROM Donors WHERE id = @id");
  
      res.status(200).json({ message: "Donor deleted successfully" });
    } catch (err) {
      console.error("Error deleting donor:", err);
      res.status(500).json({ message: "Failed to delete donor" });
    }
  });  

// Admin: Get all donation certificate records with donor info
app.get("/api/admin/donations", async (req, res) => {
    try {
        const request = new mssql.Request();
        const result = await request.query(`
            SELECT 
                d.first_name,
                d.last_name,
                dc.date,
                dc.location,
                dc.status
            FROM DonationCertificates dc
            INNER JOIN Donors d ON d.id = dc.donor_id
            ORDER BY dc.date DESC
        `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Error fetching donation records:", err);
        res.status(500).json({ message: "Failed to load donation data" });
    }
});

// Admin password update route
app.put("/api/admin/update-password", async (req, res) => {
    const { oldPassword, newPassword } = req.body;
  
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Both fields are required." });
    }
  
    try {
      const request = new mssql.Request();
      const result = await request.query(`SELECT * FROM Admins WHERE username = 'admin12'`);
      const admin = result.recordset[0];
  
      const isMatch = await bcrypt.compare(oldPassword, admin.password_hash);
      if (!isMatch) return res.status(401).json({ message: "Current password is incorrect." });
  
      const hashed = await bcrypt.hash(newPassword, 10);
      await request.query(`UPDATE Admins SET password_hash = '${hashed}' WHERE username = 'admin12'`);
  
      res.json({ message: "Password updated successfully." });
    } catch (err) {
      console.error("Admin password update error:", err);
      res.status(500).json({ message: "Failed to update password." });
    }
  });

 // ------------------- ADMIN BLOOD REQUEST MANAGEMENT -------------------

// 1. Get all blood requests
app.get("/api/admin/blood-requests", async (req, res) => {
  try {
    const request = new mssql.Request();
    const result = await request.query(`
      SELECT 
        id,
        full_name,
        blood_group,
        component,
        units,
        hospital,
        county,
        status,
        submitted_at,
        required_date,
        mobile,
        email
      FROM BloodRequests
      ORDER BY 
        CASE WHEN status = 'Pending' THEN 0
             WHEN status = 'Approved' THEN 1
             ELSE 2 END, 
        submitted_at DESC
    `);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error fetching blood requests:", err);
    res.status(500).json({ message: "Failed to load blood requests" });
  }
});

// 2. Update request status (approve/reject)
app.put("/api/admin/blood-requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const request = new mssql.Request();
    request.input("status", mssql.VarChar, status);
    request.input("id", mssql.Int, id);

    await request.query(`
      UPDATE BloodRequests SET status = @status WHERE id = @id
    `);

    res.status(200).json({ message: `Request ${status.toLowerCase()} successfully.` });
  } catch (err) {
    console.error("Error updating request status:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});
  

// Register a new blood donation camp
app.post("/api/register-camp", async (req, res) => {
    const {
        orgType, orgName, organizerName, organizerMobile, organizerEmail,
        coOrganizerName, coOrganizerMobile, campName, campAddress,
        county, eircode, contactRole, preferredSlot, refreshments,
        accessibility, expectedUnits, bloodBank, campDate, startTime, endTime,
        participants
    } = req.body;

    // Basic validation
    if (
        !orgType || !orgName || !organizerName || !organizerMobile || !organizerEmail ||
        !campName || !campAddress || !county || !eircode || !contactRole ||
        !preferredSlot || !bloodBank || !campDate || !startTime || !endTime || !participants
    ) {
        return res.status(400).json({ message: "Please fill in all required fields." });
    }

    try {
        const request = new mssql.Request();

        request.input("orgType", mssql.NVarChar, orgType);
        request.input("orgName", mssql.NVarChar, orgName);
        request.input("organizerName", mssql.NVarChar, organizerName);
        request.input("organizerMobile", mssql.NVarChar, organizerMobile);
        request.input("organizerEmail", mssql.NVarChar, organizerEmail);
        request.input("coOrganizerName", mssql.NVarChar, coOrganizerName);
        request.input("coOrganizerMobile", mssql.NVarChar, coOrganizerMobile);
        request.input("campName", mssql.NVarChar, campName);
        request.input("campAddress", mssql.NVarChar, campAddress);
        request.input("county", mssql.NVarChar, county);
        request.input("eircode", mssql.NVarChar, eircode);
        request.input("contactRole", mssql.NVarChar, contactRole);
        request.input("preferredSlot", mssql.NVarChar, preferredSlot);
        request.input("refreshments", mssql.NVarChar, refreshments);
        request.input("accessibility", mssql.NVarChar, accessibility);
        request.input("expectedUnits", mssql.Int, expectedUnits);
        request.input("bloodBank", mssql.NVarChar, bloodBank);
        request.input("campDate", mssql.Date, campDate);
        request.input("startTime", mssql.VarChar, startTime);
        request.input("endTime", mssql.VarChar, endTime);
        request.input("participants", mssql.Int, participants);

        await request.query(`
            INSERT INTO VoluntaryCamps (
                org_type, org_name, organizer_name, organizer_mobile, organizer_email,
                co_organizer_name, co_organizer_mobile, camp_name, camp_address,
                county, eircode, contact_role, preferred_slot, refreshments,
                accessibility, expected_units, blood_bank, camp_date, start_time, end_time,
                estimated_participants
            ) VALUES (
                @orgType, @orgName, @organizerName, @organizerMobile, @organizerEmail,
                @coOrganizerName, @coOrganizerMobile, @campName, @campAddress,
                @county, @eircode, @contactRole, @preferredSlot, @refreshments,
                @accessibility, @expectedUnits, @bloodBank, @campDate, @startTime, @endTime,
                @participants
            )
        `);

        res.status(200).json({ message: "Camp registered successfully!" });
    } catch (err) {
        console.error("Error registering camp:", err);
        res.status(500).json({ message: "Failed to register camp." });
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
