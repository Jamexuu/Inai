# AGENTS.md

## Project Overview

This project is an **offline-first maintenance medicine and meal tracker mobile application** designed primarily for a mother around 55 years old.

The application should feel like a **warm, trustworthy, calm, modern digital companion** that gently helps the user maintain their daily medicine and meal routine.

The application is NOT intended to look like:

- A hospital management system
- A clinical medical dashboard
- A generic healthcare SaaS application
- A fitness tracker
- A corporate enterprise application
- A generic Tailwind/NativeWind template
- A flashy startup application

The emotional direction is:

> "A small digital helper that gently takes care of Mom's daily routine."

Prioritize:

1. Usability
2. Accessibility
3. Offline reliability
4. Clear information
5. Maintainability
6. Clean architecture
7. Warm and modern visual design

Do not sacrifice usability for visual effects.

---

# Technology Stack

Use the following technologies unless there is a strong technical reason to change them.

### Core

- React Native
- TypeScript
- NativeWind

### Local Database

- SQLite

### Local Notifications

- `@notifee/react-native`

### State Management

- Zustand

### Navigation

- React Navigation

Other libraries may be introduced when they provide meaningful value, but avoid unnecessary dependencies.

Before adding a new dependency, consider whether the functionality can reasonably be implemented using the existing stack.

---

# Primary Requirement: Offline-First

The application must be designed as an **offline-first application**.

The important functionality must work without an internet connection.

The application must support:

- App startup without internet
- Viewing medicines without internet
- Adding medicines without internet
- Editing medicines without internet
- Deleting medicines without internet
- Recording medicine intake without internet
- Viewing medicine history without internet
- Recording meals without internet
- Viewing meal history without internet
- Scheduling medicine reminders without internet
- Receiving scheduled medicine reminders without internet

Do not create a fake "offline mode."

The application should simply continue functioning normally when there is no network connection.

---

# Local Data Storage

Use **SQLite** for structured application data.

Do NOT store the entire application database as one large JSON object in AsyncStorage.

SQLite should contain structured data such as:

- User profile
- Medicines
- Medicine schedules
- Medicine logs
- Meals
- Meal logs
- Reminder metadata

For lightweight preferences/settings, use an appropriate lightweight storage solution such as:

- AsyncStorage
- MMKV

Examples of lightweight settings:

- Onboarding completion
- Theme preference
- Notification preferences
- Simple UI preferences

Keep structured relational data in SQLite.

---

# Database Principles

Design a proper relational SQLite database.

Potential entities include:

- UserProfile
- Medicine
- MedicineSchedule
- MedicineLog
- Meal
- MealLog
- Reminder

Use:

- Primary keys
- Foreign keys
- Appropriate indexes
- NOT NULL constraints where appropriate
- Appropriate default values
- Created/updated timestamps
- Referential integrity

Do not create tables unnecessarily.

Each table should have a clear responsibility.

The schema should be designed so that a remote backend can be introduced later without requiring a complete rewrite.

---

# Medicine Tracker

The user must be able to:

- Add medicine
- Edit medicine
- Delete medicine
- View medicine
- Set dosage
- Set frequency
- Set reminder times
- Set start date
- Set end date when appropriate
- Mark medicine as taken
- Mark medicine as skipped
- View upcoming medicines
- View today's medicines
- View medicine history

The most common action should be extremely easy.

For example:

```text
Medicine
Paracetamol
500 mg
8:00 AM

[ Mark as Taken ]
```

Avoid making the user navigate through multiple screens just to mark a medicine as taken.

---

# Medicine Reminder System

Use:

`@notifee/react-native`

for all local medicine notifications.

Do NOT use Firebase Cloud Messaging or remote push notifications for the core medicine reminder functionality.

Medicine reminders must be scheduled **locally on the device**.

The notification must be capable of appearing when:

- The application is closed
- The application is in the background
- The phone is locked
- Wi-Fi is unavailable
- Mobile data is unavailable
- The device has no internet connection

Example:

```text
Internet: OFF
Wi-Fi: OFF
Mobile Data: OFF

        ↓

Phone OS
        ↓
Scheduled Notifee Trigger
        ↓
🔔 Time to take your medicine
```

---

# Notification Architecture

Do NOT directly use Notifee inside React components.

Do NOT put notification scheduling logic inside screens.

Do NOT couple the application's business logic directly to Notifee.

