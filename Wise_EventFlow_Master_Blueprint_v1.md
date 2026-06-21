# Wise EventFlow Core v1.0

## Master Blueprint

## 1. Vision

Wise EventFlow is a mobile-first operations platform for weddings and
live events using GitHub Pages + Google Apps Script + Google Sheets.

## 2. Goals

-   Fast volunteer coordination
-   Zero server cost
-   Installable PWA
-   Offline-friendly
-   Reusable for multiple event types

## 3. User Roles

-   Admin
-   Reception
-   Photography
-   Food
-   Stage
-   Volunteer
-   Viewer

## 4. Functional Modules

Dashboard Groups Add Group Photography Queue Food Queue Requests Search
Settings Statistics

## 5. User Journey

Arrival -\> Add Group -\> Photo Queue -\> Photo Done -\> Food Queue -\>
Food Done -\> Completed

## 6. Database

### Settings

EventName PhotographyOpen FoodOpen Announcement

### Groups

ID QueueNo GroupName Members Category SubCategory Priority PhotoStatus
FoodStatus CurrentStage CurrentLocation Notes AddedBy AddedTime
PhotoTime FoodTime LastModified

### Categories

Category SubCategory Active SortOrder

### Requests

RequestID GroupID RequestedBy Status FoundBy Time

### Users

UserID Name Role Token Active

### ActivityLog

Timestamp User Action GroupID Details

## 7. API

GET: ping settings groups sync search requests stats

POST: addGroup updateGroup photoDone foodDone requestGroup
resolveRequest togglePhotography toggleFood announcement

## 8. Frontend

Vanilla HTML/CSS/JS ES Modules PWA Bottom Navigation

## 9. Folder Structure

docs/ src/ public/ assets/ css/ js/ components/ pages/ config/

## 10. Design System

Primary #0F766E Success #16A34A Warning #F59E0B Danger #DC2626

Typography: 32 Event 22 Section 18 Card 16 Body

## 11. Components

Header StatusCard GroupCard SearchBar BottomNav Modal Toast
RequestBanner

## 12. UX Rules

One tap actions Large touch targets One hand operation No hidden
critical actions Instant feedback

## 13. Sync

Initial load 5 second polling Optimistic updates Local cache Offline
read

## 14. Security

Role tokens Audit log Central API validation

## 15. Testing

Add group Search Edit Photo done Food done Requests Offline Reconnect
Dark mode PWA install

## 16. Deployment

Create Sheet Deploy Apps Script Configure config.js Publish GitHub Pages
Install on volunteer phones

## 17. Claude.md

No React No jQuery No Bootstrap No Tailwind CDN ES Modules only Max file
400 lines Max function 40 lines Reusable components

## 18. Future

TV mode WhatsApp Analytics PDF export Multi-event Plugin architecture

## 19. Milestones

Week1 Foundation Week2 Backend Week3 Frontend Week4 Integration Week5
Testing Week6 Production

## 20. Success Metrics

Load \<2s Add group \<5s Status update \<2 taps 95+ Lighthouse
