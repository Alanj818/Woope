[//]: # (Tip: Press Cmd+Shift+V in VS Code to view this file rendered)

# Admin Panel — woope-admin

> React / Vite web app. Requires a System Admin account to log in. Run at `localhost:5173`.

All pages are protected — you must be logged in as a System Admin to access them.

---

## Pages

### Login
- Email and password form to sign in.

### Home
- Landing page after login with links to the main sections.

### User Manager
- Search for users by name.
- Click a user to open their profile.

### User Profile
- View a user's name, email, phone, date of birth, role, and organization.
- Change the user's role (User, Org Admin, System Admin).
- Change the user's associated organization.
- View all posts made by that user.

### Post Manager
- View and search all community posts.
- Edit the content of any post.
- Delete any post.

### Pin Manager
- View and search all map pins.
- Edit a pin's name, description, label, location, and date.
- Delete any pin.

### Organization Manager
- View and search all organizations.
- Create a new organization (name, tagline, description).
- Mark or unmark an organization as featured.
- Delete an organization.
- Click an organization to open its profile.

### Organization Profile
- View an organization's details (name, tagline, description, created date).
- View and search all posts associated with that organization.

### Sensor Manager
- View all registered sensors across both PurpleAir and TTN sources.
- Add a new sensor (name, sensor ID, latitude, longitude).
- Edit or delete existing sensors.
- Set the global poll interval — how often the API checks PurpleAir for new readings.

### Permission Manager
- View all roles (System Admin, User, Org Admin).
- Create or delete custom roles.
- Assign or remove permissions from any role using checkboxes.
