[//]: # (Tip: Press Cmd+Shift+V in VS Code to view this file rendered)

# App Screens

The app has two states: **logged out** and **logged in**. Once logged in, there are 5 tabs at the bottom of the screen.

---

## Logged Out
- **Welcome** — First screen you see. Has buttons to go to Login or Sign Up.
- **Login** — Enter your email/phone and password to sign in. On success you're taken straight into the app.
- **Sign Up** — Create a new account. The process goes:
  1. Fill in your name, email, and password.
  2. Tap submit — a one-time code (OTP) is sent to your email.
  3. Enter the code in the field that appears.
  4. Once verified, your account is created and you're logged in automatically.

---
## Logged In

## Home Tab
The community feed. Think of it like a social media timeline.
- **Feed** — Scrollable list of posts from the community.
  - Tap a post → **Post Detail** — Full post with all comments.
  - Tap write icon → **Create Post** — Write and submit a new post.
  - Tap search icon → **Search Users** — Find other users by name.
    - Tap a user → **Their Profile** — View their posts, followers, following.
  - Tap flag icon → **Bug Report** — Report an issue with the app.

---

## Calendar Tab
View and track events.
- **Calendar** — Monthly calendar. Highlighted dates have events.
  - Tap a date → **Day View** — List of all events happening on that day.

---

## Resources Tab
Browse organizations and the resources they offer.
- **Resource Home** — Landing page for all organizations.
  - **Browse by Category** — Filter organizations by type.
    - Tap a category → **Category Page** — All orgs in that category.
      - Tap an org → **Organization Profile** — Info, events, and resources for that org.
        - Tap a resource → **Resource Detail** — Full info on a specific resource.
  - **Followed Orgs** — Organizations you already follow.
  - **Search** — Search for a specific organization by name.
  - **Events** — Browse upcoming events across organizations.
  - *(Admin only)* **Manage / Create Orgs & Categories** — Add or feature organizations.

---

## Map Tab
- **Map** — Interactive map of the area. Shows air quality sensor locations and community-placed pins.

---

## Profile Tab
Your personal profile and settings.
- **My Profile** — Your posts, follower count, following count.
  - **Edit Profile** — Change your display name, profile picture, or organization.
  - **Followers** — List of people following you.
  - **Following** — List of people you follow.
  - **My Posts** — All posts you've made.
  - **Report** — Report another user.