Use an abstraction.

Example:

```ts
interface INotificationProvider {
  scheduleMedicineReminder(reminder: MedicineReminder): Promise<string>;

  cancelMedicineReminder(notificationId: string): Promise<void>;

  cancelAllMedicineReminders(medicineId: string): Promise<void>;

  rescheduleMedicineReminder(reminder: MedicineReminder): Promise<string>;
}
```

Then create a Notifee implementation:

```text
INotificationProvider
        ↓
NotifeeNotificationProvider
        ↓
@notifee/react-native
```

Business logic should depend on the abstraction, not the concrete Notifee implementation.

---

# Notification Requirements

The notification system must support:

- Schedule reminder
- Cancel reminder
- Reschedule reminder
- Update reminder
- Recurring reminders
- Multiple medicines
- Multiple reminder times
- Stable notification identifiers
- Avoiding duplicate notifications

When a medicine is:

### Created

1. Save medicine to SQLite.
2. Save its schedule.
3. Schedule its local notifications.

### Updated

1. Update SQLite.
2. Cancel outdated notifications.
3. Schedule the new notifications.

### Deleted

1. Delete/archive the appropriate database records.
2. Cancel associated notifications.

### Reminder time changed

1. Cancel the old notification.
2. Schedule the new notification.

Do not leave orphaned notifications.

---

# Android Notification Requirements

Consider Android-specific requirements such as:

- Notification permissions
- Notification channels
- Exact alarms
- Battery optimization
- Background restrictions
- Device-specific notification restrictions

For medicine reminders where timing is important, investigate and correctly implement Android exact alarm requirements where applicable.

The application should detect when required permissions/settings are unavailable and guide the user clearly.

Never silently assume notification delivery is guaranteed.

---

# Notification UX

Medicine notifications should be simple and clear.

Example:

```text
💊 Medicine Reminder

Time to take your medicine.

Paracetamol
500 mg
```

If appropriate, support notification actions such as:

- Taken
- Skip
- Remind me later

However, do not add notification actions unless they can be implemented reliably.

---

# Meal Tracker

Users should be able to:

- Record breakfast
- Record lunch
- Record dinner
- Record snacks
- Add notes
- Mark meals as completed
- View today's meals
- View meal history

Meal tracking should be fast.

Do not turn the application into a calorie-counting application.

Do not introduce nutrition analytics unless specifically requested.

The core purpose is:

> Track whether the user maintained their daily meal routine.

---

# Home Dashboard

The Home screen is the most important screen.

It should immediately answer:

> "What do I need to do today?"

Possible information:

```text
Good morning, Mom

Wednesday, October 7

Next medicine
8:00 AM
Paracetamol · 500 mg

Today's medicines
✓ 2 of 3 completed

Today's meals
✓ Breakfast
○ Lunch
○ Dinner
```

The dashboard should prioritize the next important action.

Do not overload the dashboard with information.

---

# UI / UX Direction

The UI should be **motherly inspired**, but not stereotypically feminine.

The design should communicate:

- Warmth
- Care
- Trust
- Calmness
- Familiarity
- Comfort
- Maturity
- Simplicity

It should feel appropriate for a woman around 55 years old.

The design should be modern and polished without being flashy.

---

# NO GRADIENTS

Gradients are prohibited.

Do not use:

- Linear gradients
- Radial gradients
- Gradient backgrounds
- Gradient buttons
- Gradient cards

Use:

- Solid colors
- Subtle borders
- Soft shadows
- Clean surfaces
- Strong typography
- Carefully selected accent colors

---

# Color Palette

Prefer a warm and mature palette inspired by:

- Warm cream
- Soft ivory
- Muted sage
- Gentle terracotta
- Warm peach
- Dusty rose
- Soft brown
- Muted olive

Avoid the generic:

> pink + purple gradient healthcare aesthetic

Do not use too many colors.

Establish:

- Primary color
- Secondary/accent color
- Background color
- Surface color
- Text colors
- Success color
- Warning color
- Error color

Ensure adequate contrast.

---

# Typography

Typography must prioritize readability.

Use:

- Large headings
- Comfortable body text
- Clear labels
- Generous line height
- Strong visual hierarchy

Avoid tiny text.

Avoid overly decorative fonts.

A modern readable sans-serif font is preferred.

Support dynamic font scaling where practical.

---

# Accessibility

Accessibility is a core requirement.

