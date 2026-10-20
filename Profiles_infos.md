# Ticketa — Demo Accounts & Profiles Reference

> **Web Application:** [http://localhost:3500](http://localhost:3500) (Next.js Frontend)  
> **API Docs / Swagger:** [http://localhost:3501/api](http://localhost:3501/api) (NestJS Backend)  
> **Database:** MongoDB on `localhost:27020` (`ticketa`)

---

## 1. Authentication Credentials Summary

| Role | Username | Email | Password | Responsibilities |
|---|---|---|---|---|
| **Administrator** | Admin Ticketa | `admin@ticketa.com` | `Admin123456!` | Create, update, publish, cancel events; manage reservations |
| **Event Manager** | Sarah Events | `events.manager@ticketa.com` | `Admin123456!` | Event coordination and reservation oversight |
| **Participant (Demo)** | Demo Participant | `participant@ticketa.com` | `Password123456!` | Browse events, reserve tickets, download PDF ticket passes |
| **Participant 2** | Mehdi Alami | `mehdi.alami@gmail.com` | `Password123456!` | Active participant with confirmed tickets |
| **Participant 3** | Yasmine Tazi | `yasmine.tazi@gmail.com` | `Password123456!` | Active participant with confirmed tickets |
| **Participant 4** | Karim Benani | `karim.benani@gmail.com` | `Password123456!` | Active participant with confirmed tickets |
| **Participant 5** | Salma Chraibi | `salma.chraibi@gmail.com` | `Password123456!` | Active participant with confirmed tickets |

---

## 2. Seeded Events Overview

| Event Title | Category / Venue | Date | Price | Capacity & Availability | Status |
|---|---|---|---|---|---|
| **North Africa Tech Summit 2026** | Hyatt Regency, Casablanca | In 25 days | 250 MAD | 215 / 250 tickets | **Published** |
| **Casablanca Jazz & Soul Night** | Théâtre Mohammed VI, Casablanca | In 7 days | 150 MAD | 84 / 120 tickets | **Published** |
| **Modern Frontend & Design Systems Masterclass** | Technopark Auditorium, Casablanca | In 14 days | Free (0 MAD) | 22 / 60 tickets | **Published** |
| **Marrakech Palm Grove Half-Marathon** | Palmerais Gate 3, Marrakech | In 40 days | 180 MAD | 260 / 300 tickets | **Published** |
| **National Esports League Championship** | Mohammed V Sports Arena, Casablanca | In 18 days | 80 MAD | 390 / 450 tickets | **Published** |
| **Future AI & Robotics Global Expo** | Casablanca Finance City Tower | In 90 days | 350 MAD | 150 / 150 tickets | **Draft** |

---

## 3. Re-running the Seed Script
To re-seed or reset Ticketa's data:
```bash
# In projects/Ticketa/backend:
npm run seed
```
