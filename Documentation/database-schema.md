# Database Schema — Woope

## Users & Auth
- **users** → has one **profile_information**
- **users** → belongs to one **roles**
- **users** → belongs to one **organizations** (as admin)
- **roles** → has many **permissions** (through **role_permissions**)

## Social
- **users** → follow many **users** (through **user_follows**)
- **users** → write many **posts**
- **posts** → belong to one **organizations** (optional)
- **posts** → have many **comments**
- **posts** → have many **post_likes**
- **posts** → have many **post_media**
- **comments** → have many **comment_likes**
- **comments** → can reply to a parent **comment** (self-referencing)

## Organizations & Resources
- **organizations** → have many **category** (through **organizations_category**)
- **organizations** → followed by many **users** (through **user_organization_follows**)
- **organizations** → have many **resources**
- **organizations** → have many **events**
- **resources** → have many **resource_media**

## Events
- **events** → belong to one **organizations**
- **user_event** → personal events created by a **user** (not tied to an org)

## Map
- **pins** → belong to one **users**

## Sensors
- **sensors** → have many **sensor_logs** (stores both TTN and PurpleAir readings)

## Misc
- **otp** — temporary email verification codes, not linked to users table
- **activity** → belongs to one **users**
- **user_actions** → belongs to one **users**
- **weather_observations** — standalone, no relationships