Use:

- Large touch targets
- Readable font sizes
- High contrast
- Clear labels
- Icons accompanied by text where appropriate
- Accessible press states
- Clear error messages
- Clear success states

Do not rely on color alone to communicate status.

For example, do not communicate:

```text
Green = Taken
Red = Missed
```

without also including text/icon information.

The application should remain understandable even for users who have difficulty distinguishing colors.

Avoid requiring gestures for important actions.

---

# Touch Targets

Important controls should have comfortable touch areas.

Avoid:

- Tiny icon-only buttons
- Small text links
- Closely packed controls
- Difficult-to-tap controls

The interface should be comfortable for an older adult to operate.

---

# Visual Style

Use:

- Clean cards
- Moderate rounded corners
- Subtle shadows
- Simple icons
- Comfortable spacing
- Strong hierarchy
- Clear buttons
- Friendly empty states
- Clear confirmation states

Avoid excessive:

- Glassmorphism
- Blur
- Floating elements
- Bouncy animations
- Decorative elements
- Neumorphism
- Heavy shadows
- Excessive rounded containers

---

# Animations

Animations should be subtle and purposeful.

Good examples:

- Completing a medicine
- Completing a meal
- Opening a modal
- Screen transitions
- Success feedback

Avoid:

- Constant motion
- Animated backgrounds
- Excessive bouncing
- Distracting transitions
- Animation that delays important actions

The application should feel calm.

---

# Navigation

Use React Navigation.

Keep navigation simple.

A possible structure is:

```text
Home
Medicines
Meals
History
Settings
```

However, this structure may be changed if research and UX reasoning suggest something better.

Avoid deeply nested navigation.

A 55-year-old user should be able to understand where they are.

---

# Screens

At minimum, implement:

## Onboarding

Keep onboarding short.

Explain:

- Medicine reminders
- Meal tracking
- Offline functionality

Do not create lengthy onboarding.

---

## Home

Show:

- Greeting
- Current date
- Next medicine
- Medicine progress
- Today's meals
- Upcoming reminders
- Quick actions

Prioritize immediate actions.

---

## Medicines

Show:

- Today's medicines
- Upcoming medicines
- Completed medicines
- Missed/skipped medicines

Each medicine must have a clear status.

---

## Add Medicine

Fields may include:

- Medicine name
- Dosage
- Frequency
- Reminder time
- Start date
- End date
- Notes

Prefer native/mobile-friendly controls:

- Date picker
- Time picker
- Segmented controls
- Selectors
- Switches

Avoid forcing users to type information that could be selected.

---

## Medicine History

Show:

- Taken
- Missed
- Skipped

Use simple visual indicators.

Do not create a complicated medical analytics dashboard.

---

## Meals

Show:

- Breakfast
- Lunch
- Dinner
- Snack

Allow quick completion.

---

## Meal History

Show previous meals using a simple list or timeline.

Avoid unnecessary analytics.

---

## Settings

Possible settings:

- Notification settings
- Reminder preferences
- Appearance
- User profile
- Data management
- Backup/export
- About

---

# SOLID PRINCIPLES

SOLID principles are a project requirement.

Do not merely mention SOLID in comments.

Actually structure the application around SOLID principles.

---

## Single Responsibility Principle

Each module should have one clear responsibility.

Examples:

```text
MedicineRepository
→ Database operations for medicines

MedicineService
→ Medicine business rules

NotificationService
→ Notification-related application logic

NotifeeNotificationProvider
→ Notifee-specific implementation

MedicineScreen
→ UI and user interaction
```

Do not create classes/modules that do everything.

---

# Open/Closed Principle

Design services and abstractions so functionality can be extended without constantly modifying unrelated code.

For example, adding another notification provider should not require rewriting medicine business logic.

---

# Liskov Substitution Principle

Implementations of an interface should be interchangeable without breaking application behavior.

For example:

```text
INotificationProvider
       ↑
       |
NotifeeNotificationProvider
```

A future implementation should be able to replace the Notifee provider without changing the medicine service.

---

# Interface Segregation Principle

Avoid giant interfaces.

Prefer small focused interfaces.

For example, do not create:

```ts
interface AppManager {
  manageMedicines();
  manageMeals();
  manageNotifications();
  manageDatabase();
  manageSettings();
}
```

Instead, create focused abstractions.

---

# Dependency Inversion Principle

