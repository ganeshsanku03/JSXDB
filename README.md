# 🩸 Blood Script

**Blood Script** is a full‑stack web application that streamlines blood–donation activities across Ireland.  
It lets hospitals check stock, organisers post camps, donors manage their profile & download PDF certificates, and admins keep everything in sync — all from a single, responsive interface.

---

## ✨ Key Features

| Module | What it does |
|--------|--------------|
| **Blood Search Availability** | Real‑time search by county, blood group & component. |
| **Blood Donation Camps** | Public listing of upcoming camps; filter by county. |
| **Donor Portal** | Sign‑up / login, profile editing, password reset, donation history & one‑click PDF certificate generation (jsPDF). |
| **Register Voluntary Blood Camp** | Secure form for NGOs / hospitals to propose new camps (with county + EIR code, slots, accessibility flags, etc.). |
| **Admin Portal** | Dashboard cards, user CRUD, camp approvals, blood‑request triage, and stats (users / donations / pending). |

---

## 🛠️ Tech Stack

* **Frontend**   HTML 5 • CSS 3 • JS  
* **Backend**    Node.js 20 + Express 4  
* **Database**   SQL Server 2019 (T‑SQL)  
* **Auth**       bcryptjs (secure password hashing) + Signed cookies  
* **PDF**        [jsPDF v2.5](https://github.com/parallax/jsPDF) for certificates  
* **Extras**     cookie‑parser • body‑parser • mssql driver

---

## 🚀 Quick Start

```bash
# 1) Clone
git clone https://github.com/ganeshsanku03/JSXDB 
cd blood-script

# 2) Install deps
npm install

# 3) Configure DB creds – create .env (or edit dbConfig in server.js)
cp .env.sample .env            # then edit values
#   DB_SERVER=localhost\SQLEXPRESS
#   DB_NAME=BloodScriptDB
#   DB_USER=bloodadmin
#   DB_PASS=<YOUR_PASSWORD>
#   COOKIE_SECRET=superSecret123

# 4) (First time) run the SQL scripts in /db to create tables & seed data

# 5) Start
npm start     # default: http://localhost:3000


#### Folder Overview ####
blood-script/
├─ db/                   # .sql files (schema & seed data)
├─ img/                  # images & icons
├─ js/                   # front‑end JS files
├─ css/                  # style sheets
├─ server.js             # Express API
├─ *.html                # static pages
└─ README.md
