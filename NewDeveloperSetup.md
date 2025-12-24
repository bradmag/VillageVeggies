## New Dev Setup

**Goal:** Set up a brand-new Windows computer to run VillageVeggies locally (PostgreSQL + Node/Express backend + static HTML/CSS/JS frontend).

**Shell:** PowerShell (all commands below work in PowerShell).

**Assumptions:** Your repo contains the structure shown above, and `NewVersion/backend/setup_db.js` **creates the database** (and tables) itself. The server runs on **port 3000**.

### Tech Stack
- **Node.js** — JavaScript runtime for the backend.
- **Express.js** — Lightweight routing and middleware.
- **PostgreSQL** — Relational database for all persistent data.
- **pg (node-postgres)** — PostgreSQL client for Node.js.
- **bcrypt** — Secure password hashing for authentication.
- **HTML/CSS/JavaScript** — Simple, framework-free frontend.

---

### Install Git (required for cloning + collaborating)

**Why:** Git is how you pull/push code to GitHub and work with branches/PRs.

1. Install **Git for Windows**: (download + install)

* [https://git-scm.com/download/win](https://git-scm.com/download/win)

2. Verify Git works:

```powershell
git --version
```

3. Set your commit identity (so commits show your name/email):

```powershell
git config --global user.name "Bradley Magee"
git config --global user.email "YOUR_EMAIL_HERE"
```

---

### Install VS Code (recommended editor)

**Why:** VS Code is the easiest way to edit HTML/CSS/JS and Node projects, and it integrates well with Git.

1. Install **VS Code**:

* [https://code.visualstudio.com/](https://code.visualstudio.com/)

2. (Optional) Verify the `code` command works from PowerShell:

```powershell
code --version
```

If `code` is not recognized, open VS Code → Command Palette → **“Shell Command: Install 'code' command in PATH”** (or reinstall VS Code with “Add to PATH” enabled).

---

### Install Node.js using nvm-windows (required for backend)

**Why:** The backend is Node + Express. `npm` installs packages like `express`, `pg`, `bcrypt`, and session middleware.

1. Install **nvm-windows** (download the installer):

* [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)

Close and reopen PowerShell after installing.

2. Verify nvm:

```powershell
nvm version
```

3. Install and use Node LTS (example: Node 20):

```powershell
nvm install 20
nvm use 20
node -v
npm -v
```

---

### Install PostgreSQL (required database)

**Why:** User accounts are stored in PostgreSQL.

1. Install PostgreSQL for Windows:

* [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

During install:

* Set a password for the default `postgres` superuser.
* Keep default port **5432** unless you have a reason to change it.

2. Verify `psql` works:

```powershell
psql --version
```

If `psql` is not recognized, add PostgreSQL’s `bin` folder to your PATH. Common path:
`C:\Program Files\PostgreSQL\<VERSION>\bin`

---

### Create a dedicated PostgreSQL dev user (recommended for consistency)

**Why:** A dedicated role keeps local setups consistent across machines and avoids relying on the `postgres` superuser for app development.

1. Open psql as the `postgres` user:

```powershell
psql -U postgres
```

2. Create a role for dev (pick a username + password you’ll use locally):

```sql
CREATE ROLE villageveggies_dev WITH LOGIN PASSWORD 'YOUR_DEV_DB_PASSWORD';
\q
```

> You only need to do this once per machine.
> Your `setup_db.js` will use this role to create the database (since your script builds the DB).

---

### Clone the repo and check out `dev`

**Why:** This pulls the latest project code and sets you up on the collaboration branch.

1. Choose a folder for development (example: `C:\dev`):

```powershell
mkdir C:\dev
cd C:\dev
```

2. Clone and switch to `dev`:

```powershell
git clone https://github.com/bradmag/VillageVeggies.git
cd VillageVeggies
git checkout dev
git pull
```

3. Open the project in VS Code:

```powershell
code .
```

---

### Install backend dependencies (npm install)

**Why:** Installs everything listed in `backend/package.json`.

```powershell
cd .\NewVersion\backend
npm install
```

---

### Run the database setup script (creates DB + tables)

**Why:** Your `setup_db.js` creates the PostgreSQL database and schema needed for `/auth/register` and `/auth/login`.

From `NewVersion/backend/`:

```powershell
node .\setup_db.js
```

**Verify the script succeeded (recommended checks):**

1. List databases (confirm VillageVeggies DB exists — replace name if your script uses a specific DB name):

```powershell
psql -U postgres -c "\l"
```

2. List tables (confirm `users` exists — replace DB name if needed):

```powershell
psql -U postgres -d villageveggies_dev -c "\dt"
```

3. Confirm the users table is queryable:

```powershell
psql -U postgres -d villageveggies_dev -c "SELECT * FROM users LIMIT 5;"
```

> If your script creates a database name other than `villageveggies_dev`, update the `-d <db_name>` value above to match the name created by `setup_db.js`.

---

### Start the backend server (Express)

**Why:** Your frontend calls the backend endpoints at `http://localhost:3000` (register/login).

From `NewVersion/backend/`:

```powershell
node .\server.js
```

Keep this terminal open while you use the website.

---

### Open the website (frontend)

**Why:** The frontend is static HTML/CSS/JS, so you can open it directly during early development.

In a new PowerShell window:

```powershell
cd C:\dev\VillageVeggies\NewVersion
Start-Process .\index.html
Start-Process .\auth.html
```

> If your frontend makes `fetch()` calls to the backend, the backend must be running in the other window.

---

### Common Windows issues (quick fixes)

**Port 3000 already in use**

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**PostgreSQL connection refused**

* Ensure the PostgreSQL service is running (Windows Services app).
* Confirm you can connect:

```powershell
psql -U postgres -c "SELECT 1;"
```

**`psql` not recognized**

* Add PostgreSQL `bin` folder to PATH, then reopen PowerShell.

**`node` / `npm` not recognized**

* Reopen PowerShell after installing nvm-windows.
* Confirm:

```powershell
nvm use 20
node -v
npm -v
```

**Git line endings / CRLF weirdness**

* Recommended: keep a `.gitattributes` file in the repo with:

  ```
  * text=auto
  ```

  This helps Windows/macOS/Linux collaborate cleanly.