High-level business logic should depend on abstractions rather than concrete implementations.

For example:

```text
MedicineService
       ↓
INotificationProvider
       ↓
NotifeeNotificationProvider
```

Not:

```text
MedicineService
       ↓
Notifee API
```

The same principle should be considered for database access.

---

# Recommended Architecture

Use a clean architecture appropriate for React Native.

Do not overengineer.

A recommended structure:

```text
src/
├── components/
├── screens/
├── navigation/
├── hooks/
├── services/
├── repositories/
├── database/
├── notifications/
├── models/
├── types/
├── store/
├── utils/
├── constants/
└── assets/
```

This structure may be adjusted if a better organization becomes apparent.

---

# Responsibility Boundaries

## Screens

Screens should handle:

- Rendering
- User interaction
- Calling application services/hooks
- Display state

Screens should NOT directly contain:

- SQL queries
- Notification scheduling implementation
- Complex business rules
- Database implementation details

---

## Components

Components should focus on reusable UI.

Examples:

```text
MedicineCard
MealCard
ReminderCard
StatusBadge
SectionHeader
PrimaryButton
EmptyState
ConfirmationDialog
```

Do not create components unnecessarily.

---

## Services

Services should contain application/business logic.

Examples:

```text
MedicineService
MealService
NotificationService
```

---

## Repositories

Repositories handle data persistence.

Examples:

```text
MedicineRepository
MedicineScheduleRepository
MedicineLogRepository
MealRepository
MealLogRepository
```

The UI should never directly execute SQL.

---

## Database

Keep SQLite-specific implementation inside the database layer.

Do not spread raw SQL throughout the application.

---

# Data Flow

## Adding Medicine

```text
AddMedicineScreen
        ↓
MedicineService
        ↓
MedicineRepository
        ↓
SQLite
        ↓
NotificationService
        ↓
INotificationProvider
        ↓
Notifee
```

---

## Marking Medicine as Taken

```text
User
 ↓
MedicineScreen
 ↓
MedicineService
 ↓
MedicineLogRepository
 ↓
SQLite
 ↓
Update application state
 ↓
UI
```

---

## Updating Medicine Schedule

```text
User
 ↓
EditMedicineScreen
 ↓
MedicineService
 ↓
Update SQLite
 ↓
NotificationService
 ↓
Cancel old notifications
 ↓
Schedule new notifications
```

---

# State Management

Use Zustand for client-side application state when appropriate.

Do not put the entire SQLite database into Zustand.

SQLite remains the source of truth for persistent application data.

Zustand should primarily manage:

- UI state
- Temporary state
- Selected items
- Session state
- Relevant application state

Avoid duplicating persistent database state unnecessarily.

---

# Database as Source of Truth

For persistent data:

```text
SQLite
   ↓
Repository
   ↓
Service
   ↓
State/UI
```

Do not make Zustand the primary database.

---

# Future Backend Synchronization

Version 1 does not require a backend.

However, architecture should allow a backend to be introduced later.

Potential future architecture:

```text
                 MedicineService
                       |
              ┌────────┴────────┐
              ↓                 ↓
       LocalRepository     RemoteRepository
              ↓                 ↓
           SQLite              API
```

The UI should not care where the data comes from.

Do not implement synchronization prematurely unless explicitly requested.

---

# Privacy

The application may contain sensitive health-related information.

Therefore:

- Keep data local by default.
- Do not send medicine data to external services unnecessarily.
- Do not log sensitive medicine information.
- Do not include medicine details in debug logs unless absolutely necessary.
- Avoid third-party analytics that collect sensitive information.
- Consider encrypted local storage/data protection if required later.

---

# Backup and Data Loss

Because data is stored locally, consider the consequences of:

- App deletion
- Device replacement
- Device reset
- Database corruption

A future version may provide:

- Export
- Import
- Backup
- Restore
- Optional cloud synchronization

Do not implement cloud synchronization unless explicitly requested.

---

# Error Handling

Errors should be understandable to the user.

Avoid displaying technical messages such as:

```text
SQLiteConstraintError: SQLITE_CONSTRAINT_FOREIGNKEY
```

Instead, show something like:

> "We couldn't save your medicine. Please try again."

Log technical information only where appropriate for development.

---

# Loading States

Use appropriate loading states.

Avoid blank screens.

Examples:

```text
Loading medicines...
```

or skeleton/loading indicators where appropriate.

