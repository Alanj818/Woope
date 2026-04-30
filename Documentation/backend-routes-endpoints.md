[//]: # (Tip: Press Cmd+Shift+V in VS Code to view this file rendered)

# API Routes

> **Root:** `Woope`

---

## Auth — `/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Authenticate user with email/phone + password and return tokens |
| POST | `/logout` | Invalidate the current session |
| POST | `/register` | Create a new user account |
| POST | `/refresh-access-token` | Exchange a refresh token for a new access token |
| POST | `/verify-access-token` | Validate an access token |

## OTP — `/otp`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/send-otp` | Send a one-time password to the user's email |
| POST | `/verify-otp` | Verify a submitted OTP code |

## Pins — `/pins`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload a file and return its URL |
| POST | `/pinNew` | Create a new map pin, optionally with an attached image |
| GET | `/pinnew` | Fetch all map pins |
| DELETE | `/pinnew` | Delete a pin (owner or admin only) |
| PUT | `/pinnew` | Update a pin (owner or admin only) |

## Forum Posts — `/forum`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/postswithmedia/:id` | Get all posts with media for a given user |
| GET | `/posts/:id` | Get all posts authored by a user |
| GET | `/:id/posts` | Get a single post by post ID |
| GET | `/posts/user/:id` | Get posts by user ID |
| GET | `/posts/org/:id` | Get posts belonging to an organization |
| GET | `/posts` | Search posts by query string |
| POST | `/posts` | Create a new forum post |
| PUT | `/posts/:id` | Edit a post (owner or admin only) |
| DELETE | `/posts/:id` | Hard-delete a post (owner or admin only) |
| DELETE | `/posts/soft/:id` | Soft-delete a post (owner or admin only) |
| PUT | `/posts/restore/:id` | Restore a soft-deleted post |
| POST | `/posts/:id/like` | Like a post |
| DELETE | `/posts/:id/like` | Unlike a post |
| GET | `/posts/:id/like` | Get all likes on a post |
| GET | `/posts/user/:id/likes` | Get all posts liked by a user |

## Comments — `/comments`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/:post_id` | Get all comments for a post |
| POST | `/` | Create a comment |
| PUT | `/:comment_id` | Edit a comment |
| DELETE | `/:id` | Delete a comment |
| POST | `/:id/like` | Like a comment |
| DELETE | `/:id/unlike` | Unlike a comment |

## Community — `/community`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/get-profile/:user_id` | Get a user's public profile with follower/following counts |
| GET | `/get-user-info/:user_id` | Get basic user info |
| GET | `/search-profile/:name` | Search users by name |
| GET | `/get-followers/:user_id` | List a user's followers |
| GET | `/get-following/:user_id` | List accounts a user follows |
| GET | `/get-follow-status/:user_id/:accessToken` | Check if the caller follows a user |
| POST | `/follow-request` | Follow a user |
| POST | `/un-follow-request` | Unfollow a user |
| POST | `/update-name` | Update the authenticated user's display name |
| POST | `/update-pfp` | Update the authenticated user's profile picture |
| POST | `/update-org` | Update the user's associated organization |
| POST | `/update-role` | Update the user's role |

## Organizations — `/organizations`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/organizations` | List all organizations |
| GET | `/category` | List all organization categories |
| GET | `/organizationsbycategory/:category_name` | Get organizations filtered by category name |
| GET | `/organizationsbycategoryid/:category_id` | Get organizations filtered by category ID |
| GET | `/organizationsbyfollowed/:user_id` | Get organizations followed by a user |
| GET | `/organizationsbyid/:org_id` | Get a single organization by ID |
| GET | `/organizationsbyname/:name` | Get a single organization by name |
| GET | `/featuredorganizations` | Get featured organizations |
| GET | `/isfollowed/:user_id/:org_id` | Check if a user follows an organization |
| POST | `/create` | Create a new organization (admin only) |
| POST | `/follow` | Follow an organization |
| PUT | `/update` | Update organization details (owner or admin only) |
| PUT | `/updatephoto` | Update organization photo (owner or admin only) |
| PUT | `/setfeatured` | Mark an organization as featured |
| PUT | `/removefeatured` | Remove featured status from an organization |
| DELETE | `/unfollow` | Unfollow an organization |
| DELETE | `/deleteorganization` | Delete an organization |

## Resources — `/resources`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/get` | List all resources |
| GET | `/getresourcesbyid/:org_id` | Get resources belonging to an organization |
| GET | `/getresourceinfo/:resource_id` | Get details for a single resource |
| GET | `/getresourcesmedia/:resource_id` | Get media attached to a resource |
| POST | `/create` | Create a resource |
| POST | `/insertMedia` | Attach media to a resource |
| PUT | `/update` | Update a resource |
| PUT | `/updatephoto` | Update a resource's photo |
| DELETE | `/delete` | Delete a resource |
| DELETE | `/deleteMedia` | Remove a media item from a resource |
| DELETE | `/serverDelete` | Server-side delete of a resource file |

## Events — `/events`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/getall/:org_id` | List all events for an organization |
| GET | `/geteventinfo/:event_id` | Get details for a single event |
| GET | `/getdates/:month/:year` | Get all event dates in a given month |
| GET | `/getfolloweddates/:month/:year/:user_id` | Get event dates for organizations a user follows |
| GET | `/getuserdates/:month/:year/:user_id` | Get event dates for a specific user |
| GET | `/getdayevents/:bottom/:top` | Get events within a date range |
| GET | `/getfollowedevents/:bottom/:top/:user_id` | Get followed-org events in a date range |
| GET | `/getuserevents/:bottom/:top/:user_id` | Get a user's events in a date range |
| POST | `/create` | Create an event |
| POST | `/createuserevents` | Associate a user with an event |
| DELETE | `/delete` | Delete an event |
| PUT | `/update` | Update an event |

## TTN Sensors — `/ttn`
Reads from The Things Network (LoRaWAN) sensor data cached in the database.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/devices` | Get latest readings for all registered TTN devices |
| GET | `/devices/:sensorId` | Get the latest reading for a specific TTN device |

## PurpleAir Sensors — `/purpleair`
Manages PurpleAir air-quality sensor registrations and proxies their readings.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sensors` | List all registered PurpleAir sensors |
| POST | `/sensors` | Register a new PurpleAir sensor |
| PUT | `/sensors/:id` | Update a sensor's metadata |
| DELETE | `/sensors/:id` | Soft-delete a sensor |
| GET | `/devices` | Get latest readings for all PurpleAir sensors |
| GET | `/devices/:sensorId` | Get the latest reading for a specific sensor |
| GET | `/devices/:sensorId/history` | Get 30-day reading history for a sensor |

## Roles & Permissions — `/roles`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/roles` | List all roles |
| GET | `/permissions` | List all permissions |
| GET | `/role-permissions/:role_id` | Get permissions assigned to a role |
| GET | `/create/:name` | Create a role by name |
| POST | `/create-role-permission` | Assign a permission to a role |
| DELETE | `/delete/:role_id` | Delete a role |
| DELETE | `/delete-role-permission` | Remove a permission from a role |

## Settings — `/settings`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/poll-interval` | Get the global sensor polling interval config |
| PUT | `/poll-interval` | Update the global sensor polling interval |

## Health — `/health`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Public health check — returns `OK` |
| GET | `/protected-route` | Authenticated health check |

## Report — `/report`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/create` | Submit a report against a piece of content or user |

## Activity — `/activity`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/log-activity` | Log a user activity event |