Do not overuse loading animations.

---

# Empty States

Empty states should be friendly and actionable.

Example:

```text
No medicines yet

Add your first medicine to start
receiving reminders.

[ Add Medicine ]
```

---

# Confirmation Dialogs

Use confirmations for destructive actions.

For example:

```text
Delete this medicine?

Your existing medicine history
will also be affected.

[ Cancel ]   [ Delete ]
```

Do not require confirmation for harmless actions.

---

# Code Quality

Use:

- TypeScript
- Strict typing
- Meaningful names
- Small functions
- Reusable components
- Clear module boundaries
- Consistent formatting
- Consistent naming conventions

Avoid:

- `any`
- Giant components
- Giant services
- Giant files
- Duplicate business logic
- SQL inside UI
- Notification code inside UI
- Business logic inside JSX
- Magic numbers
- Hardcoded strings scattered throughout the application

---

# TypeScript

Prefer explicit types.

Create domain types such as:

```ts
type Medicine = {
  id: string;
  name: string;
  dosage: string;
  createdAt: string;
  updatedAt: string;
};
```

Use interfaces/types where they improve clarity.

Avoid unnecessary abstractions.

---

# Naming

Use descriptive names.

Prefer:

```text
MedicineRepository
MedicineService
MedicineReminder
NotifeeNotificationProvider
```

Avoid:

```text
Manager
Helper
Utils2
DataHandler
Thing
```

unless the name genuinely represents the responsibility.

---

# React Native Components

Keep components reasonably small.

If a screen becomes too large, extract meaningful components.

Do not split every few lines into a component simply for the sake of componentization.

---

# NativeWind

Use NativeWind consistently for styling.

Prefer reusable style patterns where appropriate.

Avoid large amounts of inline style objects when NativeWind can express the design clearly.

Do not introduce a second styling system without a strong reason.

---

# Design System

Establish reusable design tokens for:

- Colors
- Typography
- Spacing
- Border radius
- Shadows
- Component states

Avoid random values throughout the application.

The design system should maintain consistency.

---

# Component Design

Components should have predictable states.

For example, `MedicineCard` should clearly support:

```text
Upcoming
Taken
Missed
Skipped
```

Each state should be visually understandable.

Do not rely only on color.

---

# User Experience Priorities

When making design decisions, prioritize in this order:

1. Can Mom understand it?
2. Can Mom use it easily?
3. Does it work offline?
4. Is the information clear?
5. Is it accessible?
6. Is it maintainable?
7. Does it look polished?

Visual novelty should never override usability.

---

# Avoid Generic Design

Do not automatically generate common layouts such as:

```text
Header
↓
Huge hero card
↓
Three generic statistic cards
↓
Charts
↓
Recent activity
```

This is a personal daily assistant, not a business dashboard.

Design around the user's daily routine.

The most important information should be immediately visible.

---

# Do Not Overengineer

This is a student project.

Use professional architecture, but keep it understandable.

Do not introduce:

- Microservices
- Event buses
- Excessive design patterns
- Dependency injection frameworks unless necessary
- Complex state management
- GraphQL without a requirement
- Remote synchronization without a requirement
- Unnecessary abstractions

SOLID does not mean creating hundreds of classes.

Use abstractions where they provide real value.

---

# Library Selection Rules

Before installing a library:

1. Determine whether React Native already provides the functionality.
2. Determine whether an existing project dependency already provides it.
3. Prefer mature and actively maintained libraries.
4. Prefer libraries with good TypeScript support.
5. Avoid adding dependencies for trivial functionality.
6. Check compatibility with the current React Native version.
7. Consider Android and iOS support.
8. Consider offline behavior.

The required notification library is:

```text
@notifee/react-native
```

Do not replace it with another notification library unless there is a specific documented technical limitation.

---

# Important Notification Rule

Do not confuse **push notifications** with **local notifications**.

The medicine reminder system uses:

> Local scheduled notifications.

It must NOT depend on:

- Internet
- Firebase Cloud Messaging
- A remote backend
- A server being online

The notification is scheduled locally and delivered by the device's operating system.

---

# Testing

Important functionality should be testable independently.

Prioritize tests for:

- Medicine creation
- Medicine editing
- Medicine deletion
- Medicine schedule generation
- Medicine logging
- Meal logging
- Notification scheduling
- Notification cancellation
- Notification rescheduling
- Duplicate notification prevention
- Offline database operations

Business logic should be testable without rendering the entire UI.

---

# Testing Notification Scenarios

Test at minimum:

### Scenario 1

Internet connected.

```text
Create medicine
→ Schedule notification
→ Notification appears
```

### Scenario 2

Internet disconnected.

```text
Create medicine
→ Schedule notification
→ Close application
→ Wait
→ Notification appears
```

### Scenario 3

Medicine updated.

```text
Old reminder
→ Change reminder time
→ Old notification cancelled
→ New notification scheduled
```

### Scenario 4

Medicine deleted.

```text
Medicine exists
→ Delete medicine
→ Associated notifications cancelled
```

### Scenario 5

Multiple medicines.

```text
Medicine A → 8:00 AM
Medicine B → 8:00 AM
Medicine C → 8:00 PM
```

Ensure notifications do not overwrite each other.

---

# Security

Never hardcode:

- API keys
- Passwords
- Tokens
- Secrets

If a backend is introduced later, use appropriate environment configuration.

Do not commit secrets to Git.

---

# Git Practices

Keep commits focused.

Examples:

```text
feat: add medicine database schema
feat: implement medicine repository
feat: add local medicine reminders
feat: add medicine tracking UI
fix: prevent duplicate medicine notifications
refactor: separate notification provider
```

Avoid commits such as:

```text
update
changes
stuff
final
```

---

# Development Workflow

When implementing a feature:

1. Understand the requirement.
2. Determine whether it affects the data model.
3. Determine the business logic.
4. Determine the UI.
5. Determine whether notifications are affected.
6. Implement database/repository changes.
7. Implement service/business logic.
8. Implement notification changes if necessary.
9. Implement UI.
10. Test offline behavior.
11. Test edge cases.
12. Refactor if necessary.

Do not begin by modifying the UI if the feature requires fundamental data-model changes.

---

# Before Adding Code

Before implementing a feature, inspect the existing project.

Do not blindly create:

- Duplicate services
- Duplicate components
- Duplicate types
- Duplicate repositories
- Duplicate notification handlers

Reuse existing architecture when appropriate.

If the existing architecture conflicts with these guidelines, prefer a small incremental refactor rather than rewriting the entire application.

---

# Implementation Priority

Build the application in this order:

## Phase 1

Project foundation:

- React Native
- TypeScript
- NativeWind
- Navigation
- Basic design system

## Phase 2

Offline database:

- SQLite
- Database initialization
- Migrations
- Repositories
- Domain types

## Phase 3

Medicine management:

- Add medicine
- Edit medicine
- Delete medicine
- Medicine list
- Medicine details

## Phase 4

Notification system:

- Notifee setup
- Notification permissions
- Notification channels
- Reminder scheduling
- Cancellation
- Rescheduling
- Recurring reminders
- Exact alarm considerations

## Phase 5

Medicine history:

- Taken
- Missed
- Skipped
- History

## Phase 6

Meal tracking:

- Breakfast
- Lunch
- Dinner
- Snacks
- Meal history

## Phase 7

Dashboard:

- Today's overview
- Upcoming medicine
- Meal progress
- Quick actions

## Phase 8

Settings:

- Notifications
- Preferences
- Profile
- Data management

## Phase 9

Testing and refinement:

- Offline testing
- Notification testing
- Accessibility
- UX refinement
- Performance
- Error handling

---

# Decision-Making Rules

When multiple technical solutions are possible:

1. Choose the simplest solution that satisfies the requirements.
2. Prefer offline-first.
3. Prefer native mobile behavior.
4. Prefer maintainability.
5. Prefer accessibility.
6. Avoid unnecessary dependencies.
7. Avoid unnecessary abstractions.
8. Keep business logic independent from frameworks/libraries.
9. Keep UI independent from persistence and notification implementations.
10. Explain significant architectural decisions.

---

# Final Product Goal

The finished application should feel like:

> A calm, warm, reliable personal assistant for Mom's everyday medicine and meal routine.

It should be:

- Offline-first
- Reliable
- Accessible
- Easy to understand
- Modern
- Clean
- Warm
- Maintainable
- SOLID
- Privacy-conscious

The application should never feel like a complicated medical system.

The user should be able to open the app and immediately understand:

> **What do I need to do today?**

And when it is time for medicine, the phone should be able to remind the user through a **local Notifee notification even without an internet connection**.
